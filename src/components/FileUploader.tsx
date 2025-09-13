import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Image, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  acceptedTypes?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export const FileUploader = ({
  files,
  onFilesChange,
  acceptedTypes = "image/*,.json",
  maxFiles = 10,
  maxSize = 20,
  disabled = false
}: FileUploaderProps) => {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          toast({
            title: "File too large",
            description: `${file.name} is larger than ${maxSize}MB`,
            variant: "destructive"
          });
        } else if (error.code === 'file-invalid-type') {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported file type`,
            variant: "destructive"
          });
        }
      });
    });

    // Check total file count
    if (files.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    // Add accepted files
    const newFiles = [...files, ...acceptedFiles];
    onFilesChange(newFiles);

    // Simulate upload progress
    acceptedFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          }, 1000);
        }
      }, 100);
    });
  }, [files, maxFiles, maxSize, onFilesChange, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.split(',').reduce((acc, type) => {
      acc[type.trim()] = [];
      return acc;
    }, {} as any),
    maxFiles: maxFiles - files.length,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    disabled
  });

  const removeFile = (fileToRemove: File) => {
    const newFiles = files.filter(file => file !== fileToRemove);
    onFilesChange(newFiles);
    
    // Clear progress if file is being uploaded
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        {...getRootProps()}
        className={`cursor-pointer transition-colors border-2 border-dashed ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          
          {isDragActive ? (
            <div>
              <p className="text-lg font-medium text-primary">Drop files here...</p>
              <p className="text-sm text-muted-foreground">Release to upload</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supported: {acceptedTypes} • Max {maxFiles} files • {maxSize}MB each
              </p>
              <Button variant="outline" type="button" disabled={disabled}>
                Choose Files
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-card-foreground">
            Uploaded Files ({files.length}/{maxFiles})
          </h4>
          
          {files.map((file, index) => (
            <Card key={`${file.name}-${index}`} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {uploadProgress[file.name] !== undefined ? (
                    <div className="w-24">
                      <Progress value={uploadProgress[file.name]} className="h-2" />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* File Count Warning */}
      {files.length >= maxFiles * 0.8 && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>
            {files.length >= maxFiles 
              ? `Maximum file limit reached (${maxFiles})`
              : `Approaching file limit (${files.length}/${maxFiles})`
            }
          </span>
        </div>
      )}
    </div>
  );
};