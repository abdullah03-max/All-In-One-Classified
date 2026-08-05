import { supabase } from '../lib/supabase';
import { VerificationApplication } from '../types';

export const verificationService = {
  // Get the latest application for a user
  async getLatestApplication(userId: string): Promise<VerificationApplication | null> {
    const { data, error } = await supabase
      .from('verification_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest application:', error);
      throw error;
    }
    return data && data.length > 0 ? (data[0] as VerificationApplication) : null;
  },

  // Get full application history for a user
  async getApplicationHistory(userId: string): Promise<VerificationApplication[]> {
    const { data, error } = await supabase
      .from('verification_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching application history:', error);
      throw error;
    }
    return data as VerificationApplication[];
  },

  // Submit a new application
  async submitApplication(
    userId: string,
    app: Omit<VerificationApplication, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<VerificationApplication> {
    const { data, error } = await supabase
      .from('verification_applications')
      .insert({
        user_id: userId,
        full_name: app.full_name,
        cnic_number: app.cnic_number,
        dob: app.dob,
        phone: app.phone,
        city: app.city,
        cnic_front_url: app.cnic_front_url,
        cnic_back_url: app.cnic_back_url,
        selfie_url: app.selfie_url,
        address: app.address || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error submitting verification application:', error);
      throw error;
    }
    return data as VerificationApplication;
  },

  // Get all applications for admins/moderators
  async getAllApplications(): Promise<VerificationApplication[]> {
    const { data, error } = await supabase
      .from('verification_applications')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
    return data as unknown as VerificationApplication[];
  },

  // Update application status (approve / reject)
  async updateApplicationStatus(
    id: string,
    targetUserId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<void> {
    // 1. Update the application status
    const { error: appError } = await supabase
      .from('verification_applications')
      .update({
        status,
        rejection_reason: status === 'rejected' ? rejectionReason : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (appError) throw appError;

    // 2. Update user's is_verified flag
    const { error: userError } = await supabase
      .from('users')
      .update({
        is_verified: status === 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    if (userError) throw userError;
  },

  // Upload CNIC or selfie image to Supabase storage
  async uploadDocument(file: File, docType: 'front' | 'back' | 'selfie', userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `kyc/${userId}/${Date.now()}_${docType}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Document upload error:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('listing-images').getPublicUrl(fileName);
    return data.publicUrl;
  },

  // Real-time subscription for verification applications (for admin view)
  subscribeToApplications(onChange: (payload: any) => void) {
    return supabase
      .channel('realtime:verification_applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_applications' },
        (payload) => onChange(payload)
      )
      .subscribe();
  },

  // Real-time subscription for a user's verification application
  subscribeToUserApplication(userId: string, onChange: (payload: any) => void) {
    return supabase
      .channel(`realtime:user_verification:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'verification_applications', filter: `user_id=eq.${userId}` },
        (payload) => onChange(payload)
      )
      .subscribe();
  },
};
