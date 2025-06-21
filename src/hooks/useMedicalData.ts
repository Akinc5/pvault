import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MedicalRecord, Checkup, Medication, TimelineEvent } from '../types';

export const useMedicalData = (userId: string | null) => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      console.log('Fetching medical data for user:', userId);
      fetchAllMedicalData();
    } else {
      console.log('No user ID provided, skipping medical data fetch');
      setLoading(false);
      // Clear data when no user
      setMedicalRecords([]);
      setCheckups([]);
      setMedications([]);
      setTimelineEvents([]);
    }
  }, [userId]);

  const fetchAllMedicalData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Starting to fetch all medical data...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
      );
      
      const dataPromise = Promise.all([
        fetchMedicalRecords(),
        fetchCheckups(),
        fetchMedications(),
      ]);
      
      await Promise.race([dataPromise, timeoutPromise]);
      console.log('All medical data fetched successfully');
    } catch (error: any) {
      console.error('Error fetching medical data:', error);
      if (error.message === 'Data fetch timeout') {
        console.warn('Data fetch timed out, continuing with empty data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalRecords = async () => {
    if (!userId) return;

    try {
      console.log('Fetching medical records...');
      
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('user_id', userId)
        .order('visit_date', { ascending: false });

      if (error) {
        console.error('Error fetching medical records:', error);
        return;
      }

      const records: MedicalRecord[] = (data || []).map(record => ({
        id: record.id,
        title: record.title,
        doctorName: record.doctor_name,
        visitDate: record.visit_date,
        category: record.category,
        fileType: record.file_type,
        fileSize: record.file_size,
        uploadDate: record.uploaded_at.split('T')[0],
        fileUrl: record.file_url,
        // Include vitals data
        weight: record.weight,
        bloodPressure: record.blood_pressure,
        heartRate: record.heart_rate,
        bloodSugar: record.blood_sugar,
      }));

      console.log(`Fetched ${records.length} medical records`);
      setMedicalRecords(records);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    }
  };

  const fetchCheckups = async () => {
    if (!userId) return;

    try {
      console.log('Fetching checkups...');
      
      const { data, error } = await supabase
        .from('checkups')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching checkups:', error);
        return;
      }

      const checkupsData: Checkup[] = (data || []).map(checkup => ({
        id: checkup.id,
        type: checkup.type,
        doctorName: checkup.doctor_name,
        facility: checkup.facility,
        date: checkup.date,
        time: checkup.time,
        duration: checkup.duration,
        symptoms: checkup.symptoms,
        diagnosis: checkup.diagnosis,
        treatment: checkup.treatment,
        followUpDate: checkup.follow_up_date,
        vitals: checkup.vitals,
        notes: checkup.notes,
      }));

      console.log(`Fetched ${checkupsData.length} checkups`);
      setCheckups(checkupsData);
    } catch (error) {
      console.error('Error fetching checkups:', error);
      setCheckups([]);
    }
  };

  const fetchMedications = async () => {
    if (!userId) return;

    try {
      console.log('Fetching medications...');
      
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('Error fetching medications:', error);
        return;
      }

      const medicationsData: Medication[] = (data || []).map(medication => ({
        id: medication.id,
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        prescribedBy: medication.prescribed_by,
        prescribedDate: medication.prescribed_date,
        startDate: medication.start_date,
        endDate: medication.end_date,
        status: medication.status,
        notes: medication.notes,
        sideEffects: medication.side_effects,
      }));

      console.log(`Fetched ${medicationsData.length} medications`);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setMedications([]);
    }
  };

  // Generate timeline events from all medical data
  useEffect(() => {
    console.log('Generating timeline events...');
    
    const events: TimelineEvent[] = [
      // Checkup events
      ...checkups.map(checkup => ({
        id: `checkup-${checkup.id}`,
        type: 'checkup' as const,
        date: checkup.date,
        time: checkup.time,
        title: checkup.type,
        description: `Visit with ${checkup.doctorName} at ${checkup.facility}`,
        data: checkup,
        importance: checkup.type.toLowerCase().includes('urgent') ? 'high' as const : 'medium' as const
      })),
      
      // Medication events
      ...medications.map(medication => ({
        id: `medication-${medication.id}`,
        type: 'medication' as const,
        date: medication.prescribedDate,
        title: `${medication.name} Prescribed`,
        description: `${medication.dosage} - ${medication.frequency}`,
        data: medication,
        importance: medication.status === 'active' ? 'medium' as const : 'low' as const
      })),
      
      // Record events
      ...medicalRecords.map(record => ({
        id: `record-${record.id}`,
        type: 'record' as const,
        date: record.uploadDate,
        title: record.title,
        description: `Medical record uploaded - ${record.category}`,
        data: record,
        importance: 'low' as const
      }))
    ];

    // Sort by date (most recent first)
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Generated ${events.length} timeline events`);
    setTimelineEvents(events);
  }, [checkups, medications, medicalRecords]);

  const addMedicalRecord = async (record: Omit<MedicalRecord, 'id' | 'uploadDate'>) => {
    if (!userId) return;

    try {
      console.log('Adding medical record:', record.title);
      
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          user_id: userId,
          title: record.title,
          doctor_name: record.doctorName,
          visit_date: record.visitDate,
          category: record.category,
          file_type: record.fileType,
          file_size: record.fileSize,
          file_url: record.fileUrl || null,
          // Include vitals data
          weight: record.weight || null,
          blood_pressure: record.bloodPressure || null,
          heart_rate: record.heartRate || null,
          blood_sugar: record.bloodSugar || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding medical record:', error);
        throw error;
      }

      console.log('Medical record added successfully');
      await fetchMedicalRecords();
      return data;
    } catch (error) {
      console.error('Error in addMedicalRecord:', error);
      throw error;
    }
  };

  const uploadFile = async (file: File, recordId: string): Promise<string | null> => {
    if (!userId) return null;

    try {
      console.log('Uploading file:', file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${recordId}-${Date.now()}.${fileExt}`;

      // First, ensure we have a storage bucket
      await ensureStorageBucket();

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('medical-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        
        // If bucket doesn't exist, try to create it and retry
        if (error.message.includes('Bucket not found')) {
          console.log('Bucket not found, attempting to create...');
          await createStorageBucket();
          
          // Retry upload
          const { data: retryData, error: retryError } = await supabase.storage
            .from('medical-files')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) {
            console.error('Retry upload failed:', retryError);
            throw retryError;
          }
          
          console.log('File uploaded successfully on retry');
        } else {
          throw error;
        }
      }

      // Get signed URL for secure access
      let publicUrl: string;
      
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('medical-files')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedError) {
          console.warn('Signed URL failed, trying public URL:', signedError);
          const { data: { publicUrl: fallbackUrl } } = supabase.storage
            .from('medical-files')
            .getPublicUrl(fileName);
          publicUrl = fallbackUrl;
        } else {
          publicUrl = signedData.signedUrl;
        }
      } catch (urlError) {
        console.warn('URL generation failed, using fallback:', urlError);
        const { data: { publicUrl: fallbackUrl } } = supabase.storage
          .from('medical-files')
          .getPublicUrl(fileName);
        publicUrl = fallbackUrl;
      }

      // Update the medical record with the file URL
      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ file_url: publicUrl })
        .eq('id', recordId);

      if (updateError) {
        console.error('Error updating record with file URL:', updateError);
        // Don't throw error here, file was uploaded successfully
      }

      console.log('File uploaded successfully and record updated');
      return publicUrl;
    } catch (error: any) {
      console.error('Error in uploadFile:', error);
      // Don't throw error, just log it and return null
      console.warn('File upload failed, continuing without file');
      return null;
    }
  };

  // Ensure storage bucket exists
  const ensureStorageBucket = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking buckets:', error);
        return;
      }

      const medicalFilesBucket = buckets?.find(bucket => bucket.name === 'medical-files');
      
      if (!medicalFilesBucket) {
        console.log('medical-files bucket not found, attempting to create...');
        await createStorageBucket();
      } else {
        console.log('medical-files bucket exists');
      }
    } catch (error) {
      console.error('Error ensuring storage bucket:', error);
    }
  };

  // Create storage bucket
  const createStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.createBucket('medical-files', {
        public: false, // Private bucket for security
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        fileSizeLimit: 10485760 // 10MB limit
      });

      if (error) {
        console.error('Error creating storage bucket:', error);
        throw error;
      }

      console.log('Storage bucket created successfully:', data);
      
      // Set up storage policies for the new bucket
      await setupStoragePolicies();
      
    } catch (error) {
      console.error('Error in createStorageBucket:', error);
      throw error;
    }
  };

  // Setup storage policies for the bucket
  const setupStoragePolicies = async () => {
    try {
      // Note: Storage policies need to be set up via Supabase dashboard or SQL
      // This is a placeholder for the policy setup
      console.log('Storage policies should be set up via Supabase dashboard');
      console.log('Required policies:');
      console.log('1. Allow authenticated users to INSERT their own files');
      console.log('2. Allow authenticated users to SELECT their own files');
      console.log('3. Allow authenticated users to UPDATE their own files');
      console.log('4. Allow authenticated users to DELETE their own files');
    } catch (error) {
      console.error('Error setting up storage policies:', error);
    }
  };

  return {
    medicalRecords,
    checkups,
    medications,
    timelineEvents,
    loading,
    addMedicalRecord,
    uploadFile,
    refetch: fetchAllMedicalData,
  };
};