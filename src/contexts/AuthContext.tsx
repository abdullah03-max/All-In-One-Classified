import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import toast from 'react-hot-toast';

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

  // Creates a public.users profile from auth user metadata (called on first login after email verify)
  const ensureProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, any>; phone?: string }) => {
    const meta = authUser.user_metadata || {};
    const role = (meta.role as string) || 'buyer';
    const roles = buildRolesForRole(role);
    const primaryRole = ROLE_PRIORITY.find(r => roles.includes(r as UserRole)) ?? 'buyer';

    // 1. Try upserting all columns (roles, email_verified)
    const { error: firstError } = await supabase.from('users').upsert({
      id: authUser.id,
      email: authUser.email || '',
      full_name: meta.full_name || '',
      phone: meta.phone || authUser.phone || null,
      role: primaryRole,
      roles,
      is_verified: false,
      email_verified: true,
      is_active: true,
    }, { onConflict: 'id' });

    if (!firstError) return;

    console.error('First profile upsert failed:', firstError);

    // 2. If it failed, try without email_verified or roles in case migration is not run yet
    const hasEmailVerifiedError = /email_verified|column.*email_verified/i.test(firstError.message || '');
    const hasRolesError = /roles|column.*roles/i.test(firstError.message || '');

    const fallbackData: Record<string, any> = {
      id: authUser.id,
      email: authUser.email || '',
      full_name: meta.full_name || '',
      phone: meta.phone || authUser.phone || null,
      role: primaryRole,
      is_verified: false,
      is_active: true,
    };

    if (!hasRolesError) {
      fallbackData.roles = roles;
    }
    if (!hasEmailVerifiedError) {
      fallbackData.email_verified = true;
    }

    const { error: fallbackError } = await supabase.from('users').upsert(fallbackData, { onConflict: 'id' });
    if (fallbackError) {
      console.error('Fallback profile upsert failed:', fallbackError);
      
      // 3. Absolute minimum fallback (no roles, no email_verified)
      const { error: finalError } = await supabase.from('users').upsert({
        id: authUser.id,
        email: authUser.email || '',
        full_name: meta.full_name || '',
        phone: meta.phone || authUser.phone || null,
        role: primaryRole,
        is_verified: false,
        is_active: true,
      }, { onConflict: 'id' });
      
      if (finalError) {
        console.error('Final minimum profile upsert failed:', finalError);
      }
    }
  }, []);

  const fetchUser = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data ? normalizeUserRoles(data as User) : null;
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
    const roles = buildRolesForRole(role);
    const primaryRole = normalizeUserRoles({ role: role as UserRole, roles }).role;

    // Store all profile data in user_metadata.
    // The actual public.users profile is created ONLY after email verification in VerifyOtpPage.
    const { error } = await supabase.auth.signUp({
      email,
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
        throw new Error('An account with this email already exists. Please sign in and upgrade your account to seller from your profile.');
      }
      throw error;
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
      if (/roles|column.*roles|Could not find the 'roles' column/i.test(error.message || '')) {
        const fallbackData = { ...profileUpdates };
        delete (fallbackData as Partial<User>).roles;
        const { error: fallbackError } = await supabase
          .from('users')
          .update({ ...fallbackData, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (fallbackError) throw fallbackError;
      } else {
        throw error;
      }
    }

    await refreshUser();
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
