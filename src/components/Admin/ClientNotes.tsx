
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  PlusCircle 
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { it } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Note {
  id: string;
  text: string;
  date: Date;
  createdBy: string;
  category: string;
}

interface ClientNotesProps {
  clientId: string | undefined;
}

const ClientNotes = ({ clientId }: ClientNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      text: "Cliente interessato ad ampliare l'offerta con trattamenti viso anti-age. Pianificare un incontro per presentare la linea di prodotti premium.",
      date: new Date(2023, 8, 15),
      createdBy: "Marco Rossi",
      category: "opportunità"
    },
    {
      id: "2",
      text: "Ha riscontrato difficoltà nell'utilizzo del calendario appuntamenti. È stato offerto un supporto remoto per aiutarlo a configurare correttamente il sistema.",
      date: new Date(2023, 8, 10),
      createdBy: "Laura Bianchi",
      category: "supporto"
    },
    {
      id: "3",
      text: "Durante l'ultima chiamata il cliente ha menzionato problemi di liquidità. Valutare la possibilità di offrire condizioni di pagamento più flessibili.",
      date: new Date(2023, 7, 28),
      createdBy: "Marco Rossi",
      category: "attenzione"
    }
  ]);
  
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    text: "",
    date: new Date(),
    category: "generale"
  });
  
  const categories = [
    { value: "generale", label: "Generale" },
    { value: "opportunità", label: "Opportunità" },
    { value: "supporto", label: "Supporto" },
    { value: "attenzione", label: "Attenzione" },
    { value: "followup", label: "Follow-up" }
  ];
  
  const getCategoryBadge = (category: string) => {
    switch(category) {
      case "opportunità":
        return <Badge className="bg-green-500">Opportunità</Badge>;
      case "supporto":
        return <Badge className="bg-brand-water">Supporto</Badge>;
      case "attenzione":
        return <Badge className="bg-red-500">Attenzione</Badge>;
      case "followup":
        return <Badge className="bg-amber-500">Follow-up</Badge>;
      default:
        return <Badge variant="outline">Generale</Badge>;
    }
  };
  
  const handleAddNote = () => {
    if (!newNote.text.trim()) return;
    
    const note: Note = {
      id: Math.random().toString(36).substring(7),
      text: newNote.text,
      date: newNote.date,
      createdBy: "Admin",
      category: newNote.category
    };
    
    setNotes([note, ...notes]);
    setIsAddingNote(false);
    setNewNote({
      text: "",
      date: new Date(),
      category: "generale"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Note Interne</CardTitle>
          
          <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
            <DialogTrigger asChild>
              <Button className="bg-brand-fire hover:bg-brand-fire/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Aggiungi Nuova Nota</DialogTitle>
                <DialogDescription>
                  Inserisci i dettagli della nota interna per questo cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="text">Testo della Nota</Label>
                  <Textarea
                    id="text"
                    value={newNote.text}
                    onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
                    placeholder="Inserisci il testo della nota..."
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newNote.category}
                      onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newNote.date, "PPP", { locale: it })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newNote.date}
                          onSelect={(date) => date && setNewNote({ ...newNote, date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                  Annulla
                </Button>
                <Button onClick={handleAddNote}>
                  Salva Nota
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {notes.length > 0 ? (
            <div className="space-y-6">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">
                        {format(new Date(note.date), "dd MMM yyyy", { locale: it })}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{note.createdBy}</span>
                    </div>
                    {getCategoryBadge(note.category)}
                  </div>
                  <p className="text-gray-800">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nessuna nota trovata per questo cliente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientNotes;
