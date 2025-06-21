import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  Calendar, 
  Settings, 
  LogOut, 
  Plus, 
  Upload, 
  AlertTriangle, 
  Share2, 
  User, 
  Activity, 
  Pill, 
  Stethoscope,
  Clock,
  TrendingUp,
  BarChart3,
  Download,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  Camera,
  Paperclip,
  Save,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Bell,
  Shield,
  Zap,
  Brain,
  Target,
  Sparkles
} from 'lucide-react';
import { User as UserType, MedicalRecord, TimelineEvent } from '../types';
import MedicalTimeline from './MedicalTimeline';
import HealthTrendChart from './HealthTrendChart';
import GlassmorphicCard from './GlassmorphicCard';
import Scene3D from './3D/Scene3D';
import HeartRateVisualization from './3D/HeartRateVisualization';
import PrescriptionUpload from './PrescriptionUpload/PrescriptionUpload';
import ChatBot from './ChatBot/ChatBot';

interface DashboardProps {
  user: UserType;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'timeline' | 'prescriptions'>('overview');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const recordData = {
        title: newRecord.title,
        doctorName: newRecord.doctorName,
        visitDate: newRecord.visitDate,
        category: newRecord.category,
        fileType: newRecord.fileType,
        fileSize: newRecord.fileSize,
        weight: newRecord.weight ? parseFloat(newRecord.weight) : undefined,
        height: newRecord.height ? parseFloat(newRecord.height) : undefined,
        bloodPressure: newRecord.bloodPressure || undefined,
        heartRate: newRecord.heartRate ? parseInt(newRecord.heartRate) : undefined,
        bloodSugar: newRecord.bloodSugar ? parseFloat(newRecord.bloodSugar) : undefined,
      };

      const addedRecord = await onAddRecord(recordData);
      
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
      setShowAddRecord(false);
      
