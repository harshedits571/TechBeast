import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { deleteCloudinaryImage } from '../../utils/cloudinary';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
}

export default function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const UPLOAD_PRESET = 'vihdngdx';
  // TODO: Replace this with the actual cloud name once provided by the user
  const CLOUD_NAME = 'dx4rhmmle';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Basic validation
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} is not an image.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        newUrls.push(data.secure_url);
      }

      if (newUrls.length > 0) {
        onChange([...(images || []), ...newUrls]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload some images. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (indexToRemove: number) => {
    const imageToRemove = images[indexToRemove];
    const newImages = (images || []).filter((_, index) => index !== indexToRemove);
    onChange(newImages);
    
    // Auto-delete from Cloudinary
    if (imageToRemove) {
      console.log("Auto-deleting image from Cloudinary...");
      await deleteCloudinaryImage(imageToRemove);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-4 mb-4">
        {(images || []).map((url, index) => (
          <div key={index} className="relative w-24 h-24 group rounded-xl border border-white/10 overflow-hidden bg-white/5 shadow-md">
            <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-24 h-24 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 hover:text-blue-400 bg-[#0d0d0e]"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          ) : (
            <>
              <Upload className="w-6 h-6 mb-1" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Upload</span>
            </>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />
      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
        Upload high-quality images. Hosted securely on Cloudinary.
      </p>
    </div>
  );
}
