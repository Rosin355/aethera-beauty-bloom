
import { useEffect, useState } from "react";
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
import { createClientNote, fetchClientNotes, type ClientNoteView } from "@/lib/api/adminManagement";
import { toast } from "sonner";

interface ClientNotesProps {
  clientId: string | undefined;
}

const ClientNotes = ({ clientId }: ClientNotesProps) => {
  const [notes, setNotes] = useState<ClientNoteView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  const handleAddNote = async () => {
    if (!newNote.text.trim()) return;

    if (!clientId) return;
    try {
      const saved = await createClientNote({
        client_user_id: clientId,
        note_text: newNote.text,
        note_date: newNote.date.toISOString().slice(0, 10),
        category: newNote.category,
      });
      setNotes((prev) => [saved, ...prev]);
      setIsAddingNote(false);
      setNewNote({
        text: "",
        date: new Date(),
        category: "generale"
      });
      toast.success("Nota salvata");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Impossibile salvare la nota");
    }
  };

  useEffect(() => {
    const loadNotes = async () => {
      if (!clientId) return;
      try {
        setIsLoading(true);
        const data = await fetchClientNotes(clientId);
        setNotes(data);
      } catch (error) {
        console.error("Error loading client notes:", error);
        toast.error("Errore nel caricamento note");
      } finally {
        setIsLoading(false);
      }
    };
    loadNotes();
  }, [clientId]);

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
          {!isLoading && notes.length > 0 ? (
            <div className="space-y-6">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">
                        {format(new Date(note.note_date), "dd MMM yyyy", { locale: it })}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{note.created_by_name || "Admin"}</span>
                    </div>
                    {getCategoryBadge(note.category)}
                  </div>
                  <p className="text-gray-800">{note.note_text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {isLoading ? "Caricamento note..." : "Nessuna nota trovata per questo cliente."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientNotes;
