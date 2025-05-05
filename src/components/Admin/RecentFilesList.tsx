
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, FileJson } from "lucide-react";

const RecentFilesList = () => {
  return (
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
  );
};

export default RecentFilesList;
