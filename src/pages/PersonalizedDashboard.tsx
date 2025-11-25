
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChartPie, Users, BookOpen, Calendar } from "lucide-react";

const PersonalizedDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    name: "Utente",
    businessType: "Centro Benessere",
    focusAreas: ["Trattamenti Viso", "Massaggi"],
    experience: "5-10 anni"
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (profile?.display_name) {
        setUserData(prev => ({
          ...prev,
          name: profile.display_name,
        }));
      }
    };

    loadUserProfile();

    toast({
      title: "Dashboard personalizzata",
      description: "La tua dashboard è stata personalizzata in base al tuo profilo."
    });
  }, [user, toast]);
  return <DashboardLayout>
      <div className="space-y-6">
        <Card className="glass border border-neutral-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-playfair">
              Benvenuta nella tua esperienza personalizzata, {userData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-300">
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
              <Card className="glass border border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-medium text-white">Tendenza Fatturato</CardTitle>
                  <ChartPie className="h-5 w-5 text-neutral-400" />
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-neutral-900 border border-neutral-800 rounded-md flex items-center justify-center">
                    <p className="text-neutral-400">La visualizzazione del grafico del fatturato apparirà qui</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass border border-neutral-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-medium text-white">Demografia Clienti</CardTitle>
                  <Users className="h-5 w-5 text-neutral-400" />
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-neutral-900 border border-neutral-800 rounded-md flex items-center justify-center">
                    <p className="text-neutral-400">La visualizzazione della demografia dei clienti apparirà qui</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <Card className="glass border border-neutral-800">
              <CardHeader>
                <CardTitle className="text-xl font-playfair text-white">Raccomandazioni Personalizzate</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex items-start">
                    <div className="bg-neutral-800 p-2 rounded-md text-white mr-3 border border-neutral-700">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Corso Avanzato di Teoria del Colore</h3>
                      <p className="text-neutral-400 text-sm">Consigliato in base al tuo focus sullo sviluppo delle competenze</p>
                    </div>
                  </li>
                  <li className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex items-start">
                    <div className="bg-neutral-800 p-2 rounded-md text-white mr-3 border border-neutral-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Workshop sulla Strategia di Fidelizzazione Clienti</h3>
                      <p className="text-neutral-400 text-sm">Consigliato in base al tuo focus sull'acquisizione clienti</p>
                    </div>
                  </li>
                  <li className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex items-start">
                    <div className="bg-neutral-800 p-2 rounded-md text-white mr-3 border border-neutral-700">
                      <ChartPie className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Pacchetto Promozionale Stagionale Speciale</h3>
                      <p className="text-neutral-400 text-sm">Aumenta il fatturato con questa strategia Q2 2025</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="growth" className="space-y-4">
            <Card className="glass border border-neutral-800">
              <CardHeader>
                <CardTitle className="text-xl font-playfair text-white">Il Tuo Percorso di Crescita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 h-full w-0.5 bg-neutral-700"></div>
                  <div className="space-y-8 relative px-[13px] py-0 my-0">
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-neutral-400 bg-neutral-900 px-0 py-0"></div>
                      <h3 className="font-bold text-white">Costruzione delle Fondamenta</h3>
                      <p className="text-neutral-400">Completa il tuo profilo aziendale e imposta gli obiettivi</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-neutral-500 bg-neutral-900"></div>
                      <h3 className="font-bold text-white">Miglioramento delle Competenze</h3>
                      <p className="text-neutral-400">Segui 3 corsi consigliati per la tua specialità</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-neutral-700 bg-neutral-900"></div>
                      <h3 className="font-bold text-white">Espansione del Business</h3>
                      <p className="text-neutral-400">Implementa strategie di marketing ed espandi la base clienti</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-neutral-700 bg-neutral-900"></div>
                      <h3 className="font-bold text-white">Riconoscimento nel Settore</h3>
                      <p className="text-neutral-400">Metti in mostra il tuo lavoro e costruisci autorità</p>
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
