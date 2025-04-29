
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import WelcomeCard from "@/components/Dashboard/WelcomeCard";
import StatCard from "@/components/Dashboard/StatCard";
import FeaturePreview from "@/components/Dashboard/FeaturePreview";
import { BookOpen, Calendar, Users, MessageSquare, ChartPie } from "lucide-react";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <WelcomeCard />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Clients" 
          value="124" 
          change={{ value: "12%", isPositive: true }} 
          icon={<Users size={24} className="text-white" />} 
          color="bg-brand-water" 
        />
        <StatCard 
          title="Monthly Revenue" 
          value="$8,250" 
          change={{ value: "8.2%", isPositive: true }} 
          icon={<ChartPie size={24} className="text-white" />} 
          color="bg-brand-fire" 
        />
        <StatCard 
          title="Courses Completed" 
          value="7" 
          change={{ value: "2", isPositive: true }} 
          icon={<BookOpen size={24} className="text-white" />} 
          color="bg-brand-earth" 
        />
        <StatCard 
          title="Appointments" 
          value="28" 
          change={{ value: "4%", isPositive: false }} 
          icon={<Calendar size={24} className="text-white" />} 
          color="bg-brand-air" 
        />
      </div>
      
      <h2 className="text-xl font-bold font-playfair mb-6">
        Explore Aethera Features
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeaturePreview 
          title="Online Training" 
          description="Access professional courses, tutorials and earn certificates to enhance your skills." 
          icon={<BookOpen size={24} className="text-white" />}
          linkText="Browse Courses" 
          linkPath="/dashboard/training" 
          color="bg-brand-water" 
        />
        <FeaturePreview 
          title="Management Tools" 
          description="Organize appointments, track inventory, and manage your business efficiently." 
          icon={<Calendar size={24} className="text-white" />}
          linkText="Open Calendar" 
          linkPath="/dashboard/management" 
          color="bg-brand-fire" 
        />
        <FeaturePreview 
          title="Professional Community" 
          description="Connect with fellow beauticians, share experiences, and grow your network." 
          icon={<Users size={24} className="text-white" />}
          linkText="Join Discussions" 
          linkPath="/dashboard/community" 
          color="bg-brand-air" 
        />
        <FeaturePreview 
          title="AI Assistant" 
          description="Get personalized advice on business and treatment management strategies." 
          icon={<MessageSquare size={24} className="text-white" />}
          linkText="Start Conversation" 
          linkPath="/dashboard/ai-assistant" 
          color="bg-brand-earth" 
        />
        <FeaturePreview 
          title="Analytics Dashboard" 
          description="Track KPIs, sales, margins and visualize your monthly performance." 
          icon={<ChartPie size={24} className="text-white" />}
          linkText="View Reports" 
          linkPath="/dashboard/analytics" 
          color="bg-brand-black" 
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
