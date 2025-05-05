
import { useState } from "react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  Database,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface DataUploaderProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  uploadStatus: null | 'success' | 'error';
  setUploadStatus: (status: null | 'success' | 'error') => void;
}

const DataUploader = ({ 
  selectedFile, 
  setSelectedFile, 
  uploadStatus, 
  setUploadStatus 
}: DataUploaderProps) => {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };
  
  const handleUpload = () => {
    // Simulate upload process
    setUploadStatus('success');
    
    // In a real implementation, you would upload the file to your server here
    setTimeout(() => {
      setSelectedFile(null);
    }, 3000);
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
      default:
        return <Database className="h-8 w-8 text-blue-600" />;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center">
          {selectedFile ? (
            <div className="flex flex-col items-center space-y-4">
              {uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-green-600 font-medium">File caricato con successo!</p>
                </>
              ) : uploadStatus === 'error' ? (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500" />
                  <p className="text-red-600 font-medium">Errore durante il caricamento</p>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    {getFileIcon(selectedFile.name)}
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleUpload} 
                    className="bg-brand-water hover:bg-brand-water/90"
                  >
                    Carica File
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">Trascina il file qui</p>
              <p className="text-sm text-gray-500 mb-4">Supporta file CSV, XLSX, JSON</p>
              <div className="flex space-x-2">
                <Input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button 
                    variant="outline" 
                    className="cursor-pointer"
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
