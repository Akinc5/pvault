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

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued';
  notes?: string;
  sideEffects?: string[];
}

export interface Checkup {
  id: string;
  type: string;
  doctorName: string;
  facility: string;
  date: string;
  time: string;
  duration: number; // in minutes
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  followUpDate?: string;
  vitals: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  notes: string;
}

export interface TimelineEvent {
  id: string;
  type: 'checkup' | 'medication' | 'record' | 'emergency';
  date: string;
  time?: string;
  title: string;
  description: string;
  data: Checkup | Medication | MedicalRecord | any;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface ShareLink {
  id: string;
  recordId: string;
  expiresAt: string;
  accessCount: number;
  maxAccess: number;
}