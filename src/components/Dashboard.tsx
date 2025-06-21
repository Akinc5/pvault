import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  Calendar, 
  Share2, 
  AlertTriangle, 
  LogOut, 
  Plus, 
  Upload, 
  User as UserIcon,
  Activity,
  Pill,
  Stethoscope,
  Download,
  Eye,
  Trash2,
  X,
  Check,
  Camera,
  FileImage,
  Clock,
  MapPin,
  Phone,
  Mail,
  Shield,
  TrendingUp,
  Thermometer,
  Weight,
  Droplets,
  Zap,
  Ruler
} from 'lucide-react';
import { User, MedicalRecord, TimelineEvent } from '../types';
import MedicalTimeline from './MedicalTimeline';
import GlassmorphicCard from './GlassmorphicCard';
import XRayViewer from './XRayViewer';
import PrescriptionUpload from './PrescriptionUpload/PrescriptionUpload';
import ChatBot from './ChatBot/ChatBot';
import HeartRateVisualization from './3D/HeartRateVisualization';
import HealthTrendChart from './HealthTrendChart';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'timeline' | 'prescriptions'>('overview');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showXRayViewer, setShowXRayViewer] = useState<{ url: string; title: string } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      setShowAddRecord(false);
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
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  const handleFileUpload = async (recordId: string, file: File) => {
    setUploadingFile(recordId);
    try {
      await onUploadFile(file, recordId);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(null);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getQuickStats = () => {
    const totalRecords = records.length;
    const recentRecords = records.filter(r => {
      const recordDate = new Date(r.visitDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return recordDate >= thirtyDaysAgo;
    }).length;

    const categories = records.reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalRecords, recentRecords, categories };
  };

  // Get latest vitals from records - ONLY USER PROVIDED DATA
  const getLatestVitals = () => {
    const recordsWithVitals = records.filter(r => 
      r.bloodPressure || r.heartRate || r.weight || r.bloodSugar || r.height
    ).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

    if (recordsWithVitals.length === 0) {
      // Return null if no user data available
      return null;
    }

    const latest = recordsWithVitals[0];
    return {
      bloodPressure: latest.bloodPressure,
      heartRate: latest.heartRate,
      weight: latest.weight,
      height: latest.height,
      bloodSugar: latest.bloodSugar,
      lastUpdated: latest.visitDate
    };
  };

  // Generate trend data for charts - ONLY USER PROVIDED DATA
  const generateTrendData = (type: 'heartRate' | 'bloodPressure' | 'weight' | 'bloodSugar') => {
    const relevantRecords = records
      .filter(r => {
        switch (type) {
          case 'heartRate': return r.heartRate;
          case 'bloodPressure': return r.bloodPressure;
          case 'weight': return r.weight;
          case 'bloodSugar': return r.bloodSugar;
          default: return false;
        }
      })
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .slice(-6); // Last 6 readings

    if (relevantRecords.length === 0) {
      // Return empty array if no user data
      return [];
    }

    return relevantRecords.map(record => {
      let value = 0;
      switch (type) {
        case 'heartRate':
          value = record.heartRate || 0;
          break;
        case 'bloodPressure':
          value = record.bloodPressure ? parseInt(record.bloodPressure.split('/')[0]) : 0;
          break;
        case 'weight':
          value = record.weight || 0;
          break;
        case 'bloodSugar':
          value = record.bloodSugar || 0;
          break;
      }

      return {
        date: new Date(record.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value,
        normal: type === 'heartRate' ? (value >= 60 && value <= 100) :
                type === 'bloodPressure' ? (value >= 90 && value <= 140) :
                type === 'weight' ? true :
                type === 'bloodSugar' ? (value >= 70 && value <= 126) : true
      };
    });
  };

  const stats = getQuickStats();
  const latestVitals = getLatestVitals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    Patient Vault 3D
                  </h1>
                  <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEmergency}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Emergency</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onShare}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors shadow-lg"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex space-x-1 bg-white/50 backdrop-blur-xl rounded-2xl p-1 shadow-lg border border-white/20">
          {[
            { id: 'overview', label: 'Overview', icon: Heart },
            { id: 'records', label: 'Records', icon: FileText },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Top Section - Profile and Heart Rate Monitor */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side - Elongated User Profile Card */}
                <div className="lg:col-span-1">
                  <GlassmorphicCard className="h-full">
                    <div className="space-y-8">
                      {/* Profile Header */}
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <UserIcon className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                        <p className="text-gray-600">{user.age} years old</p>
                        <p className="text-gray-500 text-sm">{user.gender}</p>
                      </div>

                      {/* Blood Type - Most Critical */}
                      <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2 mb-3">
                            <span className="text-3xl">🩸</span>
                            <span className="font-bold text-red-800">Blood Type</span>
                          </div>
                          <p className="text-3xl font-bold text-red-600">{user.bloodType}</p>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <Phone className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-blue-800">Emergency Contact</span>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-blue-800">{user.emergencyContact.name}</p>
                          <p className="text-blue-600 text-sm">{user.emergencyContact.relationship}</p>
                          <a
                            href={`tel:${user.emergencyContact.phone}`}
                            className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Phone className="w-4 h-4" />
                            <span>{user.emergencyContact.phone}</span>
                          </a>
                        </div>
                      </div>

                      {/* Allergies */}
                      {user.allergies.length > 0 && (
                        <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <span className="font-bold text-yellow-800">Allergies</span>
                          </div>
                          <div className="space-y-2">
                            {user.allergies.map((allergy, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-100 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                <span className="font-medium text-yellow-800">{allergy}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 text-center">Quick Stats</h4>
                        
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">Total Records</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.totalRecords}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">Recent (30d)</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.recentRecords}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Activity className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">Categories</span>
                            </div>
                            <span className="font-bold text-gray-900">{Object.keys(stats.categories).length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Security Badge */}
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                        <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800">Secure & Encrypted</p>
                        <p className="text-xs text-green-600">Your data is protected</p>
                      </div>
                    </div>
                  </GlassmorphicCard>
                </div>

                {/* Right Side - Heart Rate Monitor */}
                <div className="lg:col-span-2">
                  <HeartRateVisualization user={user} className="h-full" />
                </div>
              </div>

              {/* Vitals Dashboard - Only show if user has provided data */}
              {latestVitals && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Current Vitals Cards */}
                  {latestVitals.bloodPressure && (
                    <GlassmorphicCard hover className="lg:col-span-1">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-red-100 rounded-full w-fit mx-auto">
                          <Heart className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Blood Pressure</p>
                          <p className="text-2xl font-bold text-gray-900">{latestVitals.bloodPressure}</p>
                          <p className="text-xs text-gray-500">mmHg</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-xs text-green-700 font-medium">Normal Range</p>
                        </div>
                      </div>
                    </GlassmorphicCard>
                  )}

                  {latestVitals.weight && (
                    <GlassmorphicCard hover className="lg:col-span-1">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
                          <Weight className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Weight</p>
                          <p className="text-2xl font-bold text-gray-900">{latestVitals.weight}</p>
                          <p className="text-xs text-gray-500">kg</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-xs text-blue-700 font-medium">Stable</p>
                        </div>
                      </div>
                    </GlassmorphicCard>
                  )}

                  {latestVitals.height && (
                    <GlassmorphicCard hover className="lg:col-span-1">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-indigo-100 rounded-full w-fit mx-auto">
                          <Ruler className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Height</p>
                          <p className="text-2xl font-bold text-gray-900">{latestVitals.height}</p>
                          <p className="text-xs text-gray-500">cm</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-2">
                          <p className="text-xs text-indigo-700 font-medium">Recorded</p>
                        </div>
                      </div>
                    </GlassmorphicCard>
                  )}

                  {latestVitals.bloodSugar && (
                    <GlassmorphicCard hover className="lg:col-span-1">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto">
                          <Droplets className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Blood Sugar</p>
                          <p className="text-2xl font-bold text-gray-900">{latestVitals.bloodSugar}</p>
                          <p className="text-xs text-gray-500">mg/dL</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-xs text-green-700 font-medium">Normal</p>
                        </div>
                      </div>
                    </GlassmorphicCard>
                  )}

                  {latestVitals.heartRate && (
                    <GlassmorphicCard hover className="lg:col-span-1">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto">
                          <Zap className="w-8 h-8 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Heart Rate</p>
                          <p className="text-2xl font-bold text-gray-900">{latestVitals.heartRate}</p>
                          <p className="text-xs text-gray-500">BPM</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-xs text-green-700 font-medium">Normal</p>
                        </div>
                      </div>
                    </GlassmorphicCard>
                  )}
                </div>
              )}

              {/* Health Trends - Only show if user has provided data */}
              {(generateTrendData('heartRate').length > 0 || generateTrendData('bloodPressure').length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {generateTrendData('heartRate').length > 0 && (
                    <HealthTrendChart
                      title="Heart Rate Trend"
                      data={generateTrendData('heartRate')}
                      color="from-red-500 to-pink-500"
                      unit="BPM"
                    />
                  )}
                  {generateTrendData('bloodPressure').length > 0 && (
                    <HealthTrendChart
                      title="Blood Pressure Trend"
                      data={generateTrendData('bloodPressure')}
                      color="from-blue-500 to-cyan-500"
                      unit="mmHg"
                    />
                  )}
                </div>
              )}

              {/* Recent Records Section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Recent Medical Records</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddRecord(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Record</span>
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {records.slice(0, 6).map((record) => (
                    <GlassmorphicCard key={record.id} hover>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${getCategoryColor(record.category)}`}>
                              {getCategoryIcon(record.category)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 truncate">{record.title}</h4>
                              <p className="text-sm text-gray-600">Dr. {record.doctorName}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(record.visitDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>{record.fileType} • {record.fileSize}</span>
                          </div>
                        </div>

                        {/* Vitals Display */}
                        {(record.bloodPressure || record.heartRate || record.weight || record.height || record.bloodSugar) && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vitals</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {record.bloodPressure && (
                                <div>
                                  <span className="text-gray-500">BP:</span>
                                  <span className="ml-1 font-medium">{record.bloodPressure}</span>
                                </div>
                              )}
                              {record.heartRate && (
                                <div>
                                  <span className="text-gray-500">HR:</span>
                                  <span className="ml-1 font-medium">{record.heartRate} bpm</span>
                                </div>
                              )}
                              {record.weight && (
                                <div>
                                  <span className="text-gray-500">Weight:</span>
                                  <span className="ml-1 font-medium">{record.weight} kg</span>
                                </div>
                              )}
                              {record.height && (
                                <div>
                                  <span className="text-gray-500">Height:</span>
                                  <span className="ml-1 font-medium">{record.height} cm</span>
                                </div>
                              )}
                              {record.bloodSugar && (
                                <div>
                                  <span className="text-gray-500">BS:</span>
                                  <span className="ml-1 font-medium">{record.bloodSugar} mg/dL</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {record.fileUrl && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (record.fileType.includes('image')) {
                                  setShowXRayViewer({ url: record.fileUrl!, title: record.title });
                                } else {
                                  window.open(record.fileUrl, '_blank');
                                }
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">View</span>
                            </motion.button>
                          )}
                          
                          {!record.fileUrl && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingFile === record.id}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">
                                {uploadingFile === record.id ? 'Uploading...' : 'Upload'}
                              </span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </GlassmorphicCard>
                  ))}
                </div>
              </div>
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
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddRecord(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Record</span>
                </motion.button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : records.length === 0 ? (
                <GlassmorphicCard className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No medical records yet</h3>
                  <p className="text-gray-600 mb-6">Start building your medical history by adding your first record.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddRecord(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Your First Record</span>
                  </motion.button>
                </GlassmorphicCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {records.map((record) => (
                    <GlassmorphicCard key={record.id} hover>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${getCategoryColor(record.category)}`}>
                              {getCategoryIcon(record.category)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 truncate">{record.title}</h4>
                              <p className="text-sm text-gray-600">Dr. {record.doctorName}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(record.visitDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>{record.fileType} • {record.fileSize}</span>
                          </div>
                        </div>

                        {/* Vitals Display */}
                        {(record.bloodPressure || record.heartRate || record.weight || record.height || record.bloodSugar) && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vitals</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {record.bloodPressure && (
                                <div>
                                  <span className="text-gray-500">BP:</span>
                                  <span className="ml-1 font-medium">{record.bloodPressure}</span>
                                </div>
                              )}
                              {record.heartRate && (
                                <div>
                                  <span className="text-gray-500">HR:</span>
                                  <span className="ml-1 font-medium">{record.heartRate} bpm</span>
                                </div>
                              )}
                              {record.weight && (
                                <div>
                                  <span className="text-gray-500">Weight:</span>
                                  <span className="ml-1 font-medium">{record.weight} kg</span>
                                </div>
                              )}
                              {record.height && (
                                <div>
                                  <span className="text-gray-500">Height:</span>
                                  <span className="ml-1 font-medium">{record.height} cm</span>
                                </div>
                              )}
                              {record.bloodSugar && (
                                <div>
                                  <span className="text-gray-500">BS:</span>
                                  <span className="ml-1 font-medium">{record.bloodSugar} mg/dL</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {record.fileUrl && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (record.fileType.includes('image')) {
                                  setShowXRayViewer({ url: record.fileUrl!, title: record.title });
                                } else {
                                  window.open(record.fileUrl, '_blank');
                                }
                              }}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">View</span>
                            </motion.button>
                          )}
                          
                          {record.fileUrl && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => window.open(record.fileUrl, '_blank')}
                              className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </motion.button>
                          )}
                          
                          {!record.fileUrl && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedRecord(record);
                                fileInputRef.current?.click();
                              }}
                              disabled={uploadingFile === record.id}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">
                                {uploadingFile === record.id ? 'Uploading...' : 'Upload'}
                              </span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </GlassmorphicCard>
                  ))}
                </div>
              )}
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

      {/* Add Record Modal */}
      <AnimatePresence>
        {showAddRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add Medical Record</h3>
                <button
                  onClick={() => setShowAddRecord(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record Title
                    </label>
                    <input
                      type="text"
                      value={newRecord.title}
                      onChange={(e) => setNewRecord(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 70.5"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 175.5"
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
                        placeholder="e.g., 120/80"
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
                        placeholder="e.g., 72"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 95.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddRecord(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Add Record
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* X-Ray Viewer Modal */}
      <AnimatePresence>
        {showXRayViewer && (
          <XRayViewer
            imageUrl={showXRayViewer.url}
            title={showXRayViewer.title}
            onClose={() => setShowXRayViewer(null)}
          />
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && selectedRecord) {
            handleFileUpload(selectedRecord.id, file);
            setSelectedRecord(null);
          }
        }}
        className="hidden"
      />

      {/* ChatBot */}
      <ChatBot 
        user={user} 
        medicalRecords={records}
        currentPage={activeTab}
      />
    </div>
  );
};

export default Dashboard;