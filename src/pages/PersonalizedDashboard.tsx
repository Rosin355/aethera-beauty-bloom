
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChartPie, Users, BookOpen, Calendar } from "lucide-react";

const PersonalizedDashboard = () => {
  const {
    toast
  } = useToast();
  const [userData, setUserData] = useState({
    name: "Jane Smith",
    businessType: "Proprietaria di Salone",
    focusAreas: ["Acquisizione Clienti", "Sviluppo Competenze"],
    experience: "3-5 anni"
  });
  useEffect(() => {
    // In un'app reale, questo recupererebbe i dati del profilo dell'utente
    toast({
      title: "Dashboard personalizzata",
      description: "La tua dashboard è stata personalizzata in base al tuo profilo."
    });
  }, [toast]);
  return <DashboardLayout>
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-brand-earth to-brand-earth/70 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-playfair">
              Benvenuta nella tua esperienza personalizzata, {userData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90">
              La tua dashboard è personalizzata per una {userData.businessType} con {userData.experience} di esperienza, 
              focalizzata su {userData.focusAreas.join(" e ")}.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="insights">Analisi Business</TabsTrigger>
            <TabsTrigger value="recommendations">Raccomandazioni</TabsTrigger>
            <TabsTrigger value="growth">Piano di Crescita</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-medium">Tendenza Fatturato</CardTitle>
                  <ChartPie className="h-5 w-5 text-brand-fire" />
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-gray-500">La visualizzazione del grafico del fatturato apparirà qui</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-medium">Demografia Clienti</CardTitle>
                  <Users className="h-5 w-5 text-brand-water" />
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-gray-500">La visualizzazione della demografia dei clienti apparirà qui</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-playfair">Raccomandazioni Personalizzate</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="bg-white p-4 border rounded-lg flex items-start">
                    <div className="bg-brand-water p-2 rounded-md text-white mr-3">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Corso Avanzato di Teoria del Colore</h3>
                      <p className="text-gray-600 text-sm">Consigliato in base al tuo focus sullo sviluppo delle competenze</p>
                    </div>
                  </li>
                  <li className="bg-white p-4 border rounded-lg flex items-start">
                    <div className="bg-brand-fire p-2 rounded-md text-white mr-3">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Workshop sulla Strategia di Fidelizzazione Clienti</h3>
                      <p className="text-gray-600 text-sm">Consigliato in base al tuo focus sull'acquisizione clienti</p>
                    </div>
                  </li>
                  <li className="bg-white p-4 border rounded-lg flex items-start">
                    <div className="bg-brand-earth p-2 rounded-md text-white mr-3">
                      <ChartPie className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Pacchetto Promozionale Stagionale Speciale</h3>
                      <p className="text-gray-600 text-sm">Aumenta il fatturato con questa strategia Q2 2025</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-playfair">Il Tuo Percorso di Crescita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 h-full w-0.5 bg-gray-200"></div>
                  <div className="space-y-8 relative px-[13px] py-0 my-0">
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-brand-water bg-white px-0 py-0"></div>
                      <h3 className="font-bold">Costruzione delle Fondamenta</h3>
                      <p className="text-gray-600">Completa il tuo profilo aziendale e imposta gli obiettivi</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-brand-fire bg-white"></div>
                      <h3 className="font-bold">Miglioramento delle Competenze</h3>
                      <p className="text-gray-600">Segui 3 corsi consigliati per la tua specialità</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-gray-200 bg-white"></div>
                      <h3 className="font-bold">Espansione del Business</h3>
                      <p className="text-gray-600">Implementa strategie di marketing ed espandi la base clienti</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-gray-200 bg-white"></div>
                      <h3 className="font-bold">Riconoscimento nel Settore</h3>
                      <p className="text-gray-600">Metti in mostra il tuo lavoro e costruisci autorità</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>;
};
export default PersonalizedDashboard;
