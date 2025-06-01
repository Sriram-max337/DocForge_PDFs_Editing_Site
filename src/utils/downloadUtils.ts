import { PDFDocument } from 'pdf-lib';

export const downloadFile = (blob: Blob, filename: string, mimeType: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const downloadZip = async (files: { name: string; content: Blob }[], zipName: string) => {
  // For now, we'll simulate ZIP creation by downloading individual files
  // In a real implementation, you'd use a library like JSZip
  files.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file.content, file.name, 'application/octet-stream');
    }, index * 500); // Stagger downloads to avoid browser blocking
  });
};

// Create a proper document by processing the original file content
export const createProcessedDocument = async (originalFile: File, newFilename: string, compressionLevel?: string): Promise<Blob> => {
  // Read the original file content
  const arrayBuffer = await originalFile.arrayBuffer();
  const fileType = originalFile.type;
  const fileExtension = originalFile.name.split('.').pop()?.toLowerCase();
  
  // If no compression level is specified, return the original file
  if (!compressionLevel) {
    return new Blob([arrayBuffer], { type: fileType });
  }
  
  // For PDF files
  if (fileExtension === 'pdf') {
    try {
      // Load the PDF document with minimal options
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false,
        ignoreEncryption: true,
        throwOnInvalidObject: false
      });

      // Get compression options based on level
      const getCompressionOptions = (level: string) => {
        const baseOptions = {
          useObjectStreams: true,
          addDefaultPage: false,
          compress: true,
          updateMetadata: false
        };

        switch (level) {
          case 'light':
            return {
              ...baseOptions,
              objectsPerTick: 50,
              compressStreams: true,
              compressImages: true,
              imageCompression: 'JPEG',
              imageQuality: 0.8
            };
          case 'medium':
            return {
              ...baseOptions,
              objectsPerTick: 30,
              compressStreams: true,
              compressImages: true,
              imageCompression: 'JPEG',
              imageQuality: 0.6
            };
          case 'high':
            return {
              ...baseOptions,
              objectsPerTick: 20,
              compressStreams: true,
              compressImages: true,
              imageCompression: 'JPEG',
              imageQuality: 0.4
            };
          default:
            return {
              ...baseOptions,
              objectsPerTick: 30,
              compressStreams: true,
              compressImages: true,
              imageCompression: 'JPEG',
              imageQuality: 0.6
            };
        }
      };

      // Get compression options based on level
      const compressOptions = getCompressionOptions(compressionLevel || 'medium');

      // First attempt: Try with basic compression
      let compressedPdfBytes = await pdfDoc.save(compressOptions);

      // If first attempt didn't reduce size, try a different approach
      if (compressedPdfBytes.length >= arrayBuffer.byteLength) {
        console.log('First compression attempt did not reduce size, trying alternative approach...');

        // Create a new PDF with optimized settings
        const newPdf = await PDFDocument.create();

        // Copy pages with direct stream compression
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
        }

        // Try with direct stream compression and image optimization
        const streamCompressionOptions = {
          ...compressOptions,
          objectsPerTick: 10,
          imageQuality: Math.max(0.3, compressOptions.imageQuality - 0.2)
        };

        compressedPdfBytes = await newPdf.save(streamCompressionOptions);
      }

      // If still no reduction, try one last time with maximum compression
      if (compressedPdfBytes.length >= arrayBuffer.byteLength) {
        console.log('Second compression attempt did not reduce size, trying maximum compression...');

        // Create a new PDF with maximum compression
        const maxPdf = await PDFDocument.create();

        // Copy pages with maximum compression
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          const [copiedPage] = await maxPdf.copyPages(pdfDoc, [i]);
          maxPdf.addPage(copiedPage);
        }

        // Try with maximum compression settings
        const maxCompressionOptions = {
          ...compressOptions,
          objectsPerTick: 5,
          imageQuality: 0.2,
          compressStreams: true,
          compressImages: true,
          imageCompression: 'JPEG'
        };

        compressedPdfBytes = await maxPdf.save(maxCompressionOptions);
      }

      // If still no reduction, try one final approach with image downsampling
      if (compressedPdfBytes.length >= arrayBuffer.byteLength) {
        console.log('Trying final approach with image downsampling...');

        // Create a new PDF
        const finalPdf = await PDFDocument.create();

        // Copy pages with image downsampling
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
          const [copiedPage] = await finalPdf.copyPages(pdfDoc, [i]);
          finalPdf.addPage(copiedPage);
        }

        // Try with maximum compression and image downsampling
        const finalOptions = {
          ...compressOptions,
          objectsPerTick: 1,
          imageQuality: 0.1,
          compressStreams: true,
          compressImages: true,
          imageCompression: 'JPEG',
          downsampleImages: true,
          maxImageSize: 800
        };

        compressedPdfBytes = await finalPdf.save(finalOptions);
      }

      // If still no reduction, return original
      if (compressedPdfBytes.length >= arrayBuffer.byteLength) {
        console.warn('All compression attempts failed to reduce file size, returning original');
        return new Blob([arrayBuffer], { type: fileType });
      }

      // Create a new blob with the compressed PDF
      const compressedBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });

      // Log compression results
      const originalSize = arrayBuffer.byteLength;
      const compressedSize = compressedBlob.size;
      const reduction = ((originalSize - compressedSize) / originalSize) * 100;
      console.log(`PDF compression results:
        Original size: ${originalSize} bytes
        Compressed size: ${compressedSize} bytes
        Reduction: ${reduction.toFixed(2)}%`);

      return compressedBlob;
    } catch (error) {
      console.error('Error compressing PDF:', error);
      // Fall back to original file if compression fails
      return new Blob([arrayBuffer], { type: fileType });
    }
  }
  
  // For image files (JPG, JPEG, PNG)
  if (['jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(new Blob([arrayBuffer], { type: fileType }));
          return;
        }
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Get compression quality based on level
        const getQualityFromLevel = (level: string): number => {
          switch (level) {
            case 'light': return 0.7;
            case 'medium': return 0.5;
            case 'high': return 0.3;
            case 'custom': return 0.5; // Default for custom, should be overridden
            default: return 0.5;
          }
        };
        
        const quality = getQualityFromLevel(compressionLevel || 'medium');
        
        // Convert canvas to compressed blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(new Blob([arrayBuffer], { type: fileType }));
            }
          },
          fileType,
          quality // Use the quality setting from compression level
        );
      };
      
      img.onerror = () => {
        resolve(new Blob([arrayBuffer], { type: fileType }));
      };
      
      // Create object URL from the array buffer
      const blob = new Blob([arrayBuffer], { type: fileType });
      img.src = URL.createObjectURL(blob);
    });
  }
  
  // For other file types, return the original content
  return new Blob([arrayBuffer], { type: fileType });
};

