import { supabase } from '../lib/supabase';
import { Notification, Bookmark, Offer, Report } from '../types';
import { CATEGORIES } from '../utils/constants';

// Re-export verificationService from its dedicated file
export { verificationService } from './verificationService';

// Re-export CATEGORIES as VIRTUAL_CATEGORIES for admin sync functionality
export const VIRTUAL_CATEGORIES = CATEGORIES;

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notificationsService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data as Notification[];
  },

  async markRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async markAllRead(userId: string): Promise<void> {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  },

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    await supabase.from('notifications').insert(notification);
  },

  subscribeToNotifications(userId: string, onNotification: (n: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => onNotification(payload.new as Notification)
      )
      .subscribe();
  },
};

// ============================================================
// BOOKMARKS
// ============================================================
export const bookmarksService = {
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`*, listing:listings(*, category:categories!listings_category_id_fkey(id, name, slug, icon, color), seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified))`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Bookmark[];
  },

  async addBookmark(userId: string, listingId: string): Promise<void> {
    await supabase.from('bookmarks').insert({ user_id: userId, listing_id: listingId });
  },

  async removeBookmark(userId: string, listingId: string): Promise<void> {
    await supabase.from('bookmarks').delete().eq('user_id', userId).eq('listing_id', listingId);
  },

  async isBookmarked(userId: string, listingId: string): Promise<boolean> {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();
    return !!data;
  },
};

