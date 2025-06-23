import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MedicalRecord, TimelineEvent, UploadedPrescription } from '../types';

export const useMedicalData = (userId: string | null) => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<UploadedPrescription[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      console.log('Fetching medical data for user:', userId);
      fetchAllMedicalData();
    } else {
      console.log('No user ID provided, skipping medical data fetch');
      setLoading(false);
      setMedicalRecords([]);
      setPrescriptions([]);
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
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
      );
      
      const dataPromise = Promise.all([
        fetchMedicalRecords(),
        fetchPrescriptions(),
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
        weight: record.weight,
        height: record.height,
        bloodPressure: record.blood_pressure,
        heartRate: record.heart_rate,
        bloodSugar: record.blood_sugar,
      }));

      console.log(`Fetched ${records.length} medical records`);
      console.log('Records with height/weight data:', records.filter(r => r.height || r.weight));
      setMedicalRecords(records);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    }
  };

  const fetchPrescriptions = async () => {
    if (!userId) return;

    try {
      console.log('Fetching prescriptions...');
      
      const { data, error } = await supabase
        .from('uploaded_prescriptions')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        return;
      }

      const prescriptionsData: UploadedPrescription[] = (data || []).map(prescription => ({
        id: prescription.id,
        user_id: prescription.user_id,
        file_name: prescription.file_name,
        file_url: prescription.file_url,
        uploaded_at: prescription.uploaded_at,
        file_type: prescription.file_type,
        file_size: prescription.file_size,
        status: prescription.status,
        ai_summary: prescription.ai_summary,
      }));

      console.log(`Fetched ${prescriptionsData.length} prescriptions`);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    }
  };

  useEffect(() => {
    console.log('Generating timeline events...');
    
    const events: TimelineEvent[] = [
      ...medicalRecords.map(record => ({
        id: `record-${record.id}`,
        type: 'record' as const,
        date: record.uploadDate,
        title: record.title,
        description: `Medical record uploaded - ${record.category}`,
        data: record,
        importance: 'medium' as const
      })),
      ...prescriptions.map(prescription => ({
        id: `prescription-${prescription.id}`,
        type: 'prescription' as const,
        date: prescription.uploaded_at.split('T')[0],
        title: `Prescription: ${prescription.file_name}`,
        description: `Prescription uploaded - ${prescription.status}`,
        data: prescription,
        importance: prescription.status === 'analyzed' ? 'high' as const : 'medium' as const
      }))
    ];

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Generated ${events.length} timeline events`);
    setTimelineEvents(events);
  }, [medicalRecords, prescriptions]);

  const addMedicalRecord = async (record: Omit<MedicalRecord, 'id' | 'uploadDate'>) => {
    if (!userId) return;

    try {
      console.log('Adding medical record:', record.title);
      console.log('Record data:', record);
      
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          user_id: userId,
          title: record.title,
          doctor_name: record.doctorName,
          visit_date: record.visitDate,
          category: record.category,
          file_type: record.fileType || 'PDF',
          file_size: record.fileSize || '0 MB',
          file_url: record.fileUrl || null,
          weight: record.weight || null,
          height: record.height || null,
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

      console.log('Medical record added successfully:', data);
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

      const { data, error } = await supabase.storage
        .from('medical-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      let publicUrl: string;
      
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from('medical-files')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365);

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

      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ file_url: publicUrl })
        .eq('id', recordId);

      if (updateError) {
        console.error('Error updating record with file URL:', updateError);
      }

      console.log('File uploaded successfully and record updated');
      return publicUrl;
    } catch (error: any) {
      console.error('Error in uploadFile:', error);
      console.warn('File upload failed, continuing without file');
      return null;
    }
  };

  const deleteMedicalRecord = async (recordId: string) => {
    if (!recordId) return;

    try {
      console.log('Deleting medical record:', recordId);
      
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting medical record:', error);
        return;
      }

      console.log('Record deleted successfully');
      await fetchMedicalRecords();
    } catch (error) {
      console.error('Error in deleteMedicalRecord:', error);
    }
  };

  return {
    medicalRecords,
    prescriptions,
    timelineEvents,
    loading,
    addMedicalRecord,
    uploadFile,
    refetch: fetchAllMedicalData,
    deleteMedicalRecord, // ✅ added here
  };
};
