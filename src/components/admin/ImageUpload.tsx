import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { deleteCloudinaryImage } from '../../utils/cloudinary';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({ images, onChange, maxImages }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const showUploadControls = !maxImages || (images || []).length < maxImages;

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
    if (imageToRemove && imageToRemove.includes('cloudinary.com')) {
      console.log("Auto-deleting image from Cloudinary...");
      await deleteCloudinaryImage(imageToRemove);
    }
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    onChange([...(images || []), linkInput.trim()]);
    setLinkInput('');
  };

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    // For Firefox to allow dragging
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    }
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newImages = [...(images || [])];
      const draggedItemContent = newImages[dragItem.current];
      newImages.splice(dragItem.current, 1);
      newImages.splice(dragOverItem.current, 0, draggedItemContent);
      onChange(newImages);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap gap-4 mb-4">
        {(images || []).map((url, index) => (
          <div 
            key={index} 
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="relative w-24 h-24 group rounded-xl border border-white/10 overflow-hidden bg-white/5 shadow-md cursor-grab active:cursor-grabbing"
          >
            {index === 0 && (
               <div className="absolute bottom-0 w-full bg-blue-600/90 text-white text-[9px] font-bold text-center py-0.5 z-10 uppercase tracking-widest backdrop-blur-sm">Main</div>
            )}
            <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {showUploadControls && (
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
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      {showUploadControls && (
        <>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Upload high-quality images. Hosted securely on Cloudinary.
          </p>
          
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <input 
              type="text" 
              placeholder="Or paste an image URL here..." 
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="flex-1 bg-[#0d0d0e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors normal-case"
            />
            <button 
              type="button" 
              onClick={handleAddLink}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Add URL
            </button>
          </div>
        </>
      )}
    </div>
  );
}
