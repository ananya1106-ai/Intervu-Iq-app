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

/**
 * Cloudinary Cloud Name configuration.
 * Defaults to the verified account cloud name 'fe7g2fjs'.
 */
export const CLOUD_NAME = (
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'fe7g2fjs'
).trim();

/**
 * Resume upload preset configuration.
 * Supports VITE_CLOUDINARY_RESUME_PRESET or the shared VITE_CLOUDINARY_UPLOAD_PRESET.
 */
export const RESUME_PRESET = (
  import.meta.env.VITE_CLOUDINARY_RESUME_PRESET ||
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  'intervuq_upload'
).trim();

/**
 * Profile photo upload preset configuration.
 * Supports VITE_CLOUDINARY_PROFILE_UPLOAD_PRESET, VITE_CLOUDINARY_PROFILE_PRESET,
 * VITE_CLOUDINARY_PROFILE_PHOTO_PRESET, or the shared VITE_CLOUDINARY_UPLOAD_PRESET.
 */
export const PROFILE_PHOTO_PRESET = (
  import.meta.env.VITE_CLOUDINARY_PROFILE_UPLOAD_PRESET ||
  import.meta.env.VITE_CLOUDINARY_PROFILE_PRESET ||
  import.meta.env.VITE_CLOUDINARY_PROFILE_PHOTO_PRESET ||
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  RESUME_PRESET ||
  'intervuq_upload'
).trim();

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Resolves upload preset candidates in order of preference.
 * - Primary: The configured preset (e.g. intervuq_upload from env).
 * - Fallback: If Cloudinary returns "Upload preset not found", the verified
 *   preset variant (e.g. intervuiq_upload) is automatically attempted so
 *   uploads never fail due to preset naming differences.
 */
export function getPresetCandidates(primary: string): string[] {
  const candidates: string[] = [primary];
  if (primary === 'intervuq_upload') {
    candidates.push('intervuiq_upload');
  } else if (primary === 'intervuiq_upload') {
    candidates.push('intervuq_upload');
  } else {
    candidates.push('intervuiq_upload');
    candidates.push('intervuq_upload');
  }
  return Array.from(new Set(candidates.filter(Boolean)));
}

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
 * Performs a single Cloudinary upload XHR attempt for a given preset.
 */
function performCloudinaryUpload(
  endpointUrl: string,
  file: File,
  preset: string,
  folder: string,
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpointUrl, true);

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
        } catch {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          const message = errData?.error?.message || `Upload failed with status code ${xhr.status}`;
          const error: any = new Error(message);
          error.status = xhr.status;
          error.cloudinaryError = errData?.error;
          reject(error);
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
 * Uploads a resume file directly to Cloudinary using an Unsigned Upload Preset.
 * Uses https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload
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
  const presets = getPresetCandidates(RESUME_PRESET);

  let lastError: any = null;
  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    try {
      return await performCloudinaryUpload(url, file, preset, 'resumes', onProgress);
    } catch (err: any) {
      lastError = err;
      const isPresetNotFound = err?.message && err.message.toLowerCase().includes('upload preset not found');
      if (isPresetNotFound && i < presets.length - 1) {
        console.warn(`[Cloudinary] Preset "${preset}" not found on cloud "${CLOUD_NAME}". Retrying with "${presets[i + 1]}"...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Upload to Cloudinary failed.');
}

/**
 * Uploads a profile image directly to Cloudinary using an Unsigned Upload Preset.
 * Uses https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload
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
  const presets = getPresetCandidates(PROFILE_PHOTO_PRESET);

  let lastError: any = null;
  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    try {
      return await performCloudinaryUpload(url, file, preset, folderPath, onProgress);
    } catch (err: any) {
      lastError = err;
      const isPresetNotFound = err?.message && err.message.toLowerCase().includes('upload preset not found');
      if (isPresetNotFound && i < presets.length - 1) {
        console.warn(`[Cloudinary] Preset "${preset}" not found on cloud "${CLOUD_NAME}". Retrying with "${presets[i + 1]}"...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Upload to Cloudinary failed.');
}
