
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Upload, 
  Video, 
  BookOpen,
  FileText,
  Edit,
  Trash,
  Search
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const dummyContent = [
  {
    id: "1",
    title: "Tecniche Avanzate di Massaggio",
    type: "video",
    category: "Massaggio",
    visibility: "all",
    uploadDate: "10/06/2023",
    duration: "45:30"
  },
  {
    id: "2",
    title: "Trattamenti Viso Anti-Age",
    type: "course",
    category: "Skincare",
    visibility: "premium",
    uploadDate: "22/07/2023",
    duration: "3:15:00"
  },
  {
    id: "3",
    title: "Guida alla Gestione del Cliente",
    type: "document",
    category: "Business",
    visibility: "all",
    uploadDate: "15/05/2023",
    duration: "N/A"
  },
  {
    id: "4",
    title: "Webinar: Nuovi Trend Beauty 2024",
    type: "webinar",
    category: "Trends",
    visibility: "premium",
    uploadDate: "05/09/2023",
    duration: "1:20:45"
  },
  {
    id: "5",
    title: "Tecniche di Marketing sui Social",
    type: "course",
    category: "Marketing",
    visibility: "all",
    uploadDate: "18/08/2023",
    duration: "2:30:00"
  }
];

const ContentManagement = () => {
  const [content, setContent] = useState(dummyContent);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [newContent, setNewContent] = useState({
    title: "",
    type: "video",
    category: "",
    visibility: "all"
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || item.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "video":
        return <Video className="h-5 w-5 text-brand-fire" />;
      case "course":
        return <BookOpen className="h-5 w-5 text-brand-water" />;
      case "document":
        return <FileText className="h-5 w-5 text-brand-earth" />;
      case "webinar":
        return <Video className="h-5 w-5 text-brand-air" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch(visibility) {
      case "all":
        return <Badge className="bg-green-500">Tutti</Badge>;
      case "premium":
        return <Badge className="bg-brand-fire">Premium</Badge>;
      case "specific":
        return <Badge className="bg-brand-water">Specifico</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  const handleAddContent = () => {
    if (!newContent.title || !newContent.category) {
      return;
    }
    
    const content = {
      id: Math.random().toString(36).substring(7),
      title: newContent.title,
      type: newContent.type,
      category: newContent.category,
      visibility: newContent.visibility,
      uploadDate: new Date().toLocaleDateString('it-IT'),
      duration: newContent.type === "document" ? "N/A" : "00:00"
    };
    
    setContent(prev => [...prev, content]);
    setIsAddingContent(false);
    setNewContent({
      title: "",
      type: "video",
      category: "",
      visibility: "all"
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Gestione Contenuti</CardTitle>
          <Dialog open={isAddingContent} onOpenChange={setIsAddingContent}>
            <DialogTrigger asChild>
              <Button className="bg-brand-fire hover:bg-brand-fire/90">
                <Plus className="mr-2 h-4 w-4" /> Aggiungi Contenuto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Aggiungi Nuovo Contenuto</DialogTitle>
                <DialogDescription>
                  Inserisci i dettagli del contenuto da aggiungere alla piattaforma
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titolo</Label>
                  <Input
                    id="title"
                    value={newContent.title}
                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    placeholder="Inserisci il titolo del contenuto"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Tipo di Contenuto</Label>
                  <RadioGroup 
                    defaultValue="video" 
                    value={newContent.type}
                    onValueChange={(value) => setNewContent({ ...newContent, type: value })}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="video" id="video" />
                      <Label htmlFor="video">Video</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="course" id="course" />
                      <Label htmlFor="course">Corso</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="document" id="document" />
                      <Label htmlFor="document">Documento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="webinar" id="webinar" />
                      <Label htmlFor="webinar">Webinar</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={newContent.category}
                    onChange={(e) => setNewContent({ ...newContent, category: e.target.value })}
                    placeholder="Es. Skincare, Massaggio, Business"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="visibility">Visibilità</Label>
                  <Select 
                    value={newContent.visibility}
                    onValueChange={(value) => setNewContent({ ...newContent, visibility: value })}
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue placeholder="Seleziona visibilità" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli utenti</SelectItem>
                      <SelectItem value="premium">Solo Premium</SelectItem>
                      <SelectItem value="specific">Utenti Specifici</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Carica File</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Trascina il file qui o</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Seleziona File
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingContent(false)}>Annulla</Button>
                <Button onClick={handleAddContent}>Salva Contenuto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="all">Tutti</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="course">Corsi</TabsTrigger>
                <TabsTrigger value="document">Documenti</TabsTrigger>
                <TabsTrigger value="webinar">Webinar</TabsTrigger>
              </TabsList>
              
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Cerca contenuti..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            
            <TabsContent value={activeTab} className="mt-0">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Visibilità</TableHead>
                      <TableHead>Data Upload</TableHead>
                      <TableHead>Durata</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.length > 0 ? (
                      filteredContent.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getTypeIcon(item.type)}
                              <span className="ml-2 capitalize">{item.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{getVisibilityBadge(item.visibility)}</TableCell>
                          <TableCell>{item.uploadDate}</TableCell>
                          <TableCell>{item.duration}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nessun contenuto trovato
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentManagement;
