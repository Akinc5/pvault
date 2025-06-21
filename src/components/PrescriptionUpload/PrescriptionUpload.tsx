import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  Download,
  Trash2,
  Eye,
  Bot,
  Calendar,
  FileType,
  HardDrive
} from 'lucide-react';
import { usePrescriptionStorage, UploadedPrescription } from '../../hooks/usePrescriptionStorage';
import { analyzeMedicalDocument } from '../ChatBot/chatbotService';

interface PrescriptionUploadProps {
  userId: string;
  onAnalysisComplete?: (prescription: UploadedPrescription, analysis: string) => void;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ 
  userId, 
  onAnalysisComplete 
}) => {
  const {
    prescriptions,
    uploading,
    loading,
    uploadPrescription,
    fetchPrescriptions,
    deletePrescription,
    updatePrescription,
    getDownloadUrl,
    validateFile
  } = usePrescriptionStorage(userId);

  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Fetch prescriptions on mount
  useEffect(() => {
    fetchPrescriptions();
  }, [userId]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Upload selected file
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadError(null);
      const uploadedPrescription = await uploadPrescription(selectedFile);
      
      setUploadSuccess(`${selectedFile.name} uploaded successfully!`);
      setSelectedFile(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Auto-clear success message
      setTimeout(() => setUploadSuccess(null), 5000);

      // Trigger AI analysis
      await handleAnalyze(uploadedPrescription);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload prescription');
    }
  };

  // Analyze prescription with AI
  const handleAnalyze = async (prescription: UploadedPrescription) => {
    try {
      setAnalyzingId(prescription.id);
      
      // Update status to processing
      await updatePrescription(prescription.id, { status: 'processing' });

      // Create a mock medical record for analysis
      const mockRecord = {
        id: prescription.id,
        title: prescription.file_name,
        doctorName: 'Unknown',
        visitDate: new Date(prescription.uploaded_at).toISOString().split('T')[0],
        category: 'prescription' as const,
        fileType: prescription.file_type,
        fileSize: prescription.file_size,
        uploadDate: new Date(prescription.uploaded_at).toISOString().split('T')[0],
        fileUrl: prescription.file_url
      };

      // Generate AI analysis
      const analysis = analyzeMedicalDocument(mockRecord);
      
      // Update prescription with analysis
      await updatePrescription(prescription.id, { 
        status: 'analyzed',
        ai_summary: analysis
      });

      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(prescription, analysis);
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      await updatePrescription(prescription.id, { status: 'error' });
    } finally {
      setAnalyzingId(null);
    }
  };

  // Delete prescription
  const handleDelete = async (prescriptionId: string) => {
    try {
      await deletePrescription(prescriptionId);
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      setUploadError(error.message || 'Failed to delete prescription');
    }
  };

  // Download prescription
  const handleDownload = async (prescriptionId: string, fileName: string) => {
    try {
      const downloadUrl = await getDownloadUrl(prescriptionId);
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Download error:', error);
      setUploadError(error.message || 'Failed to download prescription');
    }
  };

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (fileType.includes('image')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      new: { color: 'bg-blue-100 text-blue-800', text: 'New' },
      processing: { color: 'bg-yellow-100 text-yellow-800', text: 'Analyzing...' },
      analyzed: { color: 'bg-green-100 text-green-800', text: 'Analyzed' },
      error: { color: 'bg-red-100 text-red-800', text: 'Error' }
    };

    const badge = badges[status as keyof typeof badges] || badges.new;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Upload className="w-6 h-6 text-blue-600" />
          <span>Upload Prescription</span>
        </h3>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-600 text-sm">{uploadError}</p>
            </motion.div>
          )}

          {uploadSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-2"
            >
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-600 text-sm">{uploadSuccess}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                {getFileIcon(selectedFile.type)}
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{uploading ? 'Uploading...' : 'Upload Prescription'}</span>
                </motion.button>
                
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your prescription here
                </p>
                <p className="text-gray-600 mb-4">
                  or click to browse files
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
              </div>
              
              <p className="text-sm text-gray-500">
                Supports PDF, JPG, PNG files up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Prescriptions List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-green-600" />
            <span>Your Prescriptions</span>
          </h3>
          
          {prescriptions.length > 0 && (
            <span className="text-sm text-gray-500">
              {prescriptions.length} file{prescriptions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Loading prescriptions...</span>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No prescriptions uploaded yet</p>
            <p className="text-gray-400">Upload your first prescription to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getFileIcon(prescription.file_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {prescription.file_name}
                      </h4>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(prescription.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <FileType className="w-4 h-4" />
                          <span>{prescription.file_type.split('/')[1]?.toUpperCase()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <HardDrive className="w-4 h-4" />
                          <span>{prescription.file_size}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        {getStatusBadge(prescription.status)}
                      </div>

                      {/* AI Summary */}
                      {prescription.ai_summary && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Bot className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">AI Analysis</span>
                          </div>
                          <p className="text-sm text-blue-700 whitespace-pre-wrap">
                            {prescription.ai_summary.substring(0, 200)}
                            {prescription.ai_summary.length > 200 && '...'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {prescription.status === 'new' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAnalyze(prescription)}
                        disabled={analyzingId === prescription.id}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                        title="Analyze with AI"
                      >
                        {analyzingId === prescription.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDownload(prescription.id, prescription.file_name)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteConfirm(prescription.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
                  Delete Prescription
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this prescription? This action cannot be undone.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrescriptionUpload;