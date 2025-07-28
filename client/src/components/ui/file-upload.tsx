import { useCallback, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesChange: (files: string[]) => void;
  files: string[];
  maxFiles?: number;
  accept?: string;
  className?: string;
  label?: string;
}

export function FileUpload({
  onFilesChange,
  files,
  maxFiles = 5,
  accept = "image/*",
  className,
  label = "Upload images"
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFileUrls: string[] = [];

    selectedFiles.forEach(file => {
      if (files.length + newFileUrls.length < maxFiles) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newFileUrls.push(event.target.result as string);
            if (newFileUrls.length === selectedFiles.length) {
              onFilesChange([...files, ...newFileUrls]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [files, maxFiles, onFilesChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFileUrls: string[] = [];

    droppedFiles.forEach(file => {
      if (files.length + newFileUrls.length < maxFiles && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newFileUrls.push(event.target.result as string);
            if (newFileUrls.length === droppedFiles.length) {
              onFilesChange([...files, ...newFileUrls]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [files, maxFiles, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  }, [files, onFilesChange]);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer",
          isDragOver 
            ? "border-green-500 bg-green-50" 
            : "border-border hover:border-green-500 hover:bg-green-50/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{label}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop images here, or click to select files
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} files • JPG, PNG, GIF
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border">
                <img
                  src={file}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}