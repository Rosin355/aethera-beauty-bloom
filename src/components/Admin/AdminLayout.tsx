
import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { 
  BookOpen, 
  Users, 
  ChartPie, 
  Bell, 
  Search, 
  Menu, 
  X,
  LogOut,
  Activity,
  Database,
  Video,
  Home,
  MessageSquare,
  BarChart3,
  UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "../Layout/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signOut } = useAuth();
  
  const currentTab = searchParams.get("tab") || "clients";

  const sidebarItems = [
    { name: "Clienti", tab: "clients", icon: Users },
    { name: "Contenuti", tab: "content", icon: BookOpen },
    { name: "Community", tab: "community", icon: MessageSquare },
    { name: "Statistiche", tab: "stats", icon: BarChart3 },
    { name: "Dati AI", tab: "aidata", icon: Database },
    { name: "Monitoraggio", tab: "monitoring", icon: Activity },
    { name: "Utenti", tab: "users", icon: UserCog },
  ];

  const isActiveTab = (tab: string) => {
    return location.pathname === "/admin/dashboard" && currentTab === tab;
  };

  const isVideoPage = location.pathname === "/admin/video-management";

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-black border-r border-neutral-800 text-white w-64 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-30 md:relative",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-neutral-800">
            <Link to="/admin/dashboard" className="flex items-center">
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
          <nav className="mt-4 flex-grow">
            <ul className="px-2 space-y-1">
              {/* Dashboard Overview */}
              <li className="mb-4">
                <Link
                  to="/admin/dashboard"
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    location.pathname === "/admin/dashboard" && !searchParams.get("tab")
                      ? "bg-neutral-800 text-white border border-neutral-700"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  )}
                >
                  <ChartPie size={20} />
                  {isSidebarOpen && <span className="ml-3">Dashboard</span>}
                </Link>
              </li>

              {/* Tab Items */}
              {sidebarItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={`/admin/dashboard?tab=${item.tab}`}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg transition-colors",
                      isActiveTab(item.tab)
                        ? "bg-neutral-800 text-white border border-neutral-700"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              ))}

              {/* Video Management - Separate Page */}
              <li className="mt-4 pt-4 border-t border-neutral-800">
                <Link
                  to="/admin/video-management"
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    isVideoPage
                      ? "bg-neutral-800 text-white border border-neutral-700"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  )}
                >
                  <Video size={20} />
                  {isSidebarOpen && <span className="ml-3">Gestione Video</span>}
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-neutral-800">
            {isSidebarOpen ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <span className="text-white font-bold">AM</span>
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-fire text-white">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">Amministratore</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <span className="text-white font-bold">AM</span>
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              className="mt-4 text-neutral-400 hover:text-white hover:bg-neutral-900 w-full justify-start"
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
              className="md:hidden mr-2 text-neutral-400 hover:text-white hover:bg-neutral-900"
              onClick={toggleSidebar}
            >
              <Menu />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-neutral-400 hover:text-white hover:bg-neutral-900"
              onClick={toggleSidebar}
            >
              <Menu />
            </Button>
            <div className="relative ml-4 w-64">
              <Input
                type="text"
                placeholder="Cerca..."
                className="pl-10 pr-4 py-2 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-600"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500"
                size={18}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="gap-2 border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800">
                <Home size={16} />
                <span className="hidden md:inline">Dashboard Utente</span>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative text-neutral-400 hover:text-white hover:bg-neutral-900">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-brand-fire rounded-full"></span>
            </Button>
            <div className="hidden md:block h-8 w-px bg-neutral-800"></div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AM</span>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-fire text-white">
                Admin
              </span>
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

export default AdminLayout;
