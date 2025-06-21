import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileRetryCount, setProfileRetryCount] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let sessionTimeoutId: NodeJS.Timeout;
    let profileTimeoutId: NodeJS.Timeout;

    // Enhanced session check with proper initialization wait
    const getInitialSession = async () => {
      try {
        console.log('🔍 Checking initial session...');
        
        // Set a timeout to prevent hanging on session check
        sessionTimeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⏰ Session check timeout, proceeding anyway');
            setSessionReady(true);
            setLoading(false);
          }
        }, 10000); // Increased to 10 seconds for WebContainer environments
        
        // Wait for Supabase to be fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            if (error.message.includes('Invalid API key')) {
              setAuthError('Invalid Supabase configuration. Please check your API key.');
            } else {
              setAuthError('Failed to connect to authentication service. Please check your internet connection.');
            }
            setSessionReady(true);
            setLoading(false);
          }
          return;
        }

        setSessionReady(true);

        if (session?.user && mounted) {
          console.log('✅ Found existing session for user:', session.user.id);
          setSupabaseUser(session.user);
          
          // Wait a bit more before fetching profile to ensure session is fully ready
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchUserProfileWithRetry(session.user.id);
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error: any) {
        if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
        console.error('❌ Error getting initial session:', error);
        if (mounted) {
          setAuthError('Authentication service unavailable. Please check your internet connection.');
          setSessionReady(true);
        }
      } finally {
        if (mounted) {
          console.log('✅ Auth loading complete');
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      
      try {
        if (session?.user && mounted) {
          setSupabaseUser(session.user);
          setAuthError(null); // Clear any previous auth errors
          setProfileRetryCount(0); // Reset retry count for new session
          
          // Ensure session is ready before fetching profile
          if (sessionReady) {
            await fetchUserProfileWithRetry(session.user.id);
          } else {
            // Wait for session to be ready
            const waitForSession = setInterval(() => {
              if (sessionReady) {
                clearInterval(waitForSession);
                fetchUserProfileWithRetry(session.user.id);
              }
            }, 100);
            
            // Clear interval after 5 seconds to prevent infinite waiting
            setTimeout(() => clearInterval(waitForSession), 5000);
          }
        } else if (mounted) {
          setSupabaseUser(null);
          setUser(null);
          setProfileRetryCount(0);
        }
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        if (mounted) {
          setAuthError('Error during authentication state change. Please try again.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
      if (profileTimeoutId) clearTimeout(profileTimeoutId);
      subscription.unsubscribe();
    };
  }, [sessionReady]);

  // Enhanced profile fetch with better session checking and retry logic
  const fetchUserProfileWithRetry = async (userId: string, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      console.log(`👤 Fetching user profile for: ${userId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // 1. ✅ Session Check Before Profile Fetch
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.warn('⚠️ No valid session found, skipping profile fetch');
        createFallbackUser(userId);
        return;
      }

      // 2. ⏳ Add Retry or Delay Logic - Wait 500ms between retries
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Create a timeout promise with progressive timeout
      const baseTimeout = 8000; // Increased base timeout for WebContainer
      const currentTimeout = baseTimeout + (retryCount * 2000); // 8s, 10s, 12s
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), currentTimeout)
      );
      
      // 3. 🧱 Wrap Profile Fetch in Try/Catch
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // Race between the fetch and timeout
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        
        // If it's a network/timeout error and we haven't exceeded max retries, try again
        if (retryCount < maxRetries && 
            (error.message.includes('network') || 
             error.message.includes('timeout') || 
             error.message.includes('fetch') ||
             error.message.includes('connection'))) {
          
          console.log(`🔄 Retrying profile fetch in 500ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
          setProfileRetryCount(retryCount + 1);
          
          setTimeout(() => {
            fetchUserProfileWithRetry(userId, retryCount + 1);
          }, 500);
          return;
        }
        
        // If we've exhausted retries or it's a different error
        console.warn('❌ Profile fetch failed after retries, using fallback user');
        setAuthError('Could not load your profile. Please refresh.');
        createFallbackUser(userId);
        return;
      }

      if (data) {
        console.log('✅ User profile loaded successfully');
        setAuthError(null); // Clear any previous errors
        setProfileRetryCount(0); // Reset retry count on success
        
        const userProfile: User = {
          id: data.id,
          name: data.name,
          email: supabaseUser?.email || '',
          age: data.age || 0,
          gender: data.gender || '',
          bloodType: data.blood_type || '',
          allergies: data.allergies || [],
          emergencyContact: {
            name: data.emergency_contact_name || '',
            phone: data.emergency_contact_phone || '',
            relationship: data.emergency_contact_relationship || '',
          },
        };
        setUser(userProfile);
      } else {
        console.log('ℹ️ User profile not found - creating new user profile');
        setAuthError(null);
        createFallbackUser(userId);
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      
      // If it's a timeout and we haven't exceeded max retries, try again
      if (error.message === 'Profile fetch timeout' && retryCount < maxRetries) {
        console.log(`🔄 Profile fetch timed out, retrying in 500ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        setProfileRetryCount(retryCount + 1);
        
        setTimeout(() => {
          fetchUserProfileWithRetry(userId, retryCount + 1);
        }, 500);
        return;
      }
      
      // If we've exhausted retries or it's a different error
      console.warn('❌ Profile fetch failed completely, using fallback user');
      
      if (error.message === 'Profile fetch timeout') {
        setAuthError('Could not load your profile. Please refresh.');
      } else {
        setAuthError('Could not load your profile. Please refresh.');
      }
      
      setProfileRetryCount(0);
      createFallbackUser(userId);
    }
  };

  // Create a fallback user when profile fetch fails
  const createFallbackUser = (userId: string) => {
    console.log('🔄 Creating fallback user profile');
    
    const fallbackUser: User = {
      id: userId,
      name: supabaseUser?.email?.split('@')[0] || 'User',
      email: supabaseUser?.email || '',
      age: 0,
      gender: '',
      bloodType: '',
      allergies: [],
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    };
    
    setUser(fallbackUser);
    
    // 5. 🌐 WebContainer fallback - Try to create a basic profile for future use
    if (sessionReady) {
      createBasicProfile(userId, fallbackUser);
    }
  };

  // Create a basic profile in the database
  const createBasicProfile = async (userId: string, userData: User) => {
    try {
      console.log('📝 Creating basic profile in database...');
      
      // Check session before creating profile
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No session available for profile creation');
        return;
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          name: userData.name,
          age: userData.age || null,
          gender: userData.gender || null,
          blood_type: userData.bloodType || null,
          allergies: userData.allergies || [],
          emergency_contact_name: userData.emergencyContact.name || null,
          emergency_contact_phone: userData.emergencyContact.phone || null,
          emergency_contact_relationship: userData.emergencyContact.relationship || null,
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.warn('⚠️ Could not create basic profile:', error);
      } else {
        console.log('✅ Basic profile created successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error creating basic profile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log('📝 Attempting to sign up user:', email);
      setAuthError(null); // Clear any previous errors
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ User signed up successfully, creating profile...');
        
        // Create user profile with retry logic
        const createProfile = async (retryCount = 0) => {
          try {
            // Wait for session to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                name: userData.name,
                age: parseInt(userData.age),
                gender: userData.gender,
                blood_type: userData.bloodType,
                allergies: userData.allergies.split(',').map((a: string) => a.trim()).filter(Boolean),
                emergency_contact_name: userData.emergencyName,
                emergency_contact_phone: userData.emergencyPhone,
                emergency_contact_relationship: userData.emergencyRelationship,
              });

            if (profileError) {
              if (retryCount < 2) {
                console.log(`🔄 Profile creation failed, retrying... (attempt ${retryCount + 2}/3)`);
                setTimeout(() => createProfile(retryCount + 1), 1000);
                return;
              }
              throw profileError;
            }
            
            console.log('✅ User profile created successfully');
          } catch (error) {
            console.error('❌ Profile creation error:', error);
            if (retryCount >= 2) {
              throw error;
            }
          }
        };

        await createProfile();
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign up process failed:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting to sign in user:', email);
      setAuthError(null); // Clear any previous errors
      setProfileRetryCount(0); // Reset retry count
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
      } else {
        console.log('✅ Sign in successful');
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Sign in process failed:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setSupabaseUser(null);
        setAuthError(null); // Clear any auth errors on logout
        setProfileRetryCount(0); // Reset retry count
        setSessionReady(false); // Reset session ready state
        console.log('✅ Sign out successful');
      } else {
        console.error('❌ Sign out error:', error);
      }
      return { error };
    } catch (error) {
      console.error('❌ Sign out process failed:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('📧 Sending password reset email to:', email);
      setAuthError(null); // Clear any previous errors
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#type=recovery`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
      } else {
        console.log('✅ Password reset email sent successfully');
      }

      return { data, error };
    } catch (error) {
      console.error('❌ Password reset process failed:', error);
      return { data: null, error };
    }
  };

  // Retry profile fetch manually (for UI retry buttons)
  const retryProfileFetch = async () => {
    if (supabaseUser?.id && sessionReady) {
      setAuthError(null);
      setProfileRetryCount(0);
      setLoading(true);
      await fetchUserProfileWithRetry(supabaseUser.id);
      setLoading(false);
    } else {
      console.warn('⚠️ Cannot retry profile fetch: session not ready or no user');
      setAuthError('Session not ready. Please try again in a moment.');
    }
  };

  return {
    user,
    supabaseUser,
    loading,
    authError,
    profileRetryCount,
    signUp,
    signIn,
    signOut,
    resetPassword,
    retryProfileFetch,
  };
};