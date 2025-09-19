import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { X, Upload, File, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
  "data-testid"?: string;
}

export default function FileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = "image/*,.pdf,.doc,.docx",
  "data-testid": testId,
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Clear previous errors
      setErrors([]);
      const newErrors: string[] = [];

      // Handle rejected files
      rejectedFiles.forEach((file) => {
        if (file.errors) {
          file.errors.forEach((error: any) => {
            if (error.code === "file-too-large") {
              newErrors.push(`${file.file.name}: File is too large (max ${Math.round(maxSize / (1024 * 1024))}MB)`);
            } else if (error.code === "file-invalid-type") {
              newErrors.push(`${file.file.name}: Invalid file type`);
            } else {
              newErrors.push(`${file.file.name}: ${error.message}`);
            }
          });
        }
      });

      // Check if adding files would exceed maxFiles
      if (files.length + acceptedFiles.length > maxFiles) {
        newErrors.push(`Cannot upload more than ${maxFiles} files`);
        setErrors(newErrors);
        return;
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      // Simulate upload progress for accepted files
      const newFiles = [...files, ...acceptedFiles];
      onFilesChange(newFiles);

      // Simulate upload progress
      acceptedFiles.forEach((file) => {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`;
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setUploadProgress((prev) => {
              const next = { ...prev };
              delete next[fileId];
              return next;
            });
          } else {
            setUploadProgress((prev) => ({
              ...prev,
              [fileId]: Math.round(progress),
            }));
          }
        }, 200);
      });
    },
    [files, onFilesChange, maxFiles, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize,
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
        <i className="fas fa-image text-blue-600 dark:text-blue-400 text-sm"></i>
      </div>;
    } else if (file.type === "application/pdf") {
      return <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
        <i className="fas fa-file-pdf text-red-600 dark:text-red-400 text-sm"></i>
      </div>;
    } else {
      return <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center">
        <File className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>;
    }
  };

  return (
    <div className="space-y-4" data-testid={testId}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center bg-accent/50 transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-accent/70"
        )}
        data-testid="dropzone-area"
      >
        <input {...getInputProps()} data-testid="file-input" />
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        
        {isDragActive ? (
          <div>
            <p className="text-sm text-primary font-medium mb-2">Drop files here...</p>
            <p className="text-xs text-muted-foreground">Release to upload</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Drag and drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mb-4">
              Support: PDF, DOC, JPG, PNG (Max {Math.round(maxSize / (1024 * 1024))}MB each, {maxFiles} files max)
            </p>
            <Button type="button" variant="secondary" size="sm" data-testid="browse-files-button">
              Browse Files
            </Button>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-destructive" data-testid={`error-message-${index}`}>
                  {error}
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Uploaded Files ({files.length}/{maxFiles})
          </p>
          
          {files.map((file, index) => {
            const fileId = `${file.name}-${file.size}-${file.lastModified}`;
            const progress = uploadProgress[fileId];
            
            return (
              <Card key={fileId} className="p-3" data-testid={`file-item-${index}`}>
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate" data-testid={`file-name-${index}`}>
                        {file.name}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(index)}
                        data-testid={`remove-file-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground" data-testid={`file-size-${index}`}>
                      {formatFileSize(file.size)}
                    </p>
                    
                    {progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-1" data-testid={`upload-progress-${index}`} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {progress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
