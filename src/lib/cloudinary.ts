// Cloudinary Configuration (frontend)
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};

// Upload helper: uses signed uploads by default (recommended).
// If an unsigned `VITE_CLOUDINARY_UPLOAD_PRESET` exists, the helper will fall back to unsigned uploads.
export const uploadToCloudinary = async (file: File, folder: string = 'chitz') => {
  const cloudName = CLOUDINARY_CONFIG.cloudName;
  if (!cloudName) throw new Error('Missing VITE_CLOUDINARY_CLOUD_NAME');

  // If an unsigned preset exists on the frontend env, use the old unsigned flow (quick testing).
  if (CLOUDINARY_CONFIG.uploadPreset) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height };
  }

  // Signed flow: request signature from backend
  const sigResp = await fetch(`/api/uploads/sign?folder=${encodeURIComponent(folder)}`);
  if (!sigResp.ok) throw new Error('Failed to obtain upload signature');
  const { signature, api_key, timestamp } = await sigResp.json();

  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', api_key);
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);
  fd.append('folder', folder);

  const uploadResp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
  if (!uploadResp.ok) throw new Error('Signed upload failed');
  const uploadData = await uploadResp.json();
  return { url: uploadData.secure_url, publicId: uploadData.public_id, width: uploadData.width, height: uploadData.height };
};

// Generate Cloudinary URL with transformations
export const getCloudinaryUrl = (publicId: string, transformations?: string) => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  return transformations 
    ? `${baseUrl}/${transformations}/${publicId}`
    : `${baseUrl}/${publicId}`;
};

// Common image transformations
export const IMAGE_TRANSFORMATIONS = {
  avatar: 'w_150,h_150,c_fill,g_face,r_max,f_auto,q_auto',
  groupIcon: 'w_200,h_200,c_fill,r_20,f_auto,q_auto',
  messageImage: 'w_500,f_auto,q_auto',
  thumbnail: 'w_100,h_100,c_fill,f_auto,q_auto'
};

export default CLOUDINARY_CONFIG;
