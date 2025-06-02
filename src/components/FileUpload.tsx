import { useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  selectedTool: string;
  onFilesUploaded: (files: File[]) => void;
  onNext: () => void;
}

export const FileUpload = ({ selectedTool, onFilesUploaded, onNext }: FileUploadProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['.pdf'];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (files: File[]): File[] => {
    return files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isValidFormat = extension && acceptedTypes.includes(`.${extension}`);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      if (!isValidFormat) {
        toast({
          title: "Invalid file format",
          description: "Please upload PDF files only.",
          variant: "destructive"
        });
        return false;
      }

      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB.",
          variant: "destructive"
        });
        return false;
      }

      return true;
    });
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const validFiles = validateFiles(Array.from(e.target.files));

    if (validFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(newFiles);
      onFilesUploaded(newFiles);
      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} file(s) added.`,
      });
    }
  }, [uploadedFiles, onFilesUploaded, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      const validFiles = validateFiles(Array.from(files));
      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
        onFilesUploaded(validFiles);
      }
    }
  }, [onFilesUploaded]);

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesUploaded(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-border/50">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Upload className="h-6 w-6 text-blue-500" />
                Upload Files
              </h2>
              <p className="text-muted-foreground">
                Upload your documents to process
              </p>
            </div>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-border/50 hover:border-blue-500/50 hover:bg-blue-500/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Supports PDF files up to 10MB each
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop your files here, or click to browse
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
              >
                Choose Files
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept=".pdf"
              aria-label="Upload PDF files"
            />
          </div>
        </div>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="border border-border/50">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Ready to process • {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
              </div>
              <Button 
                onClick={onNext}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={uploadedFiles.length === 0}
              >
                Continue
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
