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
function getPublicIdFromUrl(url: string): string | null {
  try {
    // Example URL: https://res.cloudinary.com/dx4rhmmle/image/upload/v1234567890/folder/sample.jpg
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const afterUpload = parts[1];

    // Remove the version tag if it exists (e.g., "v1234567890/")
    const pathWithoutVersion = afterUpload.replace(/^v\d+\//, '');

    // Remove the file extension
    const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
    return publicId || pathWithoutVersion; // Fallback if no extension
  } catch (error) {
    console.error("Failed to parse public_id from URL", url);
    return null;
  }
}

export async function deleteCloudinaryImage(url: string): Promise<boolean> {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) {
    console.error("Could not find public_id for url", url);
    return false;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // The signature string MUST include all parameters (except api_key and resource_type) in alphabetical order
  // For destroy, we just have public_id and timestamp.
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

    const result = await response.json();
    if (result.result === 'ok') {
      console.log(`Successfully deleted image: ${publicId}`);
      alert(`Deleted image ${publicId} successfully!`);
      return true;
    } else {
      console.error(`Failed to delete image: ${publicId}`, result);
      alert(`Cloudinary Error: ${JSON.stringify(result)}`);
      return false;
    }
  } catch (error: any) {
    console.error("Error deleting image from Cloudinary", error);
    alert(`Error calling Cloudinary: ${error.message}`);
    return false;
  }
}
