import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import toast from 'react-hot-toast';
import { usersService } from '../services';

const ROLE_PRIORITY: UserRole[] = ['super_admin', 'admin', 'moderator', 'seller', 'buyer'];

const normalizeUserRoles = (userData: Partial<User> & { role?: string; roles?: string[] | null }): User => {
  const roles = Array.isArray(userData.roles) && userData.roles.length > 0
    ? userData.roles as UserRole[]
    : userData.role ? [userData.role as UserRole] : ['buyer'];

  const primaryRole = ROLE_PRIORITY.find(role => roles.includes(role)) ?? roles[0] ?? 'buyer';

  return {
    ...userData,
    role: primaryRole,
    roles,
  } as User;
};

const buildRolesForRole = (role: string): UserRole[] => {
  if (role === 'seller') return ['seller', 'buyer'];
  if (role === 'buyer') return ['buyer'];
  if (['admin', 'moderator', 'super_admin'].includes(role)) return [role as UserRole];
  return ['buyer'];
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  signInWithOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'email') => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Creates or updates public.users profile safely without triggering 409 Conflict or 406 Not Acceptable errors
  const ensureProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, any>; phone?: string }) => {
    const meta = authUser.user_metadata || {};
    const role = (meta.role as string) || 'buyer';
    const roles = buildRolesForRole(role);
    const primaryRole = ROLE_PRIORITY.find(r => roles.includes(r as UserRole)) ?? 'buyer';

    const userName = meta.full_name || meta.name || meta.preferred_username || (authUser.email ? authUser.email.split('@')[0] : 'Member');

    // Send welcome email ONCE per user
    const triggerWelcomeEmail = async () => {
      if (authUser.email && typeof window !== 'undefined') {
        const emailSentKey = `welcome_email_sent_${authUser.id}`;
        if (!localStorage.getItem(emailSentKey)) {
          localStorage.setItem(emailSentKey, 'true');
          try {
            await usersService.sendWelcomeEmail({ email: authUser.email, name: userName });
          } catch (emailErr) {
            console.error('Welcome email dispatch error:', emailErr);
          }
        }
      }
    };

    // Always reactivate user profile by email to handle re-registration after deletion
    if (authUser.email) {
      await supabase
        .from('users')
        .update({
          is_active: true,
          full_name: userName,
          updated_at: new Date().toISOString()
        })
        .eq('email', authUser.email);
    }

    // 1. Check if user profile already exists to prevent 409 Conflict
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfile) {
      // Profile exists -> perform silent update
      await supabase
        .from('users')
        .update({
          full_name: userName,
          phone: meta.phone || authUser.phone || null,
          role: primaryRole,
          roles,
          is_active: true,
        })
        .eq('id', authUser.id);

      await triggerWelcomeEmail();
      return;
    }

    // 2. Profile does not exist -> insert new profile
    const { error: insertErr } = await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email || '',
      full_name: userName,
      phone: meta.phone || authUser.phone || null,
      role: primaryRole,
      roles,
      is_verified: false,
      email_verified: true,
      is_active: true,
    });

    if (!insertErr) {
      await triggerWelcomeEmail();
      return;
    }

    // 3. Fallback insert without roles/email_verified columns if migration was not run
    const { error: fallbackErr } = await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email || '',
      full_name: userName,
      phone: meta.phone || authUser.phone || null,
      role: primaryRole,
      is_verified: false,
      is_active: true,
    });

    if (!fallbackErr) {
      await triggerWelcomeEmail();
    }
  }, []);

  const fetchUser = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    const normalized = data ? normalizeUserRoles(data as User) : null;
    if (normalized) {
      const local2FA = localStorage.getItem(`2fa_enabled_${id}`);
      if (local2FA !== null) {
        normalized.two_factor_enabled = local2FA === 'true';
      }
      const localNotifs = localStorage.getItem(`notif_prefs_${id}`);
      if (localNotifs) {
        try {
          normalized.notification_preferences = JSON.parse(localNotifs);
        } catch {}
      }
    }
    return normalized;
  }, []);

  // Fetch profile, creating it from metadata if it doesn't exist yet (first login after verify)
  const fetchOrCreateUser = useCallback(async (authUser: { id: string; email?: string; email_confirmed_at?: string | null; user_metadata?: Record<string, any>; phone?: string }) => {
    let profile = await fetchUser(authUser.id);
    if (!profile && authUser.email_confirmed_at) {
      // Profile missing for a verified user — create it now from metadata
      await ensureProfile(authUser);
      profile = await fetchUser(authUser.id);
    }
    return profile;
  }, [fetchUser, ensureProfile]);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const userData = await fetchOrCreateUser(authUser);
      setUser(userData);
      return userData;
    }
    setUser(null);
    return null;
  }, [fetchOrCreateUser]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.email_confirmed_at) {
          // Restore session — create profile if missing (handles page refresh after first verify)
          const userData = await fetchOrCreateUser(session.user);
          if (isMounted) setUser(userData);
        }
      } catch {
        // Silently ignore auth init errors
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        if (!session.user.email_confirmed_at) {
          // Unverified signup — keep on /verify-otp, don't log them in
          if (isMounted) setLoading(false);
          return;
        }
        // Profile created here if missing — this is the single source of truth
        const userData = await fetchOrCreateUser(session.user);
        if (isMounted) {
          setUser(userData);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateUser]);

  // Real-time subscription to auto-update logged-in user profile changes (like verification status)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`realtime:auth_user:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload) => {
          setUser(prev => {
            if (!prev) return null;
            return normalizeUserRoles({ ...prev, ...payload.new } as User);
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Block login for users who have not verified their email
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error('Please verify your email address before logging in. Check your inbox for the verification code.');
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role = 'buyer', phone?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if email already exists in public.users profile database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      throw new Error('This email is already registered. Please sign in instead.');
    }

    // 2. Check check_email_exists RPC function (checks auth.users and public.users)
    try {
      const { data: rpcExists } = await supabase.rpc('check_email_exists', { user_email: cleanEmail });
      if (rpcExists) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
    } catch (rpcErr: any) {
      if (rpcErr?.message?.includes('already registered')) {
        throw rpcErr;
      }
    }

    const roles = buildRolesForRole(role);
    const primaryRole = normalizeUserRoles({ role: role as UserRole, roles }).role;

    // 3. Store all profile data in user_metadata.
    // The actual public.users profile is created ONLY after email verification in VerifyOtpPage.
    const { data: authData, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role: primaryRole,
          roles,
        }
      }
    });

    if (error) {
      if (error.status === 422 || /already exists|already registered|duplicate key/i.test(error.message || '')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw error;
    }

    // 4. Supabase GoTrue returns user.identities: [] when the email is already registered in auth.users
    if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('This email is already registered. Please sign in instead.');
    }

    // DO NOT upsert profile here — profile is created in VerifyOtpPage after email verification
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    if (data.two_factor_enabled !== undefined) {
      localStorage.setItem(`2fa_enabled_${user.id}`, String(data.two_factor_enabled));
    }
    if (data.notification_preferences) {
      localStorage.setItem(`notif_prefs_${user.id}`, JSON.stringify(data.notification_preferences));
    }

    const profileUpdates: Partial<User> = { ...data };

    if (data.role) {
      const roles = buildRolesForRole(data.role);
      profileUpdates.roles = roles;
      profileUpdates.role = normalizeUserRoles({ role: data.role, roles }).role;
    }

    const { error } = await supabase
      .from('users')
      .update({ ...profileUpdates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      // Fallback clean update if schema cache does not have two_factor_enabled, notification_preferences, or roles
      const cleanData: Record<string, any> = { ...profileUpdates };
      delete cleanData.two_factor_enabled;
      delete cleanData.notification_preferences;
      delete cleanData.roles;

      const { error: cleanError } = await supabase
        .from('users')
        .update({ ...cleanData, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (cleanError) {
        console.warn('DB profile update fallback:', cleanError);
      }
    }

    setUser(prev => prev ? {
      ...prev,
      ...data,
      two_factor_enabled: data.two_factor_enabled !== undefined ? data.two_factor_enabled : prev.two_factor_enabled,
      notification_preferences: data.notification_preferences || prev.notification_preferences,
    } : null);

    toast.success('Profile updated successfully');
  };

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const verifyEmailOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'email') => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    if (error) throw error;
    // onAuthStateChange fires SIGNED_IN automatically after verifyOtp succeeds.
    // It calls fetchOrCreateUser which creates the profile and sets user state.
    // No need to call refreshUser() here — that would race with the state change.
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      refreshUser,
      signInWithOtp,
      verifyEmailOtp,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
