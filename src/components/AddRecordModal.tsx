import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  FileText, 
  Calendar, 
  User, 
  Upload, 
  Save, 
  AlertCircle,
  Check,
  Loader2,
  Weight,
  Activity,
  Heart,
  Droplets,
  Ruler
} from 'lucide-react';
import { MedicalRecord } from '../types';

interface AddRecordModalProps {
  onClose: () => void;
  onSave: (record: Omit<MedicalRecord, 'id' | 'uploadDate'>) => Promise<any>;
  onUploadFile: (file: File, recordId: string) => Promise<string | null>;
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({ onClose, onSave, onUploadFile }) => {
  const [formData, setFormData] = useState({
    title: '',
    doctorName: '',
    visitDate: '',
    category: 'other' as MedicalRecord['category'],
    weight: '',
    height: '',
    bloodPressure: '',
    heartRate: '',
    bloodSugar: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'checkup', label: 'Checkup', icon: '🩺' },
    { value: 'lab-results', label: 'Lab Results', icon: '🧪' },
    { value: 'imaging', label: 'Imaging', icon: '🔬' },
    { value: 'prescription', label: 'Prescription', icon: '💊' },
    { value: 'other', label: 'Other', icon: '📄' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPG, and PNG files are allowed.');
        return;
      }

      if (file.size > maxSize) {
        setError('File size must be less than 10MB.');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a title for the record.');
      return;
    }

    if (!formData.doctorName.trim()) {
      setError('Please enter the doctor\'s name.');
      return;
    }

    if (!formData.visitDate) {
      setError('Please select a visit date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare record data
      const recordData: Omit<MedicalRecord, 'id' | 'uploadDate'> = {
        title: formData.title.trim(),
        doctorName: formData.doctorName.trim(),
        visitDate: formData.visitDate,
        category: formData.category,
        fileType: selectedFile ? selectedFile.type : 'PDF',
        fileSize: selectedFile ? '${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB' : '0 MB',
        fileUrl: undefined,
        // Vitals data
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        bloodPressure: formData.bloodPressure.trim() || undefined,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        bloodSugar: formData.bloodSugar ? parseFloat(formData.bloodSugar) : undefined,
      };

      // Save the record first
      const savedRecord = await onSave(recordData);
      
      // Upload file if selected
      if (selectedFile && savedRecord?.id) {
        await onUploadFile(selectedFile, savedRecord.id);
      }

      setSuccess(true);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Error saving record:', error);
      setError(error.message || 'Failed to save medical record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Check className="w-8 h-8 text-green-600" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Record Saved!</h3>
        <p className="text-gray-600">Your medical record has been successfully added.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Add Medical Record</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2"
        >
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Annual Physical Exam, Blood Test Results"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Name *
              </label>
              <input
                type="text"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dr. Smith"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visit Date *
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
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vitals Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Vital Signs (Optional)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Weight className="w-4 h-4" />
                <span>Weight (kg)</span>
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="70"
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Ruler className="w-4 h-4" />
                <span>Height (cm)</span>
              </label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="175"
                step="0.1"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>Heart Rate (bpm)</span>
              </label>
              <input
                type="number"
                name="heartRate"
                value={formData.heartRate}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="72"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Activity className="w-4 h-4" />
                <span>Blood Pressure</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Droplets className="w-4 h-4" />
                <span>Blood Sugar (mg/dL)</span>
              </label>
              <input
                type="number"
                name="bloodSugar"
                value={formData.bloodSugar}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100"
                step="0.1"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Upload className="w-5 h-5 text-green-600" />
            <span>Attach Document (Optional)</span>
          </h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-1">Click to upload a file</p>
              <p className="text-sm text-gray-500">PDF, JPG, PNG up to 10MB</p>
            </label>
            
            {selectedFile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">{selectedFile.name}</p>
                <p className="text-green-600 text-sm">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
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
    </div>
  );
};

export default AddRecordModal;