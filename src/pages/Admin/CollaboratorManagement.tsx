import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import CollaboratorManagement from '@/components/Admin/CollaboratorManagement';

const CollaboratorManagementPage = () => {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <CollaboratorManagement />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CollaboratorManagementPage;