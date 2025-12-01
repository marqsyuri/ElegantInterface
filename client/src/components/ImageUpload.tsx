import { useState, useRef, useCallback } from 'react';
import { Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageData: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function ImageUpload({ 
  currentImage, 
  onImageChange, 
  placeholder = "Upload Image",
  className = ""
}: ImageUploadProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 300px for profile photos)
        const maxSize = 300;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress (higher quality for profile photos)
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert('Please select a JPG or PNG image.');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB.');
      return;
    }
    
    try {
      const compressedImage = await compressImage(file);
      setPreviewImage(compressedImage);
      onImageChange(compressedImage);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = () => {
    setPreviewImage(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Avatar Preview */}
        <Avatar className="w-12 h-12 flex-shrink-0">
          <AvatarImage src={previewImage || undefined} alt="Profile preview" />
          <AvatarFallback className="bg-slate-100">
            <User className="w-6 h-6 text-slate-400" />
          </AvatarFallback>
        </Avatar>

        {/* Upload Controls */}
        <div className="flex-1 min-w-0">
          {!previewImage ? (
            <div
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <p className="text-sm text-slate-600">
                Click to upload
              </p>
              <p className="text-xs text-slate-500">
                JPG or PNG, max 10MB
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-600 flex-1 truncate">Profile photo uploaded</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  );
}