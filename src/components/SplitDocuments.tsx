import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createSplitDocuments } from "@/utils/downloadUtils";
import { PDFDocument } from 'pdf-lib';

const acceptedTypes = ['.pdf'];
const maxFileSize = 50 * 1024 * 1024; // 50MB

const SplitDocuments = ({ onBack }: { onBack: () => void }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [splitFiles, setSplitFiles] = useState<Array<{ name: string; content: Blob }>>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [splitRange, setSplitRange] = useState<string>("");
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!acceptedTypes.includes(extension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `${file.name} exceeds the 50MB limit.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Load PDF to get total pages
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPageCount();
      setTotalPages(pages);
      setUploadedFile(file);
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error loading PDF",
        description: "Could not load the PDF file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const parsePageRanges = (rangeStr: string): number[] => {
    const ranges = rangeStr.split(',').map(r => r.trim());
    const pages: number[] = [];
    
    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start > 0 && end <= totalPages && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        }
      } else {
        const page = parseInt(range);
        if (!isNaN(page) && page > 0 && page <= totalPages) {
          pages.push(page);
        }
      }
    }
    
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!uploadedFile) return;

    const pageNumbers = parsePageRanges(splitRange);
    if (pageNumbers.length === 0) {
      toast({
        title: "Invalid page range",
        description: "Please enter valid page numbers or ranges (e.g., '1-3,5,7-9').",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const baseName = uploadedFile.name.replace('.pdf', '');
      const splitResults = await createSplitDocuments(
        uploadedFile,
        pageNumbers,
        `${baseName}_part{n}`
      );

      setSplitFiles(splitResults);
      toast({
        title: "Split complete",
        description: "Your PDF has been split successfully.",
      });
    } catch (error) {
      console.error('Error during split:', error);
      toast({
        title: "Split failed",
        description: "An error occurred while splitting the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadFile = (file: { name: string; content: Blob }) => {
    const url = URL.createObjectURL(file.content);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
            <span>Split PDF Files</span>
          </h1>
          <p className="text-muted-foreground">Split PDF files into multiple documents</p>
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

      {/* Upload Area */}
      {!uploadedFile && (
        <Card className="border-2 border-dashed border-border/50">
          <div className="p-8">
            <div
              className="relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/5"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Drop your file here, or click to browse</h3>
                  <p className="text-muted-foreground">
                    Single PDF file (max 50MB)
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('split-file-input')?.click()}
                  className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                >
                  Choose File
                </Button>
                <input
                  id="split-file-input"
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  aria-label="Upload PDF file to split"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Split Options */}
      {uploadedFile && (
        <Card className="border border-border/50">
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.size)} • {totalPages} pages
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setUploadedFile(null);
                    setTotalPages(0);
                    setSplitRange("");
                  }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  Remove
                </Button>
              </div>

              {/* Split Range Input */}
              <div className="space-y-2">
                <Label htmlFor="split-range">Page Range</Label>
                <Input
                  id="split-range"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder={`Enter page numbers or ranges (e.g., 1-3,5,7-9) (1-${totalPages})`}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Enter page numbers or ranges separated by commas. For example: 1-3,5,7-9
                </p>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Splitting document...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleSplit}
                  disabled={isProcessing || !splitRange.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Splitting..." : "Start Split"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Split Files Results */}
      {splitFiles.length > 0 && (
        <Card className="border border-border/50">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Split Files ({splitFiles.length})</h3>
            <div className="space-y-3">
              {splitFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.content.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadFile(file)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export { SplitDocuments };