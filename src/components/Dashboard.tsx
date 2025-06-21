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
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ExternalLink
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
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

  // Enhanced file viewing with proper URL handling
  const handleViewRecord = async (record: MedicalRecord) => {
    if (!record.fileUrl) {
      // If no file URL, show record details in modal
      setViewingRecord(record);
      return;
    }

    try {
      // If there's a file URL, try to open it
      if (record.fileUrl.includes('supabase')) {
        // For Supabase URLs, try to get a fresh signed URL if needed
        if (!record.fileUrl.includes('token=')) {
          console.log('Generating fresh signed URL for viewing...');
          // The URL might need refreshing - for now, try to open as-is
        }
      }
      
      // Open the file in a new tab
      window.open(record.fileUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening file:', error);
      // Fallback to showing record details
      setViewingRecord(record);
    }
  };

  // Enhanced file downloading with proper URL handling
  const handleDownloadRecord = async (record: MedicalRecord) => {
    if (!record.fileUrl) {
      alert('No file available for download');
      return;
    }

    try {
      console.log('Downloading file:', record.title);
      
      // For Supabase storage files, we might need to handle signed URLs
      let downloadUrl = record.fileUrl;
      
      // If the URL doesn't have a token and it's a Supabase URL, it might need refreshing
      if (record.fileUrl.includes('supabase') && !record.fileUrl.includes('token=')) {
        console.log('URL might need refreshing for download');
        // For now, try the existing URL
      }

      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set download filename
      const fileExtension = record.fileType.toLowerCase() === 'pdf' ? 'pdf' : 
                           record.fileType.toLowerCase() === 'image' ? 'jpg' : 
                           record.fileType.toLowerCase();
      link.download = `${record.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;
      
      // For cross-origin downloads, we might need to fetch and create blob
      if (record.fileUrl.includes('supabase')) {
        try {
          const response = await fetch(downloadUrl);
          if (!response.ok) throw new Error('Download failed');
          
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL
          window.URL.revokeObjectURL(blobUrl);
          return;
        } catch (fetchError) {
          console.warn('Blob download failed, trying direct link:', fetchError);
        }
      }
      
      // Fallback to direct link
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. The file might be expired or inaccessible. Please try uploading it again.');
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
                  Patient Vault 3D
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

            {/* Emergency Button */}
            <motion.button
              onClick={onEmergency}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Emergency</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - User Profile Card */}
          <div className="lg:col-span-1">
            <GlassmorphicCard className="p-6 sticky top-24">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>

              {/* User Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Age</span>
                  <span className="font-medium text-gray-900">{user.age} years</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Gender</span>
                  <span className="font-medium text-gray-900">{user.gender || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Blood Type</span>
                  <span className="font-medium text-red-600">{user.bloodType || 'Not specified'}</span>
                </div>
              </div>

              {/* Emergency Contact */}
              {user.emergencyContact.name && (
                <div className="border-t border-gray-200/50 pt-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{user.emergencyContact.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{user.emergencyContact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Heart className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{user.emergencyContact.relationship}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Allergies */}
              {user.allergies.length > 0 && (
                <div className="border-t border-gray-200/50 pt-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Allergies</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full border border-red-200"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <motion.button
                  onClick={() => setShowAddRecord(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Record</span>
                </motion.button>

                <motion.button
                  onClick={onShare}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white/50 border border-white/30 rounded-xl hover:bg-white/70 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Records</span>
                </motion.button>

                <motion.button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </motion.button>
              </div>
            </GlassmorphicCard>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {user.name}! 👋
              </h2>
              <p className="text-gray-600">
                Here's your health overview for today
              </p>
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
                              <motion.button
                                onClick={() => handleViewRecord(record)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="View record"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDownloadRecord(record)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Download record"
                                disabled={!record.fileUrl}
                              >
                                <Download className={`w-4 h-4 ${!record.fileUrl ? 'opacity-50 cursor-not-allowed' : ''}`} />
                              </motion.button>
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 mb-2">{record.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">Dr. {record.doctorName}</p>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{record.visitDate}</span>
                            <span>{record.fileSize}</span>
                          </div>

                          {/* Show vitals if available */}
                          {(record.weight || record.height || record.bloodPressure || record.heartRate) && (
                            <div className="mt-3 pt-3 border-t border-gray-200/50">
                              <p className="text-xs text-gray-500 mb-2">Vitals:</p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {record.weight && (
                                  <div>
                                    <span className="text-gray-500">Weight:</span>
                                    <span className="ml-1 font-medium">{record.weight}kg</span>
                                  </div>
                                )}
                                {record.height && (
                                  <div>
                                    <span className="text-gray-500">Height:</span>
                                    <span className="ml-1 font-medium">{record.height}cm</span>
                                  </div>
                                )}
                                {record.bloodPressure && (
                                  <div>
                                    <span className="text-gray-500">BP:</span>
                                    <span className="ml-1 font-medium">{record.bloodPressure}</span>
                                  </div>
                                )}
                                {record.heartRate && (
                                  <div>
                                    <span className="text-gray-500">HR:</span>
                                    <span className="ml-1 font-medium">{record.heartRate}bpm</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
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
          </div>
        </div>
      </div>

      {/* Record Details Modal */}
      <AnimatePresence>
        {viewingRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Record Details</h3>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-gray-900 font-semibold">{viewingRecord.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                    <p className="text-gray-900">Dr. {viewingRecord.doctorName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                    <p className="text-gray-900">{viewingRecord.visitDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${getCategoryColor(viewingRecord.category)}`}>
                      {getCategoryIcon(viewingRecord.category)}
                      <span className="capitalize">{viewingRecord.category.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals Section */}
                {(viewingRecord.weight || viewingRecord.height || viewingRecord.bloodPressure || viewingRecord.heartRate || viewingRecord.bloodSugar) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Vitals</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {viewingRecord.weight && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <label className="block text-sm font-medium text-blue-700 mb-1">Weight</label>
                          <p className="text-xl font-bold text-blue-900">{viewingRecord.weight} kg</p>
                        </div>
                      )}
                      {viewingRecord.height && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <label className="block text-sm font-medium text-green-700 mb-1">Height</label>
                          <p className="text-xl font-bold text-green-900">{viewingRecord.height} cm</p>
                        </div>
                      )}
                      {viewingRecord.bloodPressure && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <label className="block text-sm font-medium text-red-700 mb-1">Blood Pressure</label>
                          <p className="text-xl font-bold text-red-900">{viewingRecord.bloodPressure}</p>
                        </div>
                      )}
                      {viewingRecord.heartRate && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <label className="block text-sm font-medium text-purple-700 mb-1">Heart Rate</label>
                          <p className="text-xl font-bold text-purple-900">{viewingRecord.heartRate} bpm</p>
                        </div>
                      )}
                      {viewingRecord.bloodSugar && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <label className="block text-sm font-medium text-yellow-700 mb-1">Blood Sugar</label>
                          <p className="text-xl font-bold text-yellow-900">{viewingRecord.bloodSugar} mg/dL</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* File Info */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">File Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                      <p className="text-gray-900">{viewingRecord.fileType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                      <p className="text-gray-900">{viewingRecord.fileSize}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                      <p className="text-gray-900">{viewingRecord.uploadDate}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4 pt-6">
                  <button
                    onClick={() => setViewingRecord(null)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  {viewingRecord.fileUrl && (
                    <>
                      <motion.button
                        onClick={() => handleDownloadRecord(viewingRecord)}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </motion.button>
                      <motion.button
                        onClick={() => window.open(viewingRecord.fileUrl, '_blank')}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open File</span>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                      className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                        className="w-full p-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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