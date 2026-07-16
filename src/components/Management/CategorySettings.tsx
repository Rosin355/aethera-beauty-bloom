import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { ArrowDown, ArrowUp, Check, Plus, Pencil, EyeOff, Eye, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCenter } from "@/contexts/CenterContext";
import {
  createCategory,
  fetchCategories,
  renameCategory,
  reorderCategory,
  setCategoryActive,
  type CategoryKind,
  type CategoryRow,
} from "@/lib/api/taxonomies";

const CategoryListEditor = ({ kind, title }: { kind: CategoryKind; title: string }) => {
  const { centerId } = useCenter();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const queryKey = ["categories-manage", kind, centerId];
  const { data: categories = [] } = useQuery({
    queryKey,
    queryFn: () => fetchCategories(kind, centerId!, { activeOnly: false }),
    enabled: !!centerId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: [`${kind}-categories`] });
  };

  const handleAdd = async () => {
    if (!centerId || !newName.trim()) return;
    try {
      await createCategory(kind, centerId, newName);
      setNewName("");
      refresh();
      toast.success("Categoria aggiunta");
    } catch (error) {
      console.error(error);
      toast.error("Impossibile aggiungere (nome già esistente?)");
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await renameCategory(kind, id, editingName);
      setEditingId(null);
      refresh();
      toast.success("Categoria rinominata");
    } catch (error) {
      console.error(error);
      toast.error("Impossibile rinominare");
    }
  };

  const handleActive = async (id: string, active: boolean) => {
    try {
      await setCategoryActive(kind, id, active);
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Operazione non riuscita");
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const a = categories[index];
    const b = categories[index + direction];
    if (!a || !b) return;
    try {
      await Promise.all([
        reorderCategory(kind, a.id, b.sort_order),
        reorderCategory(kind, b.id, a.sort_order),
      ]);
      refresh();
    } catch (error) {
      console.error(error);
      toast.error("Riordino non riuscito");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nuova categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!newName.trim()} className="shrink-0">
            <Plus className="h-4 w-4" />
            Aggiungi
          </Button>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border">
          {categories.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nessuna categoria.</p>
          ) : (
            categories.map((category: CategoryRow, index: number) => (
              <div key={category.id} className="flex items-center gap-2 p-3">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Sposta su"
                    disabled={index === 0}
                    onClick={() => handleMove(index, -1)}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Sposta giù"
                    disabled={index === categories.length - 1}
                    onClick={() => handleMove(index, 1)}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {editingId === category.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(category.id)}
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" aria-label="Salva" onClick={() => handleRename(category.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Annulla" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${category.active ? "" : "text-muted-foreground line-through"}`}>
                      {category.name}
                    </span>
                    {!category.active && <Badge>Disattivata</Badge>}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Rinomina"
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {category.active ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Disattiva">
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disattivare "{category.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Non comparirà più tra le categorie selezionabili. I servizi e i prodotti
                              già associati restano invariati. Potrai riattivarla in qualsiasi momento.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleActive(category.id, false)}>
                              Disattiva
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Riattiva"
                        onClick={() => handleActive(category.id, true)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CategorySettings = () => {
  const { role } = useCenter();
  if (role !== "owner") return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CategoryListEditor kind="service" title="Categorie servizi" />
      <CategoryListEditor kind="inventory" title="Categorie inventario" />
    </div>
  );
};

export default CategorySettings;