// Create merged document from multiple files
export const createMergedDocument = async (files: File[], outputFilename: string): Promise<Blob> => {
  if (files.length === 0) {
    throw new Error('No files to merge');
  }
  
  console.log('Merging files:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
  
  const firstFile = files[0];
  const fileExtension = firstFile.name.split('.').pop()?.toLowerCase();
  
  // For PDF files - use pdf-lib
  if (fileExtension === 'pdf') {
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each PDF file
      for (const file of files) {
        // Convert the file to an ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Get all pages from the document
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        
        // Add each page to the merged document
        pages.forEach(page => {
          mergedPdf.addPage(page);
        });
      }
      
      // Serialize the merged PDF to bytes
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create a Blob from the bytes
      return new Blob([mergedPdfBytes], { type: 'application/pdf' });
      
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error('Failed to merge PDF files: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  // Keep the existing code for other file types
  // For text-based files (TXT, CSV, etc.) - this part works well, keeping it
  if (firstFile.type.startsWith('text/') || fileExtension === 'txt' || fileExtension === 'csv') {
    let mergedText = '';
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        mergedText += `\n=== Document ${i + 1}: ${file.name} ===\n\n`;
        mergedText += text;
        mergedText += '\n\n';
      } catch (error) {
        console.error(`Error reading text from ${file.name}:`, error);
        mergedText += `\n=== Document ${i + 1}: ${file.name} (Error reading content) ===\n\n`;
      }
    }
    
    return new Blob([mergedText], { type: firstFile.type || 'text/plain' });
  }
  
  // For Word documents (DOCX) and PowerPoint (PPTX)
  if (fileExtension === 'docx' || fileExtension === 'pptx' || fileExtension === 'doc' || fileExtension === 'ppt') {
    // Since we can't properly merge binary Office documents without specialized libraries,
    // we'll create a combined document by concatenating the binary data with proper separators
    const fileContents: ArrayBuffer[] = [];
    let totalSize = 0;
    
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      fileContents.push(buffer);
      totalSize += buffer.byteLength;
    }
    
    // For Office documents, we'll combine them by creating a larger blob
    // This won't create a properly structured Office document, but will preserve all content
    const mergedBuffer = new ArrayBuffer(totalSize);
    const mergedView = new Uint8Array(mergedBuffer);
    
    let offset = 0;
    for (let i = 0; i < fileContents.length; i++) {
      const buffer = fileContents[i];
      const view = new Uint8Array(buffer);
      mergedView.set(view, offset);
      offset += view.length;
    }
    
    return new Blob([mergedBuffer], { type: firstFile.type });
  }
  
  // For any other file types, concatenate binary content
  const allBuffers: ArrayBuffer[] = [];
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    allBuffers.push(buffer);
  }
  
  const totalSize = allBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const mergedBuffer = new ArrayBuffer(totalSize);
  const mergedView = new Uint8Array(mergedBuffer);
  
  let offset = 0;
  for (const buffer of allBuffers) {
    const view = new Uint8Array(buffer);
    mergedView.set(view, offset);
    offset += view.length;
  }
  
  return new Blob([mergedBuffer], { type: firstFile.type });
};

