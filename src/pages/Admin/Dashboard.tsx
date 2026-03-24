import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/Admin/AdminLayout";
import ClientsList from "@/components/Admin/ClientsList";
import ContentManagement from "@/components/Admin/ContentManagement";
import { CommunityModeration } from "@/components/Admin/CommunityModeration";
import { CommunityStats } from "@/components/Admin/CommunityStats";
import AIDataTools from "@/components/Admin/AIDataTools";
import ClientMonitoring from "@/components/Admin/ClientMonitoring";
import CollaboratorManagement from "@/components/Admin/CollaboratorManagement";

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "clients";

  const renderTab = () => {
    switch (currentTab) {
      case "content":
        return <ContentManagement />;
      case "community":
        return <CommunityModeration />;
      case "stats":
        return <CommunityStats />;
      case "aidata":
        return <AIDataTools />;
      case "monitoring":
        return <ClientMonitoring />;
      case "users":
        return <CollaboratorManagement />;
      case "clients":
      default:
        return <ClientsList />;
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Dashboard Admin | 4 elementi Italia</title>
      </Helmet>
      {renderTab()}
    </AdminLayout>
  );
};

export default AdminDashboard;

