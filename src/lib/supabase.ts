import { createClient } from '@supabase/supabase-js';

// Your Supabase project configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pcztwzlwceukhitdujry.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase Configuration Check:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✅ Configured' : '❌ MISSING');

let supabase;

if (!supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase anon key');
  console.error('Please add your Supabase anon key to your .env file:');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  
  // Create a dummy client to prevent crashes
  supabase = createClient('https://dummy.supabase.co', 'dummy-key');
} else {
  console.log('✅ Supabase configuration looks good');
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'patient-vault@1.0.0'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
}

export { supabase };

// Enhanced connection test with better error handling and timeout
const testConnection = async () => {
  if (!supabaseAnonKey || supabaseUrl.includes('dummy')) {
    console.warn('⚠️ Skipping connection test - invalid configuration');
    return false;
  }

  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection test timeout')), 8000)
    );
    
    // Test with a simple auth session check
    const connectionPromise = supabase.auth.getSession();
    
    const { data, error } = await Promise.race([connectionPromise, timeoutPromise]) as any;
    
    if (error && error.message.includes('Invalid API key')) {
      console.error('❌ Invalid Supabase API key');
      return false;
    } else if (error && !error.message.includes('session_not_found')) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    } else {
      console.log('✅ Supabase connection test successful');
      return true;
    }
  } catch (err: any) {
    if (err.message === 'Connection test timeout') {
      console.warn('⏰ Supabase connection test timed out');
    } else {
      console.error('❌ Supabase connection test error:', err);
    }
    return false;
  }
};

// Enhanced health check with retry logic
export const checkSupabaseHealth = async (retryCount = 0): Promise<boolean> => {
  const maxRetries = 3;
  
  try {
    const isHealthy = await testConnection();
    
    if (!isHealthy && retryCount < maxRetries) {
      console.log(`🔄 Retrying Supabase health check... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      return checkSupabaseHealth(retryCount + 1);
    }
    
    return isHealthy;
  } catch (error) {
    console.error('❌ Supabase health check failed:', error);
    return false;
  }
};

// Only run connection test if we have valid configuration
if (supabaseAnonKey && !supabaseUrl.includes('dummy')) {
  // Run health check in background
  checkSupabaseHealth().then(isHealthy => {
    if (isHealthy) {
      console.log('🎉 Supabase is ready for use');
    } else {
      console.warn('⚠️ Supabase health check failed - some features may not work');
    }
  });
}

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          name: string;
          age: number | null;
          gender: string | null;
          blood_type: string | null;
          allergies: string[];
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          age?: number | null;
          gender?: string | null;
          blood_type?: string | null;
          allergies?: string[];
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
        };
        Update: {
          name?: string;
          age?: number | null;
          gender?: string | null;
          blood_type?: string | null;
          allergies?: string[];
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
        };
      };
      medical_records: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          doctor_name: string;
          visit_date: string;
          category: 'prescription' | 'lab-results' | 'imaging' | 'checkup' | 'other';
          file_url: string | null;
          file_type: string;
          file_size: string;
          uploaded_at: string;
          weight: number | null;
          height: number | null;
          blood_pressure: string | null;
          heart_rate: number | null;
          blood_sugar: number | null;
        };
        Insert: {
          user_id: string;
          title: string;
          doctor_name: string;
          visit_date: string;
          category: 'prescription' | 'lab-results' | 'imaging' | 'checkup' | 'other';
          file_url?: string | null;
          file_type?: string;
          file_size?: string;
          weight?: number | null;
          height?: number | null;
          blood_pressure?: string | null;
          heart_rate?: number | null;
          blood_sugar?: number | null;
        };
        Update: {
          title?: string;
          doctor_name?: string;
          visit_date?: string;
          category?: 'prescription' | 'lab-results' | 'imaging' | 'checkup' | 'other';
          file_url?: string | null;
          file_type?: string;
          file_size?: string;
          weight?: number | null;
          height?: number | null;
          blood_pressure?: string | null;
          heart_rate?: number | null;
          blood_sugar?: number | null;
        };
      };
      checkups: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          doctor_name: string;
          facility: string;
          date: string;
          time: string;
          duration: number;
          symptoms: string[];
          diagnosis: string;
          treatment: string;
          follow_up_date: string | null;
          vitals: Record<string, any>;
          notes: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          doctor_name: string;
          facility: string;
          date: string;
          time: string;
          duration?: number;
          symptoms?: string[];
          diagnosis: string;
          treatment: string;
          follow_up_date?: string | null;
          vitals?: Record<string, any>;
          notes?: string;
        };
        Update: {
          type?: string;
          doctor_name?: string;
          facility?: string;
          date?: string;
          time?: string;
          duration?: number;
          symptoms?: string[];
          diagnosis?: string;
          treatment?: string;
          follow_up_date?: string | null;
          vitals?: Record<string, any>;
          notes?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string;
          frequency: string;
          prescribed_by: string;
          prescribed_date: string;
          start_date: string;
          end_date: string | null;
          status: 'active' | 'completed' | 'discontinued';
          notes: string;
          side_effects: string[];
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          dosage: string;
          frequency: string;
          prescribed_by: string;
          prescribed_date: string;
          start_date: string;
          end_date?: string | null;
          status?: 'active' | 'completed' | 'discontinued';
          notes?: string;
          side_effects?: string[];
        };
        Update: {
          name?: string;
          dosage?: string;
          frequency?: string;
          prescribed_by?: string;
          prescribed_date?: string;
          start_date?: string;
          end_date?: string | null;
          status?: 'active' | 'completed' | 'discontinued';
          notes?: string;
          side_effects?: string[];
        };
      };
      uploaded_prescriptions: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_url: string;
          uploaded_at: string;
          file_type: string;
          file_size: string;
          status: 'new' | 'analyzed' | 'processing' | 'error';
          ai_summary: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: string;
          status?: 'new' | 'analyzed' | 'processing' | 'error';
          ai_summary?: string | null;
        };
        Update: {
          file_name?: string;
          file_url?: string;
          file_type?: string;
          file_size?: string;
          status?: 'new' | 'analyzed' | 'processing' | 'error';
          ai_summary?: string | null;
        };
      };
    };
  };
}