import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Share2, 
  AlertTriangle, 
  LogOut, 
  User as UserIcon,
  Heart,
  Activity,
  Pill,
  Upload,
  Clock,
  Stethoscope,
  Shield,
  Menu,
  X,
  Bot,
  Sparkles,
  TrendingUp,
  Eye,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { User, MedicalRecord, TimelineEvent } from '../types';
import ChatBot from './ChatBot/ChatBot';
import GlassmorphicCard from './GlassmorphicCard';
import HeartRateVisualization from './3D/HeartRateVisualization';
import MedicalTimeline from './MedicalTimeline';
import PrescriptionUpload from './PrescriptionUpload/PrescriptionUpload';

interface DashboardProps {
  user: User;
  records: MedicalRecord[];
  timelineEvents: TimelineEvent[];
  loading: boolean;
  onLogout: () => void;
  onEmergency: () => void;
  onShare: () => void;
  onAddRecord: (record: Omit<MedicalRecord, 'id' | 'uploadDate'>) => Promise<any>;
  onUploadFile: (file: File, recordId: string) => Promise<string | null>;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  records,
  timelineEvents,
  loading,
  onLogout,
  onEmergency,
  onShare,
  onAddRecord,
  onUploadFile,
}) => {
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'timeline' | 'prescriptions'>('overview');
  const [newRecord, setNewRecord] = useState({
    title: '',
    doctorName: '',
    visitDate: '',
    category: 'checkup' as const,
    fileType: 'PDF',
    fileSize: '0 MB',
    weight: '',
    height: '',
    bloodPressure: '',
    heartRate: '',
    bloodSugar: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleAddRecord = async () => {
    if (!newRecord.title || !newRecord.doctorName || !newRecord.visitDate) {
      alert('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const recordData = {
        title: newRecord.title,
        doctorName: newRecord.doctorName,
        visitDate: newRecord.visitDate,
        category: newRecord.category,
        fileType: selectedFile?.type || 'application/pdf',
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
        weight: newRecord.weight ? parseFloat(newRecord.weight) : undefined,
        height: newRecord.height ? parseFloat(newRecord.height) : undefined,
        bloodPressure: newRecord.bloodPressure || undefined,
        heartRate: newRecord.heartRate ? parseInt(newRecord.heartRate) : undefined,
        bloodSugar: newRecord.bloodSugar ? parseFloat(newRecord.bloodSugar) : undefined,
      };

      const addedRecord = await onAddRecord(recordData);
      
      if (selectedFile && addedRecord) {
        await onUploadFile(selectedFile, addedRecord.id);
      }

      // Reset form
      setNewRecord({
        title: '',
        doctorName: '',
        visitDate: '',
        category: 'checkup',
        fileType: 'PDF',
        fileSize: '0 MB',
        weight: '',
        height: '',
        bloodPressure: '',
        heartRate: '',
        bloodSugar: '',
      });
      setSelectedFile(null);
      setShowAddRecord(false);
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewRecord(prev => ({
        ...prev,
        fileType: file.type,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      }));
    }
  };

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prescription': return Pill;
      case 'lab-results': return Activity;
      case 'imaging': return Eye;
      case 'checkup': return Stethoscope;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'prescription': return 'bg-green-100 text-green-600';
      case 'lab-results': return 'bg-blue-100 text-blue-600';
      case 'imaging': return 'bg-purple-100 text-purple-600';
      case 'checkup': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4 relative z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Patient Vault</h1>
              <p className="text-sm text-gray-600">{getGreeting()}, {user.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="flex min-h-screen lg:h-screen">
        {/* Sidebar */}
        <div className={`${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-30 w-80 h-full bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col`}>
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-4">
              <motion.div 
                className="p-3 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Patient Vault
                </h1>
                <p className="text-gray-600">Your Health, Secured</p>
              </div>
            </div>
            
            {/* Patient Card with Allergies */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{getGreeting()}</p>
                  <p className="text-lg font-bold text-gray-800 truncate">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.age} years • {user.bloodType}</p>
                </div>
              </div>
              
              {/* Allergies Section */}
              {user.allergies && user.allergies.length > 0 ? (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">Allergies</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {user.allergies.map((allergy, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">No known allergies</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 space-y-3 flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddRecord(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add Record</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEmergency}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Emergency</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShare}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share Access</span>
            </motion.button>
          </div>

          {/* User Actions */}
          <div className="p-6 border-t border-gray-200/50 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Welcome Header */}
                    <div className="text-center lg:text-left">
                      <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2"
                      >
                        {getGreeting()}, {user.name}! 👋
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-600 text-lg"
                      >
                        Here's your health overview for today
                      </motion.p>
                    </div>

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

                    {/* Navigation Tabs Above ECG */}
                    <div className="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Health Monitoring Dashboard</h3>
                        <div className="flex items-center space-x-2">
                          {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                  activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md'
                                    : 'bg-white/50 text-gray-700 hover:bg-white/70'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="font-medium text-sm">{tab.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Heart Rate Visualization */}
                      <HeartRateVisualization user={user} className="min-h-[400px]" />
                    </div>

                    {/* Recent Medical Records */}
                    <GlassmorphicCard className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Recent Medical Records</h3>
                        <button
                          onClick={() => setActiveTab('records')}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View All
                        </button>
                      </div>
                      
                      {records.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No medical records yet</p>
                          <p className="text-gray-400">Add your first medical record to get started</p>
                          <button
                            onClick={() => setShowAddRecord(true)}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add First Record
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {records.slice(0, 3).map((record) => {
                            const Icon = getCategoryIcon(record.category);
                            return (
                              <div key={record.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className={`p-2 rounded-lg ${getCategoryColor(record.category)}`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{record.title}</h4>
                                  <p className="text-gray-600 text-sm">Dr. {record.doctorName} • {record.visitDate}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">{record.category}</p>
                                  <p className="text-xs text-gray-400">{record.fileSize}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </GlassmorphicCard>
                  </motion.div>
                )}

                {activeTab === 'records' && (
                  <motion.div
                    key="records"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-gray-900">Medical Records</h2>
                      <button
                        onClick={() => setShowAddRecord(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Record</span>
                      </button>
                    </div>

                    <GlassmorphicCard className="p-6">
                      {records.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No medical records yet</p>
                          <p className="text-gray-400">Add your first medical record to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {records.map((record) => {
                            const Icon = getCategoryIcon(record.category);
                            return (
                              <div key={record.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className={`p-3 rounded-lg ${getCategoryColor(record.category)}`}>
                                  <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{record.title}</h4>
                                  <p className="text-gray-600">Dr. {record.doctorName} • {record.visitDate}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span className="capitalize">{record.category.replace('-', ' ')}</span>
                                    <span>•</span>
                                    <span>{record.fileSize}</span>
                                    {record.fileUrl && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-600">File attached</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {record.fileUrl && (
                                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </GlassmorphicCard>
                  </motion.div>
                )}

                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-3xl font-bold text-gray-900">Medical Timeline</h2>
                    <MedicalTimeline events={timelineEvents} />
                  </motion.div>
                )}

                {activeTab === 'prescriptions' && (
                  <motion.div
                    key="prescriptions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-3xl font-bold text-gray-900">Prescription Management</h2>
                    <PrescriptionUpload userId={user.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      <AnimatePresence>
        {showAddRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add Medical Record</h3>
                <button
                  onClick={() => setShowAddRecord(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record Title *
                    </label>
                    <input
                      type="text"
                      value={newRecord.title}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Annual Checkup"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor Name *
                    </label>
                    <input
                      type="text"
                      value={newRecord.doctorName}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, doctorName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Dr. Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visit Date *
                    </label>
                    <input
                      type="date"
                      value={newRecord.visitDate}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, visitDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newRecord.category}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="checkup">Checkup</option>
                      <option value="prescription">Prescription</option>
                      <option value="lab-results">Lab Results</option>
                      <option value="imaging">Imaging</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Vitals Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Vitals (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={newRecord.weight}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="70"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={newRecord.height}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="175"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Pressure
                      </label>
                      <input
                        type="text"
                        value={newRecord.bloodPressure}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, bloodPressure: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="120/80"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        value={newRecord.heartRate}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, heartRate: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="72"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={newRecord.bloodSugar}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, bloodSugar: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach File (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">PDF, JPG, PNG up to 10MB</p>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="mt-2"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm text-green-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setShowAddRecord(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddRecord}
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Adding...' : 'Add Record'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ChatBot */}
      <ChatBot 
        user={user} 
        medicalRecords={records}
        currentPage={`dashboard-${activeTab}`}
      />
    </div>
  );
};

export default Dashboard;