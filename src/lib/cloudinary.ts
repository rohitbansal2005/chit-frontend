// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};

// Validate required environment variables
if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
  throw new Error('Missing required Cloudinary environment variables');
}

// Cloudinary upload function for frontend
export const uploadToCloudinary = async (file: File, folder: string = 'chitz') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', folder);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
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
