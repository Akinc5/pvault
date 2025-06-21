import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Pill, 
  FileText, 
  Calendar, 
  User as UserIcon,
  Heart,
  Shield,
  TrendingUp,
  Plus,
  Upload
} from 'lucide-react';
import { User, MedicalRecord, TimelineEvent } from '../types';
import MedicalTimeline from './MedicalTimeline';
import PrescriptionUpload from './PrescriptionUpload/PrescriptionUpload';
import HeartRateVisualization from './3D/HeartRateVisualization';
import GlassmorphicCard from './GlassmorphicCard';

interface RecordsSectionProps {
  user: User;
  records: MedicalRecord[];
  timelineEvents: TimelineEvent[];
  loading: boolean;
  onAddRecord: (record: Omit<MedicalRecord, 'id' | 'uploadDate'>) => Promise<any>;
  onUploadFile: (file: File, recordId: string) => Promise<string | null>;
}

const RecordsSection: React.FC<RecordsSectionProps> = ({
  user,
  records,
  timelineEvents,
  loading,
  onAddRecord,
  onUploadFile,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'prescriptions'>('overview');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getHealthSummary = () => {
    const recentRecords = records.slice(0, 3);
    const totalRecords = records.length;
    const categories = [...new Set(records.map(r => r.category))];
    
    return {
      totalRecords,
      recentRecords,
      categories: categories.length,
      lastVisit: recentRecords[0]?.visitDate || 'No visits recorded'
    };
  };

  const healthSummary = getHealthSummary();

  const navItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: Activity,
      description: 'Health dashboard and vitals'
    },
    { 
      id: 'timeline', 
      label: 'Medical Timeline', 
      icon: Clock,
      description: 'Chronological health history'
    },
    { 
      id: 'prescriptions', 
      label: 'Prescriptions', 
      icon: Pill,
      description: 'Prescription management'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Records Section Header */}
      <div className="text-center lg:text-left">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2"
        >
          Medical Records 📋
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 text-lg"
        >
          Manage and view your complete health information
        </motion.p>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl p-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:shadow-md'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-gray-500'}`} />
              <div className="text-left">
                <div className="font-semibold">{item.label}</div>
                <div className={`text-xs ${activeTab === item.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {item.description}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Health Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassmorphicCard className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{healthSummary.totalRecords}</p>
                      <p className="text-gray-600">Medical Records</p>
                    </div>
                  </div>
                </GlassmorphicCard>

                <GlassmorphicCard className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{healthSummary.categories}</p>
                      <p className="text-gray-600">Categories</p>
                    </div>
                  </div>
                </GlassmorphicCard>

                <GlassmorphicCard className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{healthSummary.lastVisit}</p>
                      <p className="text-gray-600">Last Visit</p>
                    </div>
                  </div>
                </GlassmorphicCard>

                <GlassmorphicCard className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{user.bloodType}</p>
                      <p className="text-gray-600">Blood Type</p>
                    </div>
                  </div>
                </GlassmorphicCard>
              </div>

              {/* Heart Rate Visualization */}
              <HeartRateVisualization user={user} className="h-96" />

              {/* Recent Records Overview */}
              {records.length > 0 && (
                <GlassmorphicCard className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                      <FileText className="w-7 h-7 text-blue-600" />
                      <span>Recent Medical Records</span>
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('timeline')}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    >
                      View All Records
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {healthSummary.recentRecords.map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{record.title}</h4>
                            <p className="text-sm text-gray-600">Dr. {record.doctorName}</p>
                            <p className="text-xs text-gray-500 mt-1">{record.visitDate}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                              record.category === 'prescription' ? 'bg-green-100 text-green-800' :
                              record.category === 'lab-results' ? 'bg-blue-100 text-blue-800' :
                              record.category === 'imaging' ? 'bg-purple-100 text-purple-800' :
                              record.category === 'checkup' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.category.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassmorphicCard>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassmorphicCard className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Record</h3>
                    <p className="text-gray-600 text-sm mb-4">Upload a new medical document or record</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      Add Record
                    </motion.button>
                  </div>
                </GlassmorphicCard>

                <GlassmorphicCard className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Prescription</h3>
                    <p className="text-gray-600 text-sm mb-4">Upload and analyze prescription documents</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('prescriptions')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      Upload Prescription
                    </motion.button>
                  </div>
                </GlassmorphicCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MedicalTimeline events={timelineEvents} />
            </motion.div>
          )}

          {activeTab === 'prescriptions' && (
            <motion.div
              key="prescriptions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PrescriptionUpload userId={user.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecordsSection;