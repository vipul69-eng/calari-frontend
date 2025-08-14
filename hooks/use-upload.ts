/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useImageUpload.ts
import { useState, useCallback } from 'react';
import { AxiosProgressEvent, isAxiosError } from 'axios';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

interface UploadResult {
  success: boolean;
  fileId: string;
  hostableLink: string;
  fileName: string;
  size: number;
  uploadedAt: string;
}

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<UploadResult>;
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadResult: UploadResult | null;
  reset: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const {getToken} = useAuth()

  const uploadImage = useCallback(async (file: File): Promise<UploadResult> => {
    // Reset state
    setError(null);
    setProgress(0);
    setUploadResult(null);

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    setUploading(true);
    const token = await getToken()
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('image', file);

      // Upload with progress tracking
      const response = await api.post<UploadResult>(
        `/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
            }
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const result = response.data;
      setUploadResult(result);
      

      return result;

    } catch (err: any) {
      let errorMessage = 'Upload failed';
      
      if (isAxiosError(err)) {
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Upload timeout - please try again';
        } else if (err.response?.status === 413) {
          errorMessage = 'File too large - maximum 10MB allowed';
        } else if ((err as any).response?.status >= 500) {
          errorMessage = 'Server error - please try again';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);

    } finally {
      setUploading(false);
      setProgress(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setUploading(false);
    setUploadResult(null);
  }, []);

  return {
    uploadImage,
    uploading,
    progress,
    error,
    uploadResult,
    reset,
  };
};
