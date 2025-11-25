
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  MessageSquare, 
  ChartPie, 
  Settings, 
  Bell, 
  Search, 
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "../Layout/Logo";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/Layout/NotificationCenter";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");
  const [initials, setInitials] = useState<string>("U");
  const [userRole, setUserRole] = useState<string>("Utente");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, isCollaborator } = useAuth();

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.display_name) {
        setDisplayName(profile.display_name);
        const names = profile.display_name.split(' ');
        const userInitials = names.map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
        setInitials(userInitials);
      }
    };

    loadUserProfile();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      setUserRole("Amministratore");
    } else if (isCollaborator) {
      setUserRole("Collaboratore");
    } else {
      setUserRole("Utente");
    }
  }, [isAdmin, isCollaborator]);

  const sidebarItems = [
    { name: "Dashboard", path: "/dashboard", icon: ChartPie },
    { name: "Formazione", path: "/dashboard/training", icon: BookOpen },
    { name: "Gestione", path: "/dashboard/management", icon: Calendar },
    { name: "Community", path: "/dashboard/community", icon: Users },
    { name: "Assistente AI", path: "/dashboard/ai-assistant", icon: MessageSquare },
    { name: "Impostazioni", path: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`bg-black text-white w-64 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-30 md:relative border-r border-neutral-800 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center">
              {isSidebarOpen ? (
                <Logo variant="white" />
              ) : (
                <Logo variant="white" showText={false} />
              )}
            </Link>
            <button
              className="md:hidden text-white"
              onClick={toggleSidebar}
            >
              <X size={24} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="mt-8 flex-grow">
            <ul className="px-2 space-y-1">
              {sidebarItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-neutral-800 text-white border border-neutral-700"
                        : "text-gray-300 hover:bg-neutral-900"
                    }`}
                  >
                    <item.icon size={20} />
                    {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-800">
            {isSidebarOpen ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <span className="text-white font-bold">{initials}</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{displayName || "Utente"}</p>
                  <p className="text-xs text-gray-400">{userRole}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <span className="text-white font-bold">{initials}</span>
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              className="mt-4 text-gray-300 hover:text-white hover:bg-neutral-900 w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              {isSidebarOpen && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-black border-b border-neutral-800 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={toggleSidebar}
            >
              <Menu />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={toggleSidebar}
            >
              <Menu />
            </Button>
            <div className="relative ml-4 w-64">
              <Input
                type="text"
                placeholder="Cerca..."
                className="pl-10 pr-4 py-2 border rounded-md w-full bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-400"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                size={18}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <div className="hidden md:block h-8 w-px bg-neutral-700"></div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
              <span className="text-sm font-medium text-neutral-200">{displayName || "Utente"}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-black">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
