ohit\OneDrive\Desktop\docforge-flow-ui-main\src\components\ExtractText.tsx
import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ArrowLeft, Download, Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractTextProps {
  onBack: () => void;
}

export const ExtractText = ({ onBack }: ExtractTextProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const { toast } = useToast();

  const acceptedTypes = ['.pdf', '.txt'];
  const maxFileSize = 25 * 1024 * 1024; // 25MB

  const validateFile = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(extension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF or TXT files only.",
        variant: "destructive",
      });
      return false;
    }
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 25MB.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (validateFile(file)) {
      setUploadedFile(file);
      setExtractedText('');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            reject(new Error("Failed to read file"));
            return;
          }

          // For PDF files, use PDF.js to extract text
          if (file.type === 'application/pdf') {
            const pdfData = new Uint8Array(event.target.result as ArrayBuffer);
            
            // Import PDF.js dynamically
            const pdfjsLib = await import('pdfjs-dist/build/pdf');
            const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
            
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
            
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            
            let extractedText = '';
            const numPages = pdf.numPages;
            
            // Extract text from each page
            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              
              extractedText += pageText + '\n\n';
              
              // Update progress
              setProgress(Math.floor((i / numPages) * 100));
            }
            
            resolve(extractedText);
          } 
          // For text files, just read the text
          else if (file.type === 'text/plain') {
            const text = event.target.result as string;
            resolve(text);
          } 
          else {
            reject(new Error(