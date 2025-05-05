
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Database,
  FileSpreadsheet,
  FileJson,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const AIDataTools = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<null | 'success' | 'error'>(null);
  const [manualInputData, setManualInputData] = useState("");
  
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
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Process manual input data
    console.log("Manual data submitted:", manualInputData);
    setManualInputData("");
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Strumenti Dati AI</CardTitle>
          <CardDescription>
            Carica o inserisci manualmente dati per addestrare e migliorare l'assistente AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload">Carica File</TabsTrigger>
              <TabsTrigger value="manual">Inserimento Manuale</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
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
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">File Recenti</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center">
                          <FileSpreadsheet className="h-5 w-5 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium">dati_clienti_q3.csv</p>
                            <p className="text-xs text-gray-500">Caricato il 12/09/2023</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500">Elaborato</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded-md">
                        <div className="flex items-center">
                          <FileJson className="h-5 w-5 text-amber-600 mr-3" />
                          <div>
                            <p className="font-medium">segmentazione_market.json</p>
                            <p className="text-xs text-gray-500">Caricato il 05/09/2023</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500">Elaborato</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-6">
              <form onSubmit={handleManualSubmit}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Inserimento Dati Strutturati</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Inserisci dati in formato strutturato per addestrare l'assistente AI
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="data-title" className="font-medium text-sm">
                        Titolo Dataset
                      </label>
                      <Input 
                        id="data-title" 
                        placeholder="Es. Performance Trattamenti Q3 2023" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="data-description" className="font-medium text-sm">
                        Descrizione
                      </label>
                      <Input 
                        id="data-description" 
                        placeholder="Breve descrizione dei dati" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="data-content" className="font-medium text-sm">
                        Contenuto
                      </label>
                      <Textarea 
                        id="data-content" 
                        placeholder="Inserisci dati in formato JSON, CSV o testo strutturato"
                        value={manualInputData}
                        onChange={(e) => setManualInputData(e.target.value)}
                        className="min-h-[200px] font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Suggerimento: Per JSON, usa il formato {"{"}"chiave": "valore"{"}"}
                      </p>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline">Annulla</Button>
                      <Button 
                        type="submit" 
                        className="bg-brand-fire hover:bg-brand-fire/90"
                      >
                        Salva Dati
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDataTools;
