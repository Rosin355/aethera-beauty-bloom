
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ManualDataInput = () => {
  const [manualInputData, setManualInputData] = useState("");
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Process manual input data
    console.log("Manual data submitted:", manualInputData);
    setManualInputData("");
  };

  return (
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
  );
};

export default ManualDataInput;
