
import { useState } from "react";
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
import { Plus, Edit, Clock, Euro, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number; // in minutes
  price: number;
  description: string;
}

const ServiceCatalog = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    category: "",
    duration: 60,
    price: 0,
    description: ""
  });
  
  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      name: "Classic Facial",
      category: "facial",
      duration: 60,
      price: 75,
      description: "Deep cleansing facial treatment with steam, exfoliation, and hydration mask."
    },
    {
      id: "2",
      name: "Swedish Massage",
      category: "massage",
      duration: 60,
      price: 85,
      description: "Full-body massage using long strokes to promote relaxation and circulation."
    },
    {
      id: "3",
      name: "Haircut & Style",
      category: "hair",
      duration: 45,
      price: 55,
      description: "Precision haircut and professional styling with high-quality products."
    },
    {
      id: "4",
      name: "Manicure with Gel Polish",
      category: "nails",
      duration: 45,
      price: 35,
      description: "Nail shaping, cuticle care, hand massage, and application of gel polish."
    },
    {
      id: "5",
      name: "Anti-Aging Treatment",
      category: "facial",
      duration: 75,
      price: 110,
      description: "Advanced anti-aging facial with specialized serums and techniques."
    },
    {
      id: "6",
      name: "Hot Stone Massage",
      category: "massage",
      duration: 90,
      price: 120,
      description: "Therapeutic massage enhanced with smooth heated stones."
    }
  ]);

  const categories = [
    { value: "all", label: "All Services" },
    { value: "facial", label: "Facial Treatments" },
    { value: "massage", label: "Massage" },
    { value: "hair", label: "Hair Services" },
    { value: "nails", label: "Nail Services" },
    { value: "waxing", label: "Waxing" },
    { value: "makeup", label: "Makeup" },
  ];

  const durations = [
    { value: "30", label: "30 minutes" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
    { value: "75", label: "1 hour 15 minutes" },
    { value: "90", label: "1 hour 30 minutes" },
    { value: "120", label: "2 hours" },
  ];
  
  const filteredServices = activeCategory === "all"
    ? services
    : services.filter(service => service.category === activeCategory);

  const handleAddService = () => {
    if (!newService.name || !newService.category) {
      return;
    }
    
    const service = {
      id: Math.random().toString(36).substr(2, 9),
      name: newService.name,
      category: newService.category,
      duration: newService.duration || 60,
      price: newService.price || 0,
      description: newService.description || ""
    };
    
    setServices([...services, service]);
    setIsAddingService(false);
    setNewService({
      name: "",
      category: "",
      duration: 60,
      price: 0,
      description: ""
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium">Service Catalog</CardTitle>
          <Dialog open={isAddingService} onOpenChange={setIsAddingService}>
            <DialogTrigger asChild>
              <Button className="bg-brand-earth hover:bg-brand-earth/90">
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Enter the service details to add it to your catalog
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="Enter service name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newService.category}
                    onValueChange={(value) => setNewService({ ...newService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(cat => cat.value !== "all").map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={newService.duration?.toString()}
                      onValueChange={(value) => setNewService({ ...newService, duration: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration.value} value={duration.value}>
                            {duration.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (€)</Label>
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Enter service description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddService}>
                  Add Service
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="mb-6 flex flex-nowrap overflow-auto pb-1">
              {categories.map((category) => (
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
                          {categories.find(cat => cat.value === service.category)?.label || service.category}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            {service.duration} {service.duration === 60 ? "minute" : "minutes"}
                          </span>
                        </div>
                        <div className="flex items-center font-semibold">
                          <Euro className="h-4 w-4 mr-1" />
                          <span>{service.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredServices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <List className="h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No services found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {activeCategory === "all" 
                      ? "You haven't added any services yet."
                      : `You haven't added any services in this category yet.`}
                  </p>
                  <Button
                    className="mt-6 bg-brand-earth hover:bg-brand-earth/90"
                    onClick={() => setIsAddingService(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Service
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
