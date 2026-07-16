
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Search, Archive, ArchiveRestore, Edit, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  archiveInventoryItem,
  createInventoryItem,
  deleteInventoryItem,
  fetchArchivedInventoryItems,
  fetchInventoryItems,
  unarchiveInventoryItem,
  updateInventoryItem,
  type InventoryItem,
} from "@/lib/api/management";
import { useCenter } from "@/contexts/CenterContext";
import { fetchCategories } from "@/lib/api/taxonomies";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const emptyProduct = { name: "", category: "", quantity: 0, supplier: "", price: 0 };

const InventoryManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newProduct, setNewProduct] = useState(emptyProduct);

  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<InventoryItem[]>([]);

  const { centerId } = useCenter();
  const { data: categoryRows = [] } = useQuery({
    queryKey: ["inventory-categories", centerId],
    queryFn: () => fetchCategories("inventory", centerId!, { activeOnly: true }),
    enabled: !!centerId,
  });

  useEffect(() => {
    if (!centerId) return;
    const loadInventory = async () => {
      try {
        setIsLoading(true);
        const data = await fetchInventoryItems(centerId);
        setProducts(data);
      } catch (error) {
        console.error("Error loading inventory:", error);
        toast.error("Errore nel caricamento inventario");
      } finally {
        setIsLoading(false);
      }
    };
    loadInventory();
  }, [centerId]);

  useEffect(() => {
    if (!centerId || !showArchived) return;
    fetchArchivedInventoryItems(centerId).then(setArchivedProducts).catch((error) => {
      console.error("Error loading archived inventory:", error);
    });
  }, [centerId, showArchived]);

  const source = showArchived ? archivedProducts : products;
  const filteredProducts = source.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeDialog = () => {
    setIsAddingProduct(false);
    setEditingId(null);
    setNewProduct(emptyProduct);
  };

  const openEdit = (product: InventoryItem) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      supplier: product.supplier,
      price: Number(product.price),
    });
    setIsAddingProduct(true);
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.supplier || !centerId) {
      return;
    }
    const payload = {
      name: newProduct.name,
      category: newProduct.category,
      quantity: newProduct.quantity || 0,
      supplier: newProduct.supplier,
      price: newProduct.price || 0,
    };
    try {
      if (editingId) {
        const updated = await updateInventoryItem(centerId, editingId, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        toast.success("Prodotto aggiornato");
      } else {
        const created = await createInventoryItem(centerId, payload);
        setProducts((prev) => [created, ...prev]);
        toast.success("Prodotto aggiunto");
      }
      closeDialog();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast.error("Impossibile salvare il prodotto");
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!centerId) return;
    try {
      await archiveInventoryItem(centerId, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Prodotto archiviato");
    } catch (error) {
      console.error("Error archiving inventory item:", error);
      toast.error("Impossibile archiviare il prodotto");
    }
  };

  const handleUnarchiveProduct = async (id: string) => {
    if (!centerId) return;
    try {
      await unarchiveInventoryItem(centerId, id);
      setArchivedProducts((prev) => prev.filter((p) => p.id !== id));
      const data = await fetchInventoryItems(centerId);
      setProducts(data);
      toast.success("Prodotto ripristinato");
    } catch (error) {
      console.error("Error restoring inventory item:", error);
      toast.error("Impossibile ripristinare il prodotto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!centerId) return;
    try {
      await deleteInventoryItem(centerId, id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setArchivedProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Prodotto eliminato");
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast.error("Impossibile eliminare il prodotto");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium">Gestione Inventario</CardTitle>
          <Dialog open={isAddingProduct} onOpenChange={(open) => (open ? setIsAddingProduct(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button className="bg-brand-fire hover:bg-brand-fire/90">
                <Plus className="mr-2 h-4 w-4" /> Nuovo prodotto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifica prodotto" : "Nuovo prodotto"}</DialogTitle>
                <DialogDescription>
                  Inserisci i dettagli del prodotto per l'inventario.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome prodotto</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nome del prodotto"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
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
                    <Label htmlFor="quantity">Quantità</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newProduct.quantity || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Prezzo</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newProduct.price || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier">Fornitore</Label>
                  <Input
                    id="supplier"
                    value={newProduct.supplier}
                    onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                    placeholder="Nome del fornitore"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSaveProduct}>
                  {editingId ? "Salva" : "Aggiungi"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Cerca per nome, categoria o fornitore..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived((v) => !v)}
              className="shrink-0"
            >
              <Archive className="mr-2 h-4 w-4" />
              {showArchived ? "Mostra attivi" : "Mostra archiviati"}
            </Button>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantità</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={product.quantity <= 5 ? "text-red-500 font-semibold" : ""}>
                          {product.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{product.supplier}</TableCell>
                      <TableCell>€{product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {showArchived ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Ripristina prodotto"
                            onClick={() => handleUnarchiveProduct(product.id)}
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Modifica prodotto"
                              onClick={() => openEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Archivia prodotto">
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Archiviare "{product.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Il prodotto sparisce dalle liste attive ma resta consultabile tra gli archiviati e può essere ripristinato.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleArchiveProduct(product.id)}>
                                    Archivia
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
                              aria-label="Elimina prodotto"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare "{product.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                L'eliminazione è definitiva. Se vuoi conservare lo storico, usa l'archiviazione.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                Elimina
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {isLoading ? "Caricamento inventario..." : "Nessun prodotto"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManager;
