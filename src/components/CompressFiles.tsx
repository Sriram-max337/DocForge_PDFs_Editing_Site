import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Upload, FileImage, FileText, Download, X } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { downloadFile, createProcessedDocument } from "@/utils/downloadUtils";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from 'pdf-lib';

interface CompressedFile { 
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  blob: Blob;
  type: string;
}

interface CompressionOptions {
  level: 'light' | 'medium' | 'high' | 'custom';
  customSize?: number;
}

const CompressFiles = ({ onBack }: { onBack: () => void }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    level: 'medium'
  });
  const [customSize, setCustomSize] = useState<number>(50);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(true);
  const { toast } = useToast();

  const supportedFormats = ['pdf'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const getCompressionRatio = (level: string): number => {
    switch (level) {
      case 'light': return 0.7;
      case 'medium': return 0.5;
      case 'high': return 0.3;
      default: return 0.5;
    }
  };

  const handleFileUpload = (files: File[]) => {
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isValidFormat = extension && supportedFormats.includes(extension);
      const isValidSize = file.size <= maxFileSize;
      
      if (!isValidFormat) {
        toast({
          title: "Invalid file format",
          description: `${file.name} is not a supported format. Please use PDF files only.`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit.`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const handleNext = () => {
    setShowUpload(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const compressFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload files to compress.",
        variant: "destructive"
      });
      return;
    }

    setIsCompressing(true);
    setCompressionProgress(0);
    
    try {
      const compressed: CompressedFile[] = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const progress = ((i + 1) / uploadedFiles.length) * 100;
        setCompressionProgress(progress);
        
        if (file.type === 'application/pdf') {
          // Handle PDF compression
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          
          // Apply compression settings based on level
          const compressionLevel = compressionOptions.level;
          const quality = getCompressionRatio(compressionLevel);
          
          // Compress the PDF
          const compressedPdfBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 20,
            updateMetadata: false,
            compress: true
          });
          
          const compressedBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
          
          // Calculate compression ratio
          const originalSize = file.size;
          const compressedSize = compressedBlob.size;
          const ratio = ((originalSize - compressedSize) / originalSize) * 100;
          
          compressed.push({
            id: `${Date.now()}-${i}`,
            name: file.name,
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: ratio,
            blob: compressedBlob,
            type: file.type
          });
        } else {
          // Handle other file types using existing compression
          const compressedBlob = await createProcessedDocument(file, file.name, compressionOptions.level);
          
          const originalSize = file.size;
          const compressedSize = compressedBlob.size;
          const ratio = ((originalSize - compressedSize) / originalSize) * 100;
          
          compressed.push({
            id: `${Date.now()}-${i}`,
            name: file.name,
            originalSize: originalSize,
            compressedSize: compressedSize,
            compressionRatio: ratio,
            blob: compressedBlob,
            type: file.type
          });
        }
      }
      
      setCompressedFiles(compressed);
      setIsCompressing(false);
      
      toast({
        title: "Compression complete",
        description: `Successfully compressed ${compressed.length} file(s).`
      });
      
    } catch (error) {
      console.error('Error during compression:', error);
      setIsCompressing(false);
      
      toast({
        title: "Compression failed",
        description: "An error occurred during compression. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadCompressed = (file: CompressedFile) => {
    const fileName = file.name.replace(/\.[^/.]+$/, "") + "_compressed." + file.name.split('.').pop();
    downloadFile(file.blob, fileName, file.type);
    
    toast({
      title: "Download started",
      description: `Downloading ${fileName}`
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (showUpload) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Tools</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Upload className="h-6 w-6 text-blue-500" />
              <span>Compress Files</span>
            </h1>
            <p className="text-muted-foreground">Reduce file size while maintaining quality</p>
          </div>
        </div>

        {/* Supported Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supported File Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-red-500" />
                <span>PDF documents</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Maximum file size: 50MB per file
            </p>
          </CardContent>
        </Card>

        <FileUpload
          selectedTool="compress"
          onFilesUploaded={handleFileUpload}
          onNext={handleNext}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => setShowUpload(true)} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Upload</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Upload className="h-6 w-6 text-blue-500" />
            <span>Compress Files</span>
          </h1>
          <p className="text-muted-foreground">Configure compression settings</p>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compression Options */}
      <Card>
        <CardHeader>
          <CardTitle>Compression</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Click the button below to compress your files using PDF compression (pdf-lib for PDFs).</p>
        </CardContent>
      </Card>

      {/* Compression Progress */}
      {isCompressing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compressing files...</span>
                <span>{Math.round(compressionProgress)}%</span>
              </div>
              <Progress value={compressionProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compress Button */}
      <Button 
        onClick={compressFiles}
        disabled={uploadedFiles.length === 0 || isCompressing}
        className="w-full"
        size="lg"
      >
        {isCompressing ? "Compressing..." : "Compress Files"}
      </Button>

      {/* Compressed Files Results */}
      {compressedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compression Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {compressedFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{file.name}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Original: {formatFileSize(file.originalSize)}</p>
                        <p>Compressed: {formatFileSize(file.compressedSize)}</p>
                        <p className="text-green-600">Reduced by {file.compressionRatio}%</p>
                      </div>
                    </div>
                    <Button onClick={() => downloadCompressed(file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompressFiles;
