export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface MedicalRecord {
  id: string;
  title: string;
  doctorName: string;
  visitDate: string;
  category: 'prescription' | 'lab-results' | 'imaging' | 'checkup' | 'other';
  fileType: string;
  fileSize: string;
  uploadDate: string;
  fileUrl?: string;
  // Vitals fields
  weight?: number;
  height?: number;
  bloodPressure?: string;
  heartRate?: number;
  bloodSugar?: number;
}

export interface UploadedPrescription {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  file_type: string;
  file_size: string;
  status: 'new' | 'analyzed' | 'processing' | 'error';
  ai_summary?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'record' | 'prescription' | 'emergency';
  date: string;
  time?: string;
  title: string;
  description: string;
  data: MedicalRecord | UploadedPrescription | any;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface ShareLink {
  id: string;
  recordId: string;
  expiresAt: string;
  accessCount: number;
  maxAccess: number;
}