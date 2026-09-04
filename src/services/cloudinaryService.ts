/// <reference types="vite/client" />

export interface CloudinaryUploadResponse {
  fileName: string;
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
  created_at: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'fe7g2fjs';
const RESUME_PRESET = import.meta.env.VITE_CLOUDINARY_RESUME_PRESET || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'intervuiq_upload';
const PROFILE_PHOTO_PRESET = import.meta.env.VITE_CLOUDINARY_PROFILE_PRESET || import.meta.env.VITE_CLOUDINARY_PROFILE_PHOTO_PRESET || RESUME_PRESET;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file extension and size before attempting upload.
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileName = file.name || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: 'Invalid file format. Only PDF, DOC, and DOCX files are allowed.' 
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: 'File size exceeds the 10 MB limit.' 
    };
  }

  return { valid: true };
}

/**
 * Validates profile image format and size before uploading.
 */
export function validateProfilePhotoFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }

  const fileName = file.name || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension) && !file.type.startsWith('image/')) {
    return { 
      valid: false, 
      error: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.' 
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: 'Image file size exceeds the 5 MB limit.' 
    };
  }

  return { valid: true };
}

/**
 * Uploads a resume file directly to Cloudinary using Unsigned Upload Preset.
 * Tracks upload progress via optional callback.
 */
export async function uploadResumeToCloudinary(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResponse> {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', RESUME_PRESET);
  formData.append('folder', 'resumes');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const extension = file.name.split('.').pop()?.toLowerCase() || '';
          
          const result: CloudinaryUploadResponse = {
            fileName: file.name,
            secure_url: data.secure_url || data.url || '',
            public_id: data.public_id || '',
            bytes: data.bytes || file.size,
            format: data.format || extension,
            created_at: data.created_at || new Date().toISOString()
          };
          resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          const message = errData?.error?.message || `Upload failed with status code ${xhr.status}`;
          reject(new Error(message));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload to Cloudinary. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload request timed out. Please try again.'));
    };

    xhr.send(formData);
  });
}

/**
 * Uploads a profile image directly to Cloudinary using Unsigned Upload Preset.
 * Stores files inside the dedicated Cloudinary folder: `Profile Photo/${uid}`
 */
export async function uploadProfilePhotoToCloudinary(
  file: File,
  uid?: string,
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResponse> {
  const validation = validateProfilePhotoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Profile photo validation failed.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const folderPath = uid ? `Profile Photo/${uid}` : 'Profile Photo';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', PROFILE_PHOTO_PRESET);
  formData.append('folder', folderPath);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
          
          const result: CloudinaryUploadResponse = {
            fileName: file.name,
            secure_url: data.secure_url || data.url || '',
            public_id: data.public_id || '',
            bytes: data.bytes || file.size,
            format: data.format || extension,
            created_at: data.created_at || new Date().toISOString()
          };
          resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          const message = errData?.error?.message || `Upload failed with status code ${xhr.status}`;
          reject(new Error(message));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during profile photo upload to Cloudinary. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload request timed out. Please try again.'));
    };

    xhr.send(formData);
  });
}

