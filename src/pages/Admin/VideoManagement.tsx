import React from 'react';
import AdminLayout from '@/components/Admin/AdminLayout';
import VideoManagement from '@/components/Admin/VideoManagement';

const VideoManagementPage = () => {
  return (
    <AdminLayout>
      <VideoManagement />
    </AdminLayout>
  );
};

export default VideoManagementPage;