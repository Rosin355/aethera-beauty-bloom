
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
    businessType: "Salon Owner",
    focusAreas: ["Client Acquisition", "Skill Development"],
    experience: "3-5 years"
  });
  useEffect(() => {
    // In a real app, this would fetch the user's profile data
    toast({
      title: "Dashboard personalized",
      description: "Your dashboard has been customized based on your profile."
    });
  }, [toast]);
  return <DashboardLayout>
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-brand-earth to-brand-earth/70 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-playfair">
              Welcome to your personalized experience, {userData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90">
              Your dashboard is tailored for a {userData.businessType} with {userData.experience} of experience, 
              focusing on {userData.focusAreas.join(" and ")}.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="insights">Business Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="growth">Growth Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
                  <ChartPie className="h-5 w-5 text-brand-fire" />
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-gray-500">Revenue chart visualization will appear here</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-medium">Client Demographics</CardTitle>
                  <Users className="h-5 w-5 text-brand-water" />
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
                    <p className="text-gray-500">Client demographics visualization will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-playfair">Personalized Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="bg-white p-4 border rounded-lg flex items-start">
                    <div className="bg-brand-water p-2 rounded-md text-white mr-3">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Advanced Color Theory Course</h3>
                      <p className="text-gray-600 text-sm">Recommended based on your skill development focus</p>
                    </div>
                  </li>
                  <li className="bg-white p-4 border rounded-lg flex items-start">
                    <div className="bg-brand-fire p-2 rounded-md text-white mr-3">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Client Retention Strategy Workshop</h3>
                      <p className="text-gray-600 text-sm">Recommended based on your client acquisition focus</p>
                    </div>
                  </li>
                  <li className="bg-white p-4 border rounded-lg flex items-start">
                    <div className="bg-brand-earth p-2 rounded-md text-white mr-3">
                      <ChartPie className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Special Seasonal Promotion Package</h3>
                      <p className="text-gray-600 text-sm">Increase revenue with this Q2 2025 strategy</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-playfair">Your Growth Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 h-full w-0.5 bg-gray-200"></div>
                  <div className="space-y-8 relative px-[13px] py-0 my-0">
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-brand-water bg-white px-0 py-0"></div>
                      <h3 className="font-bold">Building Foundations</h3>
                      <p className="text-gray-600">Complete your business profile and set goals</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-brand-fire bg-white"></div>
                      <h3 className="font-bold">Skill Enhancement</h3>
                      <p className="text-gray-600">Take 3 recommended courses for your specialty</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-gray-200 bg-white"></div>
                      <h3 className="font-bold">Business Expansion</h3>
                      <p className="text-gray-600">Implement marketing strategies and expand client base</p>
                    </div>
                    <div className="ml-10 relative">
                      <div className="absolute -left-12 mt-1.5 h-6 w-6 rounded-full border-4 border-gray-200 bg-white"></div>
                      <h3 className="font-bold">Industry Recognition</h3>
                      <p className="text-gray-600">Showcase your work and build authority</p>
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
