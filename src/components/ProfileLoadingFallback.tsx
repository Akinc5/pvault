import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, AlertTriangle, User, Wifi, WifiOff } from 'lucide-react';

interface ProfileLoadingFallbackProps {
  loading: boolean;
  error: string | null;
  retryCount: number;
  onRetry: () => void;
  userName?: string;
}

const ProfileLoadingFallback: React.FC<ProfileLoadingFallbackProps> = ({
  loading,
  error,
  retryCount,
  onRetry,
  userName
}) => {
  if (!loading && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {loading ? (
            <div className="p-2 bg-blue-100 rounded-lg">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          ) : (
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {loading ? 'Loading Profile...' : error ? 'Profile Load Issue' : 'Profile Loaded'}
              </h3>
              
              <div className="mt-1 space-y-1">
                {loading && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Fetching your medical profile data...
                    </p>
                    {retryCount > 0 && (
                      <p className="text-xs text-blue-600">
                        Retry attempt {retryCount}/3 - Please wait...
                      </p>
                    )}
                  </div>
                )}
                
                {error && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {error}
                    </p>
                    {userName && (
                      <p className="text-xs text-gray-500">
                        Currently using basic profile for: {userName}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <WifiOff className="w-3 h-3" />
                      <span>Check your internet connection</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </motion.button>
            )}
          </div>
          
          {loading && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <motion.div
                  className="bg-blue-600 h-1.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileLoadingFallback;