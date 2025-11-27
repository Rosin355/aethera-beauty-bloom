import { useState } from "react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DataUploaderProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  uploadStatus: null | 'success' | 'error';
  setUploadStatus: (status: null | 'success' | 'error') => void;
  onUploadComplete?: () => void;
}

// File types that need parsing via edge function
const DOCUMENT_EXTENSIONS = ['.odt', '.docx', '.doc', '.pdf'];
const SUPPORTED_EXTENSIONS = '.csv,.xlsx,.xls,.json,.txt,.odt,.docx,.doc,.pdf';

const DataUploader = ({ 
  selectedFile, 
  setSelectedFile, 
  uploadStatus, 
  setUploadStatus,
  onUploadComplete
}: DataUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadStatus(null);
      setUploadProgress('');
    }
  };

  const isDocumentFile = (fileName: string): boolean => {
    const ext = fileName.toLowerCase();
    return DOCUMENT_EXTENSIONS.some(docExt => ext.endsWith(docExt));
  };

  const parseDocumentFile = async (file: File): Promise<string> => {
    setUploadProgress('Estrazione testo dal documento...');
    
    const formData = new FormData();
    formData.append('file', file);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(
      `https://jybewogjncaoscrnlqum.supabase.co/functions/v1/parse-document`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore nel parsing del documento');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Parsing fallito');
    }

    return result.content;
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress('Preparazione...');
    
    try {
      let fileContent: string;
      
      // Check if file needs document parsing
      if (isDocumentFile(selectedFile.name)) {
        fileContent = await parseDocumentFile(selectedFile);
      } else {
        // Read as text for CSV, JSON, TXT, etc.
        setUploadProgress('Lettura file...');
        fileContent = await readFileContent(selectedFile);
      }
      
      // Upload file to storage
      setUploadProgress('Caricamento su storage...');
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('ai-training-data')
        .upload(fileName, selectedFile);

      if (storageError) {
        console.error('Storage error:', storageError);
        // Continue without file URL if storage fails
      }

      // Get public URL if upload succeeded
      let fileUrl = null;
      if (storageData) {
        const { data: urlData } = supabase.storage
          .from('ai-training-data')
          .getPublicUrl(fileName);
        fileUrl = urlData?.publicUrl;
      }

      // Save record to database
      setUploadProgress('Salvataggio nel database...');
      const { error: dbError } = await supabase
        .from('ai_training_data')
        .insert({
          title: selectedFile.name,
          description: `File caricato: ${selectedFile.name}`,
          content: fileContent,
          data_type: 'file',
          file_name: selectedFile.name,
          file_url: fileUrl,
          file_size: selectedFile.size,
          processed: false
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      setUploadStatus('success');
      toast.success('File caricato e processato con successo!');
      
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus(null);
        setUploadProgress('');
        onUploadComplete?.();
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast.error(error instanceof Error ? error.message : 'Errore durante il caricamento');
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      case 'json':
        return <FileJson className="h-8 w-8 text-amber-600" />;
      case 'odt':
      case 'doc':
      case 'docx':
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      default:
        return <Database className="h-8 w-8 text-blue-600" />;
    }
  };

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardContent className="pt-6">
        <div className="border-2 border-dashed border-neutral-700 rounded-md p-8 flex flex-col items-center justify-center">
          {selectedFile ? (
            <div className="flex flex-col items-center space-y-4">
              {uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-green-500 font-medium">File caricato con successo!</p>
                </>
              ) : uploadStatus === 'error' ? (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <p className="text-red-500 font-medium">Errore durante il caricamento</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadStatus(null);
                      setUploadProgress('');
                    }}
                    className="border-neutral-700"
                  >
                    Riprova
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    {getFileIcon(selectedFile.name)}
                    <div>
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                      {isDocumentFile(selectedFile.name) && (
                        <p className="text-xs text-brand-water mt-1">
                          Il testo verrà estratto automaticamente
                        </p>
                      )}
                    </div>
                  </div>
                  {uploadProgress && (
                    <p className="text-sm text-muted-foreground">{uploadProgress}</p>
                  )}
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadProgress('');
                      }}
                      disabled={isUploading}
                      className="border-neutral-700"
                    >
                      Annulla
                    </Button>
                    <Button 
                      onClick={handleUpload} 
                      className="bg-brand-water hover:bg-brand-water/90"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Elaborazione...
                        </>
                      ) : (
                        'Carica File'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2 text-foreground">Trascina il file qui</p>
              <p className="text-sm text-muted-foreground mb-2">
                Supporta: CSV, XLSX, JSON, TXT
              </p>
              <p className="text-sm text-brand-water mb-4">
                + ODT, DOCX, DOC, PDF (estrazione testo automatica)
              </p>
              <div className="flex space-x-2">
                <Input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept={SUPPORTED_EXTENSIONS}
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button 
                    variant="outline" 
                    className="cursor-pointer border-neutral-700"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Seleziona File
                  </Button>
                </label>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataUploader;