      // Handle file upload if a file was selected
      if (fileInputRef.current?.files?.[0] && addedRecord) {
        setUploadingFile(true);
        try {
          await onUploadFile(fileInputRef.current.files[0], addedRecord.id);
        } catch (error) {
          console.error('File upload error:', error);
        } finally {
          setUploadingFile(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewRecord(prev => ({
        ...prev,
        fileType: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'Image' : 'Document',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      }));
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prescription': return <Pill className="w-5 h-5" />;
      case 'lab-results': return <Activity className="w-5 h-5" />;
      case 'imaging': return <Camera className="w-5 h-5" />;
      case 'checkup': return <Stethoscope className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'prescription': return 'bg-green-100 text-green-800 border-green-200';
      case 'lab-results': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'imaging': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'checkup': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Sample health trend data
  const healthTrends = [
    {
      title: 'Blood Pressure',
      data: [
        { date: '2024-01', value: 120, normal: true },
        { date: '2024-02', value: 125, normal: true },
        { date: '2024-03', value: 118, normal: true },
        { date: '2024-04', value: 122, normal: true },
        { date: '2024-05', value: 128, normal: false },
        { date: '2024-06', value: 115, normal: true },
      ],
      color: 'from-red-400 to-pink-500',
      unit: 'mmHg'
    },
    {
      title: 'Heart Rate',
      data: [
        { date: '2024-01', value: 72, normal: true },
        { date: '2024-02', value: 75, normal: true },
        { date: '2024-03', value: 68, normal: true },
        { date: '2024-04', value: 74, normal: true },
        { date: '2024-05', value: 78, normal: true },
        { date: '2024-06', value: 71, normal: true },
      ],
      color: 'from-blue-400 to-cyan-500',
      unit: 'bpm'
    },
    {
      title: 'Weight',
      data: [
        { date: '2024-01', value: 70, normal: true },
        { date: '2024-02', value: 69.5, normal: true },
        { date: '2024-03', value: 70.2, normal: true },
        { date: '2024-04', value: 69.8, normal: true },
        { date: '2024-05', value: 70.5, normal: true },
        { date: '2024-06', value: 69.9, normal: true },
      ],
      color: 'from-green-400 to-emerald-500',
      unit: 'kg'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <motion.div 
                className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 bg-clip-text text-transparent">
                  Patient Vault
                </h1>
                <p className="text-sm text-gray-600">Secure Medical Records</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'records', label: 'Records', icon: FileText },
                { id: 'timeline', label: 'Timeline', icon: Calendar },
                { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={onEmergency}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Emergency</span>
              </motion.button>

              <div className="relative">
                <motion.button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-3 p-2 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-colors border border-white/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showProfile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-200/50">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                          <span>Age: {user.age}</span>
                          <span>Blood Type: {user.bloodType}</span>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={onShare}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share Records</span>
                        </button>
                        <button
                          onClick={() => setShowAddRecord(true)}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Record</span>
                        </button>
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {user.name}! 👋
              </h2>
              <p className="text-gray-600">
                Here's your health overview for today
              </p>
            </div>
            
            <motion.button
              onClick={() => setShowAddRecord(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              <span>Add Record</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassmorphicCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Records</p>
                      <p className="text-3xl font-bold text-gray-900">{records.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </GlassmorphicCard>

                <GlassmorphicCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Recent Checkups</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {records.filter(r => r.category === 'checkup').length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Stethoscope className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </GlassmorphicCard>

                <GlassmorphicCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Prescriptions</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {records.filter(r => r.category === 'prescription').length}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Pill className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </GlassmorphicCard>

                <GlassmorphicCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Lab Results</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {records.filter(r => r.category === 'lab-results').length}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </GlassmorphicCard>
              </div>

              {/* Heart Rate Visualization */}
              <HeartRateVisualization user={user} className="col-span-full" />

              {/* Health Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {healthTrends.map((trend, index) => (
                  <HealthTrendChart
                    key={trend.title}
                    title={trend.title}
                    data={trend.data}
                    color={trend.color}
                    unit={trend.unit}
                  />
                ))}
              </div>

              {/* Recent Records */}
              <GlassmorphicCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Records</h3>
                  <button
                    onClick={() => setActiveTab('records')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                <div className="space-y-4">
                  {records.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl border border-white/30">
                      <div className={`p-2 rounded-lg ${getCategoryColor(record.category)}`}>
                        {getCategoryIcon(record.category)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{record.title}</h4>
                        <p className="text-sm text-gray-600">Dr. {record.doctorName} • {record.visitDate}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.fileType}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassmorphicCard>
            </motion.div>
          )}

          {activeTab === 'records' && (
            <motion.div
              key="records"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassmorphicCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Medical Records</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search records..."
                        className="pl-10 pr-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white/50 border border-white/30 rounded-lg hover:bg-white/70 transition-colors">
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {records.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/50 rounded-xl border border-white/30 p-6 hover:shadow-lg transition-all duration-200"
                      whileHover={{ scale: 1.02, y: -5 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 rounded-lg ${getCategoryColor(record.category)}`}>
                          {getCategoryIcon(record.category)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{record.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">Dr. {record.doctorName}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{record.visitDate}</span>
                        <span>{record.fileSize}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassmorphicCard>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassmorphicCard className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Medical Timeline</h3>
                <MedicalTimeline events={timelineEvents} />
              </GlassmorphicCard>
            </motion.div>
          )}

          {activeTab === 'prescriptions' && (
            <motion.div
              key="prescriptions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PrescriptionUpload userId={user.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Record Modal */}
      <AnimatePresence>
        {showAddRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add Medical Record</h3>
                <button
                  onClick={() => setShowAddRecord(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record Title
                    </label>
                    <input
                      type="text"
                      value={newRecord.title}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Annual Physical Exam"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={newRecord.doctorName}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, doctorName: e.target.value }))}
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Dr. Smith"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visit Date
                    </label>
                    <input
                      type="date"
                      value={newRecord.visitDate}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, visitDate: e.target.value }))}
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newRecord.category}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Vitals (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newRecord.weight}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="70.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newRecord.height}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="72"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={newRecord.bloodSugar}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, bloodSugar: e.target.value }))}
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="95"
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach File (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>Choose File</span>
                    </button>
                    {newRecord.fileSize !== '0 MB' && (
                      <span className="text-sm text-gray-600">
                        {newRecord.fileType} • {newRecord.fileSize}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddRecord(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={uploadingFile}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {uploadingFile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Record</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ChatBot */}
      <ChatBot 
        user={user} 
        medicalRecords={records}
        currentPage={activeTab}
      />

      {/* Footer */}
      <footer className="text-center py-6">
        <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/20">
          <span className="text-sm text-gray-600">Built with</span>
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">Bolt.new</span>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;