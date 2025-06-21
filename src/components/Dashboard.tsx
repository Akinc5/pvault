import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  Calendar, 
  Clock, 
  Activity, 
  Pill, 
  User, 
  Shield, 
  Share2, 
  AlertTriangle, 
  Plus, 
  Eye, 
  Download, 
  Trash2,
  X,
  CheckCircle,
  Loader2,
  ArrowLeft,
  TrendingUp,
  Droplets,
  Weight,
  Ruler,
  Thermometer
} from 'lucide-react';
import { User as UserType, MedicalRecord, TimelineEvent } from '../types';
import HeartRateVisualization from './3D/HeartRateVisualization';
import MedicalTimeline from './MedicalTimeline';
import PrescriptionUpload from './PrescriptionUpload/PrescriptionUpload';
import ChatBot from './ChatBot/ChatBot';
import { supabase } from '../lib/supabase';

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
  const [currentView, setCurrentView] = useState<'overview' | 'records' | 'timeline' | 'prescriptions'>('overview');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showRecordViewer, setShowRecordViewer] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [downloadingRecord, setDownloadingRecord] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    doctorName: '',
    visitDate: '',
    category: 'checkup' as const,
    weight: '',
    height: '',
    bloodPressure: '',
    heartRate: '',
    bloodSugar: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Get latest vitals from records
  const getLatestVitals = () => {
    const recordsWithVitals = records.filter(r => 
      r.weight || r.height || r.bloodPressure || r.heartRate || r.bloodSugar
    );
    
    if (recordsWithVitals.length === 0) return null;
    
    // Sort by visit date to get the most recent
    const sortedRecords = recordsWithVitals.sort((a, b) => 
      new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
    
    const latest = sortedRecords[0];
    return {
      weight: latest.weight,
      height: latest.height,
      bloodPressure: latest.bloodPressure,
      heartRate: latest.heartRate,
      bloodSugar: latest.bloodSugar,
      date: latest.visitDate
    };
  };

  const latestVitals = getLatestVitals();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only PDF, JPG, and PNG files are allowed.');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB.');
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);

    try {
      const recordData: Omit<MedicalRecord, 'id' | 'uploadDate'> = {
        title: formData.title,
        doctorName: formData.doctorName,
        visitDate: formData.visitDate,
        category: formData.category,
        fileType: selectedFile?.type || 'application/pdf',
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
        fileUrl: '',
        // Include vitals data
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        bloodPressure: formData.bloodPressure || undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        bloodSugar: formData.bloodSugar ? parseFloat(formData.bloodSugar) : undefined,
      };

      const newRecord = await onAddRecord(recordData);
      
      if (selectedFile && newRecord) {
        await onUploadFile(selectedFile, newRecord.id);
      }

      // Reset form
      setFormData({
        title: '',
        doctorName: '',
        visitDate: '',
        category: 'checkup',
        weight: '',
        height: '',
        bloodPressure: '',
        heartRate: '',
        bloodSugar: '',
      });
      setSelectedFile(null);
      setShowAddRecord(false);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to add record');
    } finally {
      setUploading(false);
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowRecordViewer(true);
  };

  const handleDownloadRecord = async (record: MedicalRecord) => {
    if (!record.fileUrl) return;
    
    setDownloadingRecord(record.id);
    try {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = record.fileUrl;
      link.download = `${record.title}_${record.visitDate}.${record.fileType.split('/')[1] || 'pdf'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingRecord(null);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    setDeletingRecord(recordId);
    setDeleteError(null);

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Close confirmation modal
      setShowDeleteConfirm(null);
      
      // Refresh the page to update the records list
      window.location.reload();
    } catch (error: any) {
      console.error('Delete failed:', error);
      setDeleteError(error.message || 'Failed to delete record');
    } finally {
      setDeletingRecord(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prescription': return '💊';
      case 'lab-results': return '🧪';
      case 'imaging': return '🔬';
      case 'checkup': return '🩺';
      default: return '📄';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  const isViewableFile = (fileType: string) => {
    return fileType.includes('pdf') || fileType.includes('image');
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600 text-lg">Here's your health overview</p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentView('records')}
          className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6 text-left hover:shadow-3xl transition-all duration-300"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Records</h3>
              <p className="text-gray-600">View medical documents</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">{records.length}</div>
          <p className="text-sm text-gray-500">Total records</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentView('timeline')}
          className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6 text-left hover:shadow-3xl transition-all duration-300"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-green-500/20 rounded-2xl">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Timeline</h3>
              <p className="text-gray-600">Health history</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">{timelineEvents.length}</div>
          <p className="text-sm text-gray-500">Total events</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentView('prescriptions')}
          className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6 text-left hover:shadow-3xl transition-all duration-300"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl">
              <Pill className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Prescriptions</h3>
              <p className="text-gray-600">Manage medications</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {records.filter(r => r.category === 'prescription').length}
          </div>
          <p className="text-sm text-gray-500">Prescriptions</p>
        </motion.button>
      </div>

      {/* Latest Vitals & Allergies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Latest Vitals */}
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span>Latest Vitals</span>
          </h3>
          
          {latestVitals ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-4">
                Last updated: {new Date(latestVitals.date).toLocaleDateString()}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {latestVitals.bloodPressure && (
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-xl">
                    <Droplets className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="text-sm text-gray-600">Blood Pressure</div>
                      <div className="font-semibold text-red-700">{latestVitals.bloodPressure} mmHg</div>
                    </div>
                  </div>
                )}
                
                {latestVitals.heartRate && (
                  <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-xl">
                    <Heart className="w-5 h-5 text-pink-600" />
                    <div>
                      <div className="text-sm text-gray-600">Heart Rate</div>
                      <div className="font-semibold text-pink-700">{latestVitals.heartRate} bpm</div>
                    </div>
                  </div>
                )}
                
                {latestVitals.weight && (
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                    <Weight className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Weight</div>
                      <div className="font-semibold text-blue-700">{latestVitals.weight} kg</div>
                    </div>
                  </div>
                )}
                
                {latestVitals.bloodSugar && (
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-xl">
                    <Droplets className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="text-sm text-gray-600">Blood Sugar</div>
                      <div className="font-semibold text-yellow-700">{latestVitals.bloodSugar} mg/dL</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No vitals data available</p>
              <p className="text-sm text-gray-400">Add a medical record with vitals to see your latest measurements</p>
            </div>
          )}
        </div>

        {/* Allergies */}
        <div className="bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <span>Allergies</span>
          </h3>
          
          {user.allergies.length > 0 ? (
            <div className="space-y-3">
              {user.allergies.map((allergy, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">{allergy}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">No known allergies</p>
              <p className="text-sm text-gray-400">This is good for your health profile</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Monitoring */}
      <HeartRateVisualization user={user} />
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Medical Records</h2>
        </div>
        
        <button
          onClick={() => setShowAddRecord(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Record</span>
        </button>
      </div>

      {/* Records Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Loading records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No medical records yet</p>
          <p className="text-gray-400">Add your first medical record to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getCategoryIcon(record.category)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{record.title}</h3>
                    <p className="text-gray-600">Dr. {record.doctorName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{record.visitDate}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  {record.fileUrl ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>File attached</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span>No file attached</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vitals Preview */}
              {(record.bloodPressure || record.heartRate || record.weight || record.bloodSugar) && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Vitals</h4>
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
                    {record.bloodSugar && (
                      <div>
                        <span className="text-gray-500">Sugar:</span>
                        <span className="ml-1 font-medium">{record.bloodSugar} mg/dL</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {record.fileUrl && isViewableFile(record.fileType) && (
                  <button
                    onClick={() => handleViewRecord(record)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    title="View file"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                )}
                
                {record.fileUrl && (
                  <button
                    onClick={() => handleDownloadRecord(record)}
                    disabled={downloadingRecord === record.id}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
                    title="Download file"
                  >
                    {downloadingRecord === record.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Download</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteConfirm(record.id)}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setCurrentView('overview')}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
        <h2 className="text-3xl font-bold text-gray-800">Medical Timeline</h2>
      </div>
      
      <MedicalTimeline events={timelineEvents} />
    </div>
  );

  const renderPrescriptions = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setCurrentView('overview')}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
        <h2 className="text-3xl font-bold text-gray-800">Prescription Management</h2>
      </div>
      
      <PrescriptionUpload userId={user.id} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Patient Vault
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-700">{user.name}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onEmergency}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Emergency</span>
                </button>

                <button
                  onClick={onShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'records' && renderRecords()}
        {currentView === 'timeline' && renderTimeline()}
        {currentView === 'prescriptions' && renderPrescriptions()}
      </main>

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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add Medical Record</h3>
                <button
                  onClick={() => setShowAddRecord(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {uploadError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{uploadError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Annual Checkup, Blood Test Results"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      name="doctorName"
                      value={formData.doctorName}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      name="visitDate"
                      value={formData.visitDate}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
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
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="70"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="175"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Pressure
                      </label>
                      <input
                        type="text"
                        name="bloodPressure"
                        value={formData.bloodPressure}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="120/80"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (bpm)
                      </label>
                      <input
                        type="number"
                        name="heartRate"
                        value={formData.heartRate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="72"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Sugar (mg/dL)
                      </label>
                      <input
                        type="number"
                        name="bloodSugar"
                        value={formData.bloodSugar}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attach File (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supported formats: PDF, JPG, PNG (max 10MB)
                  </p>
                  {selectedFile && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getFileTypeIcon(selectedFile.type)}</span>
                        <span className="text-sm font-medium text-blue-800">{selectedFile.name}</span>
                        <span className="text-xs text-blue-600">
                          ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddRecord(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                    <span>{uploading ? 'Adding...' : 'Add Record'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Viewer Modal */}
      <AnimatePresence>
        {showRecordViewer && selectedRecord && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">{selectedRecord.title}</h3>
                <button
                  onClick={() => setShowRecordViewer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 p-6">
                {selectedRecord.fileUrl && isViewableFile(selectedRecord.fileType) ? (
                  <div className="h-full">
                    {selectedRecord.fileType.includes('pdf') ? (
                      <iframe
                        src={selectedRecord.fileUrl}
                        className="w-full h-full rounded-lg border border-gray-200"
                        title={selectedRecord.title}
                      />
                    ) : (
                      <img
                        src={selectedRecord.fileUrl}
                        alt={selectedRecord.title}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">File cannot be previewed</p>
                      <p className="text-gray-400">Download the file to view it</p>
                      {selectedRecord.fileUrl && (
                        <button
                          onClick={() => handleDownloadRecord(selectedRecord)}
                          className="mt-4 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mx-auto"
                        >
                          <Download className="w-5 h-5" />
                          <span>Download File</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Medical Record
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this medical record? This action cannot be undone and will permanently remove the record and any attached files.
                </p>

                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{deleteError}</p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(null);
                      setDeleteError(null);
                    }}
                    disabled={deletingRecord === showDeleteConfirm}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRecord(showDeleteConfirm)}
                    disabled={deletingRecord === showDeleteConfirm}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {deletingRecord === showDeleteConfirm ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
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
        currentPage={currentView}
      />
    </div>
  );
};

export default Dashboard;