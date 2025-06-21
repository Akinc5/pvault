import { useState } from 'react';
import { supabase } from '../lib/supabase';

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

export const usePrescriptionStorage = (userId: string | null) => {
  const [uploading, setUploading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<UploadedPrescription[]>([]);
  const [loading, setLoading] = useState(false);

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, JPG, and PNG files are allowed for prescriptions.';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB.';
    }

    return null;
  };

  // Ensure storage bucket exists for prescriptions
  const ensurePrescriptionsBucket = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking buckets:', error);
        return;
      }

      const prescriptionsBucket = buckets?.find(bucket => bucket.name === 'prescriptions');
      
      if (!prescriptionsBucket) {
        console.log('prescriptions bucket not found, attempting to create...');
        await createPrescriptionsBucket();
      } else {
        console.log('prescriptions bucket exists');
      }
    } catch (error) {
      console.error('Error ensuring prescriptions bucket:', error);
    }
  };

  // Create prescriptions storage bucket
  const createPrescriptionsBucket = async () => {
    try {
      const { data, error } = await supabase.storage.createBucket('prescriptions', {
        public: false, // Private bucket for security
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        fileSizeLimit: 10485760 // 10MB limit
      });

      if (error) {
        console.error('Error creating prescriptions bucket:', error);
        throw error;
      }

      console.log('Prescriptions storage bucket created successfully:', data);
      
      // Set up storage policies for the new bucket
      await setupPrescriptionStoragePolicies();
      
    } catch (error) {
      console.error('Error in createPrescriptionsBucket:', error);
      throw error;
    }
  };

  // Setup storage policies for prescriptions bucket
  const setupPrescriptionStoragePolicies = async () => {
    try {
      // Note: Storage policies need to be set up via Supabase dashboard or SQL
      // This is a placeholder for the policy setup
      console.log('Prescription storage policies should be set up via Supabase dashboard');
      console.log('Required policies for prescriptions bucket:');
      console.log('1. Allow authenticated users to INSERT their own prescription files');
      console.log('2. Allow authenticated users to SELECT their own prescription files');
      console.log('3. Allow authenticated users to UPDATE their own prescription files');
      console.log('4. Allow authenticated users to DELETE their own prescription files');
    } catch (error) {
      console.error('Error setting up prescription storage policies:', error);
    }
  };

  // Upload prescription file to Supabase Storage
  const uploadPrescription = async (file: File): Promise<UploadedPrescription> => {
    if (!userId) {
      throw new Error('User must be authenticated to upload files');
    }

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    setUploading(true);

    try {
      // First, ensure we have a storage bucket
      await ensurePrescriptionsBucket();

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading prescription file:', fileName);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        
        // If bucket doesn't exist, try to create it and retry
        if (uploadError.message.includes('Bucket not found')) {
          console.log('Bucket not found, attempting to create...');
          await createPrescriptionsBucket();
          
          // Retry upload
          const { data: retryData, error: retryError } = await supabase.storage
            .from('prescriptions')
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
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      // Get signed URL for private access
      let fileUrl: string;
      
      try {
        const { data: urlData, error: urlError } = await supabase.storage
          .from('prescriptions')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

        if (urlError) {
          console.error('Error creating signed URL:', urlError);
          // Fallback to public URL (though bucket should be private)
          const { data: { publicUrl } } = supabase.storage
            .from('prescriptions')
            .getPublicUrl(fileName);
          
          fileUrl = publicUrl;
          console.warn('Using public URL as fallback:', publicUrl);
        } else {
          fileUrl = urlData.signedUrl;
        }
      } catch (urlError) {
        console.warn('URL generation failed, using fallback:', urlError);
        const { data: { publicUrl } } = supabase.storage
          .from('prescriptions')
          .getPublicUrl(fileName);
        fileUrl = publicUrl;
      }

      // Save metadata to database
      const prescriptionData = {
        user_id: userId,
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type,
        file_size: formatFileSize(file.size),
        status: 'new' as const
      };

      const { data: dbData, error: dbError } = await supabase
        .from('uploaded_prescriptions')
        .insert(prescriptionData)
        .select()
        .single();

      if (dbError) {
        console.error('Error saving prescription metadata:', dbError);
        // Try to clean up uploaded file
        await supabase.storage.from('prescriptions').remove([fileName]);
        throw new Error(`Failed to save prescription metadata: ${dbError.message}`);
      }

      console.log('Prescription uploaded successfully:', dbData);
      
      // Refresh prescriptions list
      await fetchPrescriptions();
      
      return dbData;

    } catch (error: any) {
      console.error('Error in uploadPrescription:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Fetch user's prescriptions
  const fetchPrescriptions = async () => {
    if (!userId) {
      setPrescriptions([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching prescriptions for user:', userId);
      
      const { data, error } = await supabase
        .from('uploaded_prescriptions')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} prescriptions`);
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error in fetchPrescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete prescription
  const deletePrescription = async (prescriptionId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      // Get prescription details first
      const { data: prescription, error: fetchError } = await supabase
        .from('uploaded_prescriptions')
        .select('*')
        .eq('id', prescriptionId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !prescription) {
        throw new Error('Prescription not found or access denied');
      }

      // Extract filename from URL for storage deletion
      const urlParts = prescription.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
      const fullPath = `${userId}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('prescriptions')
        .remove([fullPath]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploaded_prescriptions')
        .delete()
        .eq('id', prescriptionId)
        .eq('user_id', userId);

      if (dbError) {
        throw new Error(`Failed to delete prescription: ${dbError.message}`);
      }

      // Refresh prescriptions list
      await fetchPrescriptions();
      
      console.log('Prescription deleted successfully');
    } catch (error: any) {
      console.error('Error in deletePrescription:', error);
      throw error;
    }
  };

  // Update prescription status or AI summary
  const updatePrescription = async (
    prescriptionId: string, 
    updates: Partial<Pick<UploadedPrescription, 'status' | 'ai_summary'>>
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      const { error } = await supabase
        .from('uploaded_prescriptions')
        .update(updates)
        .eq('id', prescriptionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update prescription: ${error.message}`);
      }

      // Refresh prescriptions list
      await fetchPrescriptions();
      
      console.log('Prescription updated successfully');
    } catch (error: any) {
      console.error('Error in updatePrescription:', error);
      throw error;
    }
  };

  // Get download URL for prescription
  const getDownloadUrl = async (prescriptionId: string): Promise<string> => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      const { data: prescription, error } = await supabase
        .from('uploaded_prescriptions')
        .select('file_url, file_name')
        .eq('id', prescriptionId)
        .eq('user_id', userId)
        .single();

      if (error || !prescription) {
        throw new Error('Prescription not found or access denied');
      }

      // If the URL is already a signed URL, return it directly
      if (prescription.file_url.includes('token=')) {
        return prescription.file_url;
      }

      // Otherwise, generate a new signed URL
      const urlParts = prescription.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const fullPath = `${userId}/${fileName}`;

      const { data: urlData, error: urlError } = await supabase.storage
        .from('prescriptions')
        .createSignedUrl(fullPath, 60 * 60); // 1 hour expiry for downloads

      if (urlError) {
        console.error('Error creating download URL:', urlError);
        // Fallback to existing URL
        return prescription.file_url;
      }

      return urlData.signedUrl;
    } catch (error: any) {
      console.error('Error getting download URL:', error);
      throw error;
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    prescriptions,
    uploading,
    loading,
    uploadPrescription,
    fetchPrescriptions,
    deletePrescription,
    updatePrescription,
    getDownloadUrl,
    validateFile
  };
};