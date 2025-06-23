import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Clock, TrendingUp, Zap, Scale, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User as UserType } from '../../types';

interface HeartRateData {
  heart_rate: number;
  updated_at: string;
  source?: string;
}

interface BMIData {
  weight: number;
  height: number;
  bmi: number;
  category: string;
  updated_at: string;
}

interface HeartRateVisualizationProps {
  user: UserType | null;
  className?: string;
}

const HeartRateVisualization: React.FC<HeartRateVisualizationProps> = ({ 
  user, 
  className = '' 
}) => {
  const [heartRateData, setHeartRateData] = useState<HeartRateData | null>(null);
  const [bmiData, setBmiData] = useState<BMIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBeating, setIsBeating] = useState(false);
  const [ecgPoints, setEcgPoints] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ecgIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate BMI and category
  const calculateBMI = (weight: number, height: number) => {
    const bmi = weight / ((height / 100) ** 2);
    let category = '';
    
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';
    
    return { bmi: Math.round(bmi * 10) / 10, category };
  };

  // Get BMI category color
  const getBMIColor = (category: string) => {
    switch (category) {
      case 'Underweight': return { color: 'text-blue-400', bgColor: 'bg-blue-500/20', barColor: '#3b82f6' };
      case 'Normal': return { color: 'text-green-400', bgColor: 'bg-green-500/20', barColor: '#10b981' };
      case 'Overweight': return { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', barColor: '#f59e0b' };
      case 'Obese': return { color: 'text-red-400', bgColor: 'bg-red-500/20', barColor: '#ef4444' };
      default: return { color: 'text-gray-400', bgColor: 'bg-gray-500/20', barColor: '#6b7280' };
    }
  };

  // Get BMI position on scale (0-100%)
  const getBMIPosition = (bmi: number) => {
    // Scale: 15 (min) to 40 (max) BMI
    const minBMI = 15;
    const maxBMI = 40;
    const position = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  // Fetch heart rate and BMI data from Supabase - ONLY USER PROVIDED DATA
  useEffect(() => {
    if (!user?.id) return;

    const fetchHealthData = async () => {
      try {
        setLoading(true);
        
        // Fetch heart rate and BMI data from medical records
        const { data: medicalData, error: medicalError } = await supabase
          .from('medical_records')
          .select('heart_rate, weight, height, uploaded_at')
          .eq('user_id', user.id)
          .or('heart_rate.not.is.null,weight.not.is.null,height.not.is.null')
          .order('uploaded_at', { ascending: false })
          .limit(5);

        let foundHeartRate = false;
        let foundBMI = false;

        if (!medicalError && medicalData && medicalData.length > 0) {
          // Look for heart rate data
          for (const record of medicalData) {
            if (record.heart_rate && !foundHeartRate) {
              setHeartRateData({
                heart_rate: record.heart_rate,
                updated_at: record.uploaded_at,
                source: 'Medical Record'
              });
              foundHeartRate = true;
            }

            // Look for BMI data (need both weight and height)
            if (record.weight && record.height && !foundBMI) {
              const { bmi, category } = calculateBMI(record.weight, record.height);
              setBmiData({
                weight: record.weight,
                height: record.height,
                bmi,
                category,
                updated_at: record.uploaded_at
              });
              foundBMI = true;
            }

            if (foundHeartRate && foundBMI) break;
          }
        }

        // If no heart rate found in medical records, check checkups
        if (!foundHeartRate) {
          const { data: checkupData, error: checkupError } = await supabase
            .from('checkups')
            .select('vitals, created_at')
            .eq('user_id', user.id)
            .not('vitals', 'is', null)
            .order('created_at', { ascending: false })
            .limit(5);

          if (!checkupError && checkupData && checkupData.length > 0) {
            for (const checkup of checkupData) {
              if (checkup.vitals && checkup.vitals.heartRate && !foundHeartRate) {
                setHeartRateData({
                  heart_rate: checkup.vitals.heartRate,
                  updated_at: checkup.created_at,
                  source: 'Checkup'
                });
                foundHeartRate = true;
              }

              // Check for BMI data in checkups
              if (checkup.vitals && checkup.vitals.weight && checkup.vitals.height && !foundBMI) {
                const { bmi, category } = calculateBMI(checkup.vitals.weight, checkup.vitals.height);
                setBmiData({
                  weight: checkup.vitals.weight,
                  height: checkup.vitals.height,
                  bmi,
                  category,
                  updated_at: checkup.created_at
                });
                foundBMI = true;
              }

              if (foundHeartRate && foundBMI) break;
            }
          }
        }

        // If still no data found, don't set any demo data - show "No data" state
        if (!foundHeartRate) {
          setHeartRateData(null);
        }

        if (!foundBMI) {
          setBmiData(null);
        }

      } catch (error: any) {
        console.error('Error fetching health data:', error);
        // Don't set fallback data - show error state
        setHeartRateData(null);
        setBmiData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, [user?.id]);

  // Set up heart beat animation based on BPM
  useEffect(() => {
    if (!heartRateData) return;

    const bpm = heartRateData.heart_rate;
    const beatInterval = (60 / bpm) * 1000; // Convert BPM to milliseconds

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new beat animation
    intervalRef.current = setInterval(() => {
      setIsBeating(true);
      setTimeout(() => setIsBeating(false), 200); // Beat duration
    }, beatInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [heartRateData]);

  // Generate ECG-like waveform
  useEffect(() => {
    if (!heartRateData) return;

    const bpm = heartRateData.heart_rate;
    const updateInterval = 50; // Update every 50ms for smooth animation
    const pointsToShow = 150; // Increased for bigger ECG display

    if (ecgIntervalRef.current) {
      clearInterval(ecgIntervalRef.current);
    }

    ecgIntervalRef.current = setInterval(() => {
      setEcgPoints(prev => {
        const newPoints = [...prev];
        
        // Generate ECG-like pattern
        const time = Date.now();
        const beatPhase = (time % (60000 / bpm)) / (60000 / bpm);
        
        let value = 0;
        if (beatPhase < 0.1) {
          // P wave
          value = Math.sin(beatPhase * Math.PI * 10) * 0.3;
        } else if (beatPhase < 0.2) {
          // QRS complex
          value = Math.sin((beatPhase - 0.1) * Math.PI * 50) * 1.5;
        } else if (beatPhase < 0.4) {
          // T wave
          value = Math.sin((beatPhase - 0.2) * Math.PI * 5) * 0.5;
        } else {
          // Baseline with slight noise
          value = (Math.random() - 0.5) * 0.1;
        }
        
        newPoints.push(value);
        
        // Keep only the last N points
        if (newPoints.length > pointsToShow) {
          newPoints.shift();
        }
        
        return newPoints;
      });
    }, updateInterval);

    return () => {
      if (ecgIntervalRef.current) {
        clearInterval(ecgIntervalRef.current);
      }
    };
  }, [heartRateData]);

  const getHeartRateStatus = (bpm: number) => {
    if (bpm < 60) return { status: 'Low', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    if (bpm > 100) return { status: 'High', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    return { status: 'Normal', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return ${diffMins}m ago;
    if (diffHours < 24) return ${diffHours}h ago;
    return ${diffDays}d ago;
  };

  if (loading) {
    return (
      <div className={bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 ${className}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>
        </div>
      </div>
    );
  }

  // Show "No Data" state if no user data is available
  if (!heartRateData && !bmiData) {
    return (
      <div className={bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 ${className}}>
        <div className="text-center text-gray-600 space-y-4">
          <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold">No Health Data Available</h3>
          <p className="text-gray-500">Add a medical record with vitals to see your health monitoring dashboard.</p>
          <div className="bg-blue-50 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Click "Add Record" and include your weight, height, heart rate, or blood pressure to start tracking your health metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }
const heartRateStatus = heartRateData ? getHeartRateStatus(heartRateData.heart_rate) : null;
  const bmiColors = bmiData ? getBMIColor(bmiData.category) : getBMIColor('Normal');

  return (
    <div className={bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 ${className}}>
      {/* Fixed Layout with proper spacing */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
        
        {/* Left Column: Heart Rate Monitor */}
        <div className="xl:col-span-2 space-y-6">
          {/* Header with BPM and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {heartRateData ? (
                <>
                  <div className="text-center">
                    <motion.div
                      animate={{
                        scale: isBeating ? 1.05 : 1,
                        textShadow: isBeating ? "0 0 20px rgba(239, 68, 68, 0.8)" : "0 0 10px rgba(239, 68, 68, 0.4)"
                      }}
                      transition={{ duration: 0.2 }}
                      className="text-5xl font-bold text-red-500 mb-2"
                    >
                      {heartRateData.heart_rate}
                    </motion.div>
                    <div className="text-lg text-gray-700 font-medium">BPM</div>
                  </div>
                  
                  <div className={px-4 py-3 rounded-xl ${heartRateStatus?.bgColor} border border-gray-300/50}>
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{
                          scale: isBeating ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <Heart className={w-6 h-6 ${heartRateStatus?.color}} />
                      </motion.div>
                      <div>
                        <div className={text-lg font-semibold ${heartRateStatus?.color}}>
                          {heartRateStatus?.status}
                        </div>
                        <div className="text-sm text-gray-600">
                          Heart Rate Status
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400 mb-2">--</div>
                  <div className="text-sm text-gray-500">No heart rate data</div>
                </div>
              )}
            </div>

            {/* Pulse indicator */}
            {heartRateData && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{
                      scale: isBeating ? 1.3 : 1,
                      opacity: isBeating ? 1 : 0.6,
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 bg-red-400 rounded-full"
                  />
                  <span className="text-sm text-gray-600 font-medium">Live Monitor</span>
                </div>
              </div>
            )}
          </div>

          {/* ECG Waveform Monitor */}
          {heartRateData ? (
            <div className="bg-black/90 rounded-2xl p-6 border border-gray-700/50 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-6 h-6 text-green-400" />
                  <span className="text-lg text-green-400 font-semibold">ECG Rhythm Monitor</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{
                        scale: isBeating ? 1.3 : 1,
                        opacity: isBeating ? 1 : 0.6,
                      }}
                      transition={{ duration: 0.2 }}
                      className="w-3 h-3 bg-red-400 rounded-full"
                    />
                    <span className="text-sm text-gray-400">Live</span>
                  </div>
                  <div className="text-sm text-gray-500">{heartRateData.heart_rate} BPM</div>
                </div>
              </div>
              
              <div className="h-48 relative overflow-hidden rounded-xl bg-black/50">
                <svg className="w-full h-full" viewBox="0 0 600 192">
                  <defs>
                    <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(34, 197, 94, 0)" />
                      <stop offset="60%" stopColor="rgba(34, 197, 94, 0.6)" />
                      <stop offset="100%" stopColor="rgba(34, 197, 94, 1)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Grid lines - Major */}
                  {Array.from({ length: 13 }).map((_, i) => (
                    <line
                      key={major-v-${i}}
                      x1={i * 50}
                      y1={0}
                      x2={i * 50}
                      y2={192}
                      stroke="rgba(34, 197, 94, 0.2)"
                      strokeWidth="1"
                    />
                  ))}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line
                      key={major-h-${i}}
                      x1={0}
                      y1={i * 24}
                      x2={600}
                      y2={i * 24}
                      stroke="rgba(34, 197, 94, 0.2)"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Grid lines - Minor */}
                  {Array.from({ length: 61 }).map((_, i) => (
                    <line
                      key={minor-v-${i}}
                      x1={i * 10}
                      y1={0}
                      x2={i * 10}
                      y2={192}
                      stroke="rgba(34, 197, 94, 0.1)"
                      strokeWidth="0.5"
                    />
                  ))}
                  {Array.from({ length: 33 }).map((_, i) => (
                    <line
                      key={minor-h-${i}}
                      x1={0}
                      y1={i * 6}
                      x2={600}
                      y2={i * 6}
                      stroke="rgba(34, 197, 94, 0.1)"
                      strokeWidth="0.5"
                    />
                  ))}
                  
                  {/* ECG Line */}
                  <polyline
                    points={ecgPoints.map((point, index) => 
                      ${(index / ecgPoints.length) * 600},${96 - point * 40}
                    ).join(' ')}
                    fill="none"
                    stroke="url(#ecgGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />
                  
                  {/* Scanning line */}
                  <motion.line
                    x1={ecgPoints.length > 0 ? (ecgPoints.length / 150) * 600 : 0}
                    y1={0}
                    x2={ecgPoints.length > 0 ? (ecgPoints.length / 150) * 600 : 0}
                    y2={192}
                    stroke="rgba(34, 197, 94, 0.8)"
                    strokeWidth="2"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </svg>
              </div>

              {/* ECG Info */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Updated {formatTimeAgo(heartRateData.updated_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Source: {heartRateData.source}</span>
                  </div>
                </div>
                <div className="text-green-400 font-medium">
                  Lead II • 25mm/s • 10mm/mV
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black/90 rounded-2xl p-6 border border-gray-700/50 flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Heart Rate Data</p>
                <p className="text-sm">Add a medical record with heart rate to see ECG monitoring</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: BMI Monitor */}
        <div className="xl:col-span-1">
          {bmiData ? (
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-700/50 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Scale className="w-6 h-6 text-purple-400" />
                  <span className="text-lg text-purple-400 font-semibold">BMI Monitor</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{bmiData.bmi}</div>
                  <div className={text-sm font-medium ${bmiColors.color}}>{bmiData.category}</div>
                </div>
              </div>

              <div className={p-4 rounded-full ${bmiColors.bgColor} border border-gray-600/50 mb-6 flex items-center justify-center}>
                <User className={w-12 h-12 ${bmiColors.color}} />
              </div>

              {/* BMI Scale */}
              <div className="space-y-4">
                <div className="relative h-8 bg-gray-700/50 rounded-full overflow-hidden">
                  {/* BMI Scale Background */}
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 bg-blue-500" style={{ width: '18.5%' }}></div>
                    <div className="flex-1 bg-green-500" style={{ width: '25%' }}></div>
                    <div className="flex-1 bg-yellow-500" style={{ width: '30%' }}></div>
                    <div className="flex-1 bg-red-500" style={{ width: '26.5%' }}></div>
                  </div>

                  {/* BMI Indicator */}
                  <motion.div
                    initial={{ left: '0%' }}
                    animate={{ left: ${getBMIPosition(bmiData.bmi)}% }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                  </motion.div>
                </div>

                {/* BMI Scale Labels */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <div className="text-center">
                    <div className="text-blue-400 font-medium">Underweight</div>
                    <div>{'<'} 18.5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-medium">Normal</div>
                    <div>18.5 - 24.9</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-medium">Overweight</div>
                    <div>25.0 - 29.9</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-medium">Obese</div>
                    <div>≥ 30.0</div>
                  </div>
                </div>

                {/* BMI Details */}
                <div className="space-y-3 pt-4 border-t border-gray-700/50">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Weight</span>
                    <span className="text-white font-semibold">{bmiData.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Height</span>
                    <span className="text-white font-semibold">{bmiData.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Updated</span>
                    <span className="text-white font-semibold">{formatTimeAgo(bmiData.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-700/50 h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No BMI Data</p>
                <p className="text-sm">Add weight and height to see BMI monitoring</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeartRateVisualization;