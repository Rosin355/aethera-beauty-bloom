
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataUploader from "./DataUploader";
import RecentFilesList from "./RecentFilesList";
import ManualDataInput from "./ManualDataInput";

const AIDataTools = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<null | 'success' | 'error'>(null);
  
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
              <DataUploader 
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
              />
              <RecentFilesList />
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-6">
              <ManualDataInput />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDataTools;
