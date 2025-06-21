import React from 'react';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import EmergencyMode from './components/EmergencyMode';
import ShareAccess from './components/ShareAccess';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProfileLoadingFallback from './components/ProfileLoadingFallback';
import { useAuth } from './hooks/useAuth';
import { useMedicalData } from './hooks/useMedicalData';
import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

function App() {
  const { 
    user, 
    loading: authLoading, 
    authError, 
    profileRetryCount,
    signOut, 
    retryProfileFetch 
  } = useAuth();
  
  const { 
    medicalRecords, 
    timelineEvents, 
    loading: dataLoading, 
    addMedicalRecord,
    uploadFile
  } = useMedicalData(user?.id || null);
  
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'emergency' | 'share' | 'reset-password'>('dashboard');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionTimeout, setConnectionTimeout] = useState(false);

  // Check for password recovery hash on mount
  useEffect(() => {
    try {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery') {
        setShowResetPassword(true);
      }
    } catch (error) {
      console.error('Error checking URL hash:', error);
    }
  }, []);

  // Check Supabase connection status with improved error handling and timeout
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          console.log('Missing Supabase environment variables');
          setConnectionStatus('error');
          setAppError('Supabase configuration missing. Please check your environment variables.');
          return;
        }
        
        // Test basic connection with a shorter timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          setConnectionTimeout(true);
        }, 5000); // Reduced to 5 seconds
        
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 404) {
            // 404 is expected for the root endpoint
            setConnectionStatus('connected');
            console.log('Supabase connection successful');
          } else {
            setConnectionStatus('error');
            setAppError('Failed to connect to Supabase. Please check your configuration.');
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            setConnectionStatus('error');
            setAppError('Connection timeout. Please check your internet connection and try again.');
          } else {
            throw fetchError;
          }
        }
      } catch (error: any) {
        console.error('Connection check failed:', error);
        setConnectionStatus('error');
        setAppError('Network error. Please check your internet connection and try again.');
      }
    };

    checkConnection();

    // Set a fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (connectionStatus === 'checking') {
        console.warn('Connection check taking too long, proceeding anyway');
        setConnectionStatus('connected');
      }
    }, 8000); // 8 second fallback

    return () => clearTimeout(fallbackTimeout);
  }, [connectionStatus]);

  // Error boundary effect with improved error handling
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // Don't show error for timeout errors that are already handled
      if (!event.error?.message?.includes('timeout')) {
        setAppError('An unexpected error occurred. Please refresh the page.');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Don't show error for timeout errors that are already handled
      if (event.reason?.message?.includes('Supabase') && !event.reason?.message?.includes('timeout')) {
        setAppError('Database connection error. Please check your internet connection.');
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('App state:', {
      user: user ? 'authenticated' : 'not authenticated',
      authLoading,
      dataLoading,
      showResetPassword,
      appError,
      authError,
      connectionStatus,
      connectionTimeout,
      profileRetryCount
    });
  }, [user, authLoading, dataLoading, showResetPassword, appError, authError, connectionStatus, connectionTimeout, profileRetryCount]);

  // Show connection error screen (including auth errors)
  if (connectionStatus === 'error' || appError) {
    const errorMessage = appError || 'Failed to connect to the database';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          
          {/* Supabase Configuration Help */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">Supabase Setup Required:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
              <li>2. Go to Settings → API</li>
              <li>3. Copy your Project URL and anon public key</li>
              <li>4. Add them to your .env file:</li>
            </ol>
            <div className="bg-gray-800 text-green-400 p-2 rounded mt-2 text-xs font-mono">
              VITE_SUPABASE_URL=your_project_url<br/>
              VITE_SUPABASE_ANON_KEY=your_anon_key
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
            
            {/* Skip connection button for development */}
            <button
              onClick={() => {
                setConnectionStatus('connected');
                setAppError(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Continue without connection (Demo Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while checking connection and authentication
  if (connectionStatus === 'checking' || (authLoading && !connectionTimeout)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading Patient Vault...</p>
          <p className="text-gray-400 text-sm mt-2">
            {connectionStatus === 'checking' ? 'Checking connection...' : 'Checking authentication...'}
          </p>
          
          {/* Show skip option after a few seconds */}
          {connectionTimeout && (
            <button
              onClick={() => {
                setConnectionStatus('connected');
                setAppError(null);
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Continue anyway
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show success message when connected
  if (connectionStatus === 'connected' && !user && !authLoading) {
    console.log('✅ App successfully connected to Supabase');
  }

  // Show reset password page if needed
  if (showResetPassword) {
    return (
      <ResetPasswordPage
        onSuccess={() => {
          setShowResetPassword(false);
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        }}
        onBack={() => {
          setShowResetPassword(false);
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        }}
      />
    );
  }

  // Show home page if not authenticated
  if (!user) {
    return <HomePage onAuthSuccess={() => setCurrentPage('dashboard')} />;
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show emergency mode
  if (currentPage === 'emergency') {
    return (
      <EmergencyMode
        user={user}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  // Show share access
  if (currentPage === 'share') {
    return (
      <ShareAccess
        records={medicalRecords}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  // Show main dashboard with profile loading fallback
  return (
    <div>
      {/* Profile Loading Fallback */}
      <ProfileLoadingFallback
        loading={authLoading}
        error={authError}
        retryCount={profileRetryCount}
        onRetry={retryProfileFetch}
        userName={user?.name}
      />
      
      {/* Main Dashboard */}
      <Dashboard
        user={user}
        records={medicalRecords}
        timelineEvents={timelineEvents}
        loading={dataLoading}
        onLogout={handleLogout}
        onEmergency={() => setCurrentPage('emergency')}
        onShare={() => setCurrentPage('share')}
        onAddRecord={addMedicalRecord}
        onUploadFile={uploadFile}
      />
    </div>
  );
}

export default App;