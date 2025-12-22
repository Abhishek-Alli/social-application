import { supabase } from './supabaseService';

// Supabase Auth Service for Email Verification
export const supabaseAuthService = {
  // Sign up with email (triggers email verification automatically)
  async signUp(email: string, password: string, metadata?: { name?: string; username?: string }) {
    // Use production URL if available, otherwise use current origin
    const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectUrl}`,
        data: metadata // Additional user metadata
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Verify email with OTP (from Supabase email)
  async verifyEmail(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup' // or 'email' for email change
    });
    
    if (error) throw error;
    return data;
  },

  // Resend verification email
  async resendVerificationEmail(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in with password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Get current session/user
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Reset password (sends email)
  async resetPassword(email: string) {
    // Use production URL if available, otherwise use current origin
    const redirectUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}/auth/reset-password`
    });
    
    if (error) throw error;
    return data;
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

