const CLOUD_NAME = 'dx4rhmmle';
const API_KEY = '172794682366262';
const API_SECRET = 'IWFiq9IPOdgr9AiOpVB7U5pJ2zo';

// Helper to generate SHA-1 hash using Web Crypto API
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Extract public_id from Cloudinary URL
export function getPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;

    const cleanUrl = url.split('?')[0].split('#')[0];
    const parts = cleanUrl.split('/upload/');
    if (parts.length < 2) return null;

    let path = parts[1];

    // Check if version tag exists (e.g. /v123456789/...)
    const versionMatch = path.match(/(?:^|\/)v\d+\/(.+)$/);
    if (versionMatch && versionMatch[1]) {
      path = versionMatch[1];
    } else {
      // If no version tag, check if the first segment is a transformation string (e.g. c_scale,w_500, q_auto, etc.)
      const segments = path.split('/');
      if (segments.length > 1 && (segments[0].includes('_') || segments[0].includes(','))) {
        path = segments.slice(1).join('/');
      }
    }

    // Strip file extension (.jpg, .png, .webp, etc.)
    const lastDot = path.lastIndexOf('.');
    const publicId = lastDot !== -1 ? path.substring(0, lastDot) : path;
    return decodeURIComponent(publicId) || null;
  } catch (error) {
    console.error("Failed to parse public_id from URL", url);
    return null;
  }
}

/**
 * Uploads an image file to Cloudinary with authentication signature.
 */
export async function uploadCloudinaryImage(file: File): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(stringToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Cloudinary upload failed (status ${response.status})`);
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Client-side high quality image compression fallback (WebP/JPEG)
 */
export async function compressImageToDataUrl(file: File, maxWidth = 1400, maxHeight = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Deletes an image from Cloudinary using signed destroy API.
 */
export async function deleteCloudinaryImage(url: string): Promise<boolean> {
  if (!url || !url.includes('cloudinary.com')) return false;

  const publicId = getPublicIdFromUrl(url);
  if (!publicId) {
    console.warn("Could not determine public_id for Cloudinary URL:", url);
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;

  try {
    const signature = await sha1(stringToSign);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn("Cloudinary destroy response not ok:", errorData);
      return false;
    }

    const result = await response.json();
    console.log(`Cloudinary destroy result for "${publicId}":`, result);
    return result.result === 'ok';
  } catch (error) {
    console.warn("Could not delete image from Cloudinary:", error);
    return false;
  }
}

