
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Clock, Euro, List, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createBusinessService,
  deleteBusinessService,
  fetchBusinessServices,
  updateBusinessService,
  type BusinessService,
} from "@/lib/api/management";
import { useCenter } from "@/contexts/CenterContext";
import { fetchCategories, fetchCenterDurations, formatDuration } from "@/lib/api/taxonomies";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const emptyService = { name: "", category: "", duration_minutes: 60, price: 0, description: "" };

const ServiceCatalog = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newService, setNewService] = useState(emptyService);
  
  const [services, setServices] = useState<BusinessService[]>([]);

  const { centerId, role } = useCenter();
  const isOwner = role === "owner";

  const { data: categoryRows = [] } = useQuery({
    queryKey: ["service-categories", centerId],
    queryFn: () => fetchCategories("service", centerId!, { activeOnly: true }),
    enabled: !!centerId,
  });
  const { data: durations = [] } = useQuery({
    queryKey: ["center-durations", centerId],
    queryFn: () => fetchCenterDurations(centerId!),
    enabled: !!centerId,
  });

  const categoryTabs = [
    { value: "all", label: "Tutti" },
    ...categoryRows.map((c) => ({ value: c.name, label: c.name })),
  ];

  useEffect(() => {
    if (!centerId) return;
    const loadServices = async () => {
      try {
        setIsLoading(true);
        const data = await fetchBusinessServices(centerId);
        setServices(data);
      } catch (error) {
        console.error("Error loading services:", error);
        toast.error("Errore nel caricamento dei servizi");
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [centerId]);

  const filteredServices = activeCategory === "all"
    ? services
    : services.filter(service => service.category === activeCategory);

  const closeDialog = () => {
    setIsAddingService(false);
    setEditingId(null);
    setNewService(emptyService);
  };

  const openEdit = (service: BusinessService) => {
    setEditingId(service.id);
    setNewService({
      name: service.name,
      category: service.category,
      duration_minutes: service.duration_minutes,
      price: Number(service.price),
      description: service.description ?? "",
    });
    setIsAddingService(true);
  };

  const handleSaveService = async () => {
    if (!newService.name || !newService.category || !centerId) {
      return;
    }

    const payload = {
      name: newService.name,
      category: newService.category,
      duration_minutes: newService.duration_minutes || 60,
      price: newService.price || 0,
      description: newService.description || "",
    };

    try {
      if (editingId) {
        const updated = await updateBusinessService(centerId, editingId, payload);
        setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        toast.success("Servizio aggiornato");
      } else {
        const created = await createBusinessService(centerId, payload);
        setServices((prev) => [created, ...prev]);
        toast.success("Servizio aggiunto con successo");
      }
      closeDialog();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Impossibile salvare il servizio");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!centerId) return;
    try {
      await deleteBusinessService(centerId, id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Servizio eliminato");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Impossibile eliminare il servizio (solo il titolare può eliminare)");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium">Catalogo Servizi</CardTitle>
          <Dialog open={isAddingService} onOpenChange={(open) => (open ? setIsAddingService(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button className="bg-brand-earth hover:bg-brand-earth/90">
                <Plus className="mr-2 h-4 w-4" /> Nuovo servizio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifica servizio" : "Nuovo servizio"}</DialogTitle>
                <DialogDescription>
                  Inserisci i dettagli del servizio.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome servizio</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="Nome del servizio"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newService.category}
                    onValueChange={(value) => setNewService({ ...newService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryRows.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Durata</Label>
                    <Select
                      value={newService.duration_minutes.toString()}
                      onValueChange={(value) => setNewService({ ...newService, duration_minutes: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona durata" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration} value={String(duration)}>
                            {formatDuration(duration)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Prezzo (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newService.price || ""}
                      onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Descrizione del servizio"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSaveService}>
                  {editingId ? "Salva" : "Aggiungi"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="mb-6 flex flex-nowrap overflow-auto pb-1">
              {categoryTabs.map((category) => (
                <TabsTrigger key={category.value} value={category.value}>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeCategory} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                    <div className="bg-gray-50 p-4 flex justify-between items-start border-b">
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <Badge variant="outline" className="mt-1">
                          {service.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Modifica servizio"
                          onClick={() => openEdit(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isOwner && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Elimina servizio">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminare il servizio?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Gli appuntamenti passati non vengono toccati. L'azione non è reversibile.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {formatDuration(service.duration_minutes)}
                          </span>
                        </div>
                        <div className="flex items-center font-semibold">
                          <Euro className="h-4 w-4 mr-1" />
                          <span>{Number(service.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {isLoading && (
                <div className="text-center py-8 text-sm text-gray-500">Caricamento servizi...</div>
              )}
              
              {filteredServices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <List className="h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Nessun servizio</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {activeCategory === "all"
                      ? "Non hai ancora aggiunto servizi."
                      : "Non hai ancora servizi in questa categoria."}
                  </p>
                  <Button
                    className="mt-6 bg-brand-earth hover:bg-brand-earth/90"
                    onClick={() => setIsAddingService(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Nuovo servizio
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceCatalog;
