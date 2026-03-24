
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
import { Plus, Search, Archive, Edit, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInventoryItem, deleteInventoryItem, fetchInventoryItems, type InventoryItem } from "@/lib/api/management";
import { toast } from "sonner";

const InventoryManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    quantity: 0,
    supplier: "",
    price: 0
  });
  
  const [products, setProducts] = useState<InventoryItem[]>([]);

  const categories = ["Skincare", "Haircare", "Makeup", "Equipment", "Nails", "Massage", "Other"];
  
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setIsLoading(true);
        const data = await fetchInventoryItems();
        setProducts(data);
      } catch (error) {
        console.error("Error loading inventory:", error);
        toast.error("Errore nel caricamento inventario");
      } finally {
        setIsLoading(false);
      }
    };
    loadInventory();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.supplier) {
      return;
    }

    try {
      const created = await createInventoryItem({
        name: newProduct.name,
        category: newProduct.category,
        quantity: newProduct.quantity || 0,
        supplier: newProduct.supplier,
        price: newProduct.price || 0,
      });
      setProducts((prev) => [created, ...prev]);
      setIsAddingProduct(false);
      setNewProduct({
        name: "",
        category: "",
        quantity: 0,
        supplier: "",
        price: 0
      });
      toast.success("Prodotto aggiunto");
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast.error("Impossibile aggiungere il prodotto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      setProducts(products.filter(product => product.id !== id));
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
          <CardTitle className="text-xl font-medium">Inventory Management</CardTitle>
          <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
            <DialogTrigger asChild>
              <Button className="bg-brand-fire hover:bg-brand-fire/90">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter the product details to add it to your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newProduct.quantity || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
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
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={newProduct.supplier}
                    onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddProduct}>
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search products by name, category or supplier..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {isLoading ? "Caricamento inventario..." : "No products found"}
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