// ============================================================
// OFFERS
// ============================================================
export const offersService = {
  async getOffers(userId: string): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select(`*, listing:listings(id, title, images, price, currency), buyer:users!offers_buyer_id_fkey(id, full_name, avatar_url)`)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Offer[];
  },

  async createOffer(offer: Omit<Offer, 'id' | 'created_at'>): Promise<Offer> {
    const { data, error } = await supabase.from('offers').insert(offer).select().single();
    if (error) throw error;
    return data as Offer;
  },

  async updateOfferStatus(id: string, status: Offer['status']): Promise<void> {
    const { error } = await supabase.from('offers').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// REPORTS
// ============================================================
export const reportsService = {
  async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select(`*, listing:listings(id, title, images), reporter:users!reports_reporter_id_fkey(id, full_name, avatar_url)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Report[];
  },

  async createReport(report: Omit<Report, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase.from('reports').insert(report);
    if (error) throw error;
  },

  async updateReport(id: string, updates: Partial<Report>): Promise<void> {
    const { error } = await supabase.from('reports').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// CATEGORIES
// ============================================================
export const categoriesService = {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },
};

// ============================================================
// USERS (Admin)
// ============================================================
export const usersService = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: Record<string, unknown>) {
    const updatedData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    if (typeof updates.role === 'string') {
      updatedData.roles = (updates.role === 'seller' ? ['buyer', 'seller'] : [updates.role]) as string[];
    }
    const { error } = await supabase.from('users').update(updatedData).eq('id', id);
    if (error) throw error;
  },

  async deleteUser(id: string) {
    const { error } = await supabase.rpc('delete_user_by_admin', {
      target_user_id: id
    });
    if (error) throw error;
  },

  async uploadAvatar(file: File, userId: string): Promise<string> {
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      return publicUrl;
    } catch {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  },

  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // 1. Set user status as deactivated (is_active = false) in public.users table
      await supabase.from('users').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', userId);
      // 2. Suspend all active listings for this user
      await supabase.from('listings').update({ status: 'suspended' }).eq('seller_id', userId);
      // 3. Delete user's bookmarks and notifications
      await Promise.allSettled([
        supabase.from('bookmarks').delete().eq('user_id', userId),
        supabase.from('notifications').delete().eq('user_id', userId),
      ]);
    } catch (err) {
      console.error('deleteUserAccount error:', err);
    }
  },

  async createAdmin(params: { email: string; name: string; phone?: string; password: string }): Promise<string> {
    const userPassword = params.password;

    const { data: inviteId, error } = await supabase.rpc('invite_user_by_admin', {
      user_email: params.email,
      user_full_name: params.name,
      user_phone: params.phone || null,
      user_role: 'admin',
      user_password: userPassword
    });
    if (error) throw error;

    // Send email via Edge Function
    const inviteLink = `${window.location.origin}/login/admin?email=${encodeURIComponent(params.email)}`;
    const emailBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 24px; font-weight: bold; color: #2563eb;">All in one</span>
            <span style="font-size: 24px; font-weight: bold; color: #1e293b;">Marketplace</span>
          </div>
          <div style="height: 4px; width: 60px; background: linear-gradient(90deg, #2563eb, #8b5cf6); margin: 0 auto; border-radius: 2px;"></div>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Welcome to the Team, ${params.name}!</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            You have been invited to join the platform as a staff member. Your account has been created with the role of <strong style="color: #2563eb;">Admin</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
            <div style="font-family: monospace; font-size: 14px; color: #0f172a; line-height: 1.8;">
              <strong>Email Address:</strong> ${params.email}<br/>
              <strong>Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${userPassword}</code>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">Sign In to Admin Portal</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
          <p>© 2026 All in one Marketplace. All rights reserved.</p>
        </div>
      </div>
    `;

    const plainText = `Welcome to the Team, ${params.name}!\n\nYou have been added as an Admin to All in One Marketplace.\n\nYour Credentials:\nEmail: ${params.email}\nPassword: ${userPassword}\n\nLogin URL: ${inviteLink}`;

    try {
      const { data: resData, error: resError } = await supabase.functions.invoke('send-email', {
        body: {
          to: params.email,
          subject: `Welcome ${params.name} - Admin Access Credentials`,
          text: plainText,
          html: emailBody
        }
      });
      if (resError) {
        console.error('❌ Edge function returned error:', resError);
      } else {
        console.log('✅ Edge function success:', resData);
      }
    } catch (fnErr) {
      console.error('❌ Edge function invocation threw error:', fnErr);
    }

    return inviteId;
  },

  async createModerator(params: { email: string; name: string; phone?: string; password: string }): Promise<string> {
    const userPassword = params.password;

    const { data: inviteId, error } = await supabase.rpc('invite_user_by_admin', {
      user_email: params.email,
      user_full_name: params.name,
      user_phone: params.phone || null,
      user_role: 'moderator',
      user_password: userPassword
    });
    if (error) throw error;

    // Send email via Edge Function
    const inviteLink = `${window.location.origin}/login/moderator?email=${encodeURIComponent(params.email)}`;
    const emailBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 24px; font-weight: bold; color: #10b981;">All in one</span>
            <span style="font-size: 24px; font-weight: bold; color: #1e293b;">Marketplace</span>
          </div>
          <div style="height: 4px; width: 60px; background: linear-gradient(90deg, #10b981, #8b5cf6); margin: 0 auto; border-radius: 2px;"></div>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Welcome to the Team, ${params.name}!</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            You have been invited to join the platform as a staff member. Your account has been created with the role of <strong style="color: #10b981;">Moderator</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
            <div style="font-family: monospace; font-size: 14px; color: #0f172a; line-height: 1.8;">
              <strong>Email Address:</strong> ${params.email}<br/>
              <strong>Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${userPassword}</code>
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">Sign In to Moderator Portal</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
          <p>© 2026 All in one Marketplace. All rights reserved.</p>
        </div>
      </div>
    `;

    const plainText = `Welcome to the Team, ${params.name}!\n\nYou have been added as a Moderator to All in One Marketplace.\n\nYour Credentials:\nEmail: ${params.email}\nPassword: ${userPassword}\n\nLogin URL: ${inviteLink}`;

    try {
      const { data: resData, error: resError } = await supabase.functions.invoke('send-email', {
        body: {
          to: params.email,
          subject: `Welcome ${params.name} - Moderator Access Credentials`,
          text: plainText,
          html: emailBody
        }
      });
      if (resError) {
        console.error('❌ Edge function returned error:', resError);
      } else {
        console.log('✅ Edge function success:', resData);
      }
    } catch (fnErr) {
      console.error('❌ Edge function invocation threw error:', fnErr);
    }

    return inviteId;
  },

  async updateAdmin(id: string, params: { email: string; name: string; phone?: string; password?: string }) {
    const { error } = await supabase.rpc('update_admin_user', {
      target_user_id: id,
      new_email: params.email,
      new_full_name: params.name,
      new_phone: params.phone || null,
      new_password: params.password || null
    });
    if (error) throw error;
  },

  async sendWelcomeEmail(params: { email: string; name: string }) {
    if (!params.email) return;

    const appOrigin = typeof window !== 'undefined' && window.location.origin.includes('localhost')
      ? 'https://all-in-one-classified.vercel.app'
      : (typeof window !== 'undefined' ? window.location.origin : 'https://all-in-one-classified.vercel.app');

    const getStartedUrl = appOrigin;
    const supportUrl = `${appOrigin}/contact`;
    const userName = params.name || 'Valued Member';

    const emailBody = `
      <div style="font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; padding: 24px; color: #111827; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #1d4ed8; margin: 0 0 16px 0;">All in One Marketplace</h2>
        <p style="font-size: 14px; line-height: 1.5; margin: 0 0 12px 0;">Hello ${userName},</p>
        <p style="font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">Your account registration is verified and complete. You can access your account below:</p>
        <div style="margin: 20px 0;">
          <a href="${getStartedUrl}" style="background-color: #1d4ed8; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Access Account</a>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">If you need assistance, contact support: ${supportUrl}</p>
      </div>
    `;

    const plainText = `Hello ${userName},\n\nYour account registration is verified and complete. Access your account: ${getStartedUrl}\nSupport: ${supportUrl}`;

    try {
      const { data: resData, error: resError } = await supabase.functions.invoke('send-email', {
        body: {
          to: params.email,
          subject: `Security Notice: Account Registration Verified for ${userName}`,
          text: plainText,
          html: emailBody
        }
      });
      if (resError) {
        console.error('❌ Welcome email error:', resError);
      } else {
        console.log('✅ Welcome email sent successfully:', resData);
      }
    } catch (err) {
      console.error('❌ Welcome email invocation error:', err);
    }
  },
};

// ============================================================
// PAYMENTS
// ============================================================
export const paymentsService = {
  async getPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`*, user:users!payments_user_id_fkey(id, full_name, email)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createPayment(payment: Record<string, unknown>) {
    const { data, error } = await supabase.from('payments').insert(payment).select().single();
    if (error) throw error;
    return data;
  },

  async updatePayment(id: string, updates: Record<string, unknown>) {
    const { error } = await supabase.from('payments').update(updates).eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// ANALYTICS
// ============================================================
export const analyticsService = {
  async getDashboardStats() {
    const [listings, users, payments] = await Promise.all([
      supabase.from('listings').select('status', { count: 'exact' }),
      supabase.from('users').select('role', { count: 'exact' }),
      supabase.from('payments').select('amount, status'),
    ]);

    const totalRevenue = (payments.data || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      total_listings: listings.count || 0,
      total_users: users.count || 0,
      total_revenue: totalRevenue,
      listings_by_status: listings.data || [],
    };
  },
};