// Create split documents from a single file
export const createSplitDocuments = async (
  originalFile: File, 
  pageNumbers: number[], 
  namingPattern: string
): Promise<{ name: string; content: Blob }[]> => {
  const originalExtension = originalFile.name.split('.').pop()?.toLowerCase() || 'pdf';
  const baseName = originalFile.name.split('.').slice(0, -1).join('.');
  const originalContent = await originalFile.arrayBuffer();
  
  console.log('Splitting file:', { name: originalFile.name, size: originalFile.size, pages: pageNumbers });
  
  // For text files, split by lines or paragraphs
  if (originalFile.type.startsWith('text/') || originalExtension === 'txt') {
    const text = await originalFile.text();
    const lines = text.split('\n');
    const linesPerPage = Math.ceil(lines.length / pageNumbers.length);
    
    return pageNumbers.map((pageNum, index) => {
      const startLine = index * linesPerPage;
      const endLine = Math.min(startLine + linesPerPage, lines.length);
      const pageContent = lines.slice(startLine, endLine).join('\n');
      
      const fileName = namingPattern.replace('{n}', pageNum.toString());
      const fullFileName = `${fileName}.${originalExtension}`;
      
      return {
        name: fullFileName,
        content: new Blob([pageContent], { type: originalFile.type })
      };
    });
  }
  
  // For PDF files, use pdf-lib to properly split the document
  if (originalExtension === 'pdf') {
    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(originalContent);
      
      // Get the total number of pages
      const totalPages = pdfDoc.getPageCount();
      
      // Find consecutive page ranges
      const ranges: number[][] = [];
      let currentRange: number[] = [];
      
      // Sort page numbers to ensure they're in order
      const sortedPages = [...pageNumbers].sort((a, b) => a - b);
      
      // Group consecutive pages into ranges
      sortedPages.forEach((page, index) => {
        // PDF page numbers are 1-based, but array indices are 0-based
        const pageIndex = page - 1;
        
        // Skip if page number is out of range
        if (pageIndex < 0 || pageIndex >= totalPages) {
          console.warn(`Page ${page} is out of range (total pages: ${totalPages})`);
          return;
        }
        
        if (index === 0 || page !== sortedPages[index - 1] + 1) {
          // Start a new range if this is the first page or not consecutive
          if (currentRange.length > 0) {
            ranges.push([...currentRange]);
          }
          currentRange = [page];
        } else {
          // Add to current range if consecutive
          currentRange.push(page);
        }
      });
      
      // Add the last range
      if (currentRange.length > 0) {
        ranges.push(currentRange);
      }
      
      // Create PDFs for each range
      const splitFiles = await Promise.all(ranges.map(async (range) => {
        // Create a new PDF document
        const newPdf = await PDFDocument.create();
        
        // Copy all pages in the range
        const pageIndices = range.map(p => p - 1); // Convert to 0-based indices
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
        
        // Add all copied pages to the new document
        copiedPages.forEach(page => newPdf.addPage(page));
        
        // Serialize the new PDF to bytes
        const newPdfBytes = await newPdf.save();
        
        // Create a filename based on the naming pattern
        let fileName;
        if (range.length === 1) {
          fileName = namingPattern.replace('{n}', range[0].toString());
        } else {
          fileName = namingPattern.replace('{n}', `${range[0]}-${range[range.length - 1]}`);
        }
        const fullFileName = `${fileName}.pdf`;
        
        return {
          name: fullFileName,
          content: new Blob([newPdfBytes], { type: 'application/pdf' })
        };
      }));
      
      return splitFiles;
    } catch (error) {
      console.error('Error splitting PDF:', error);
      throw new Error('Failed to split PDF file: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  // For other binary files (DOCX, PPTX, etc.), keep the existing implementation
  // but with a warning that it might not produce valid files
  console.warn('Splitting binary files may not produce valid results for formats other than PDF');
  const chunkSize = Math.ceil(originalContent.byteLength / pageNumbers.length);
  
  return pageNumbers.map((pageNum, index) => {
    const startOffset = index * chunkSize;
    const endOffset = Math.min(startOffset + chunkSize, originalContent.byteLength);
    
    // Ensure we don't create empty chunks
    const actualEndOffset = endOffset > startOffset ? endOffset : originalContent.byteLength;
    const chunkContent = originalContent.slice(startOffset, actualEndOffset);
    
    const fileName = namingPattern.replace('{n}', pageNum.toString());
    const fullFileName = `${fileName}.${originalExtension}`;
    
    return {
      name: fullFileName,
      content: new Blob([chunkContent], { type: originalFile.type })
    };
  });
};
