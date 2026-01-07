import { useState, useCallback } from "react";

interface UploadResponse {
  objectPath: string;
  objectUrl: string;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setProgress(100);

      // Generate a demo object path
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const objectPath = `videos/${timestamp}_${safeName}`;
      const objectUrl = `/storage/${objectPath}`;

      const response = { objectPath, objectUrl };
      options.onSuccess?.(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
  };
}
