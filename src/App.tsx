
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import CookieBanner from "@/components/ui/CookieBanner";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PersonalizedDashboard from "./pages/PersonalizedDashboard";
import ManagementTools from "./pages/ManagementTools";
import Community from "./pages/Community";
import PostDetail from "./pages/PostDetail";
import Training from "./pages/Training";
import Onboarding from "./pages/Onboarding";
import AdminDashboard from "./pages/Admin/Dashboard";
import ClientDetail from "./pages/Admin/ClientDetail";
import CollaboratorManagement from "./pages/Admin/CollaboratorManagement";
import VideoManagementPage from "./pages/Admin/VideoManagement";
import LandingPage from "./pages/LandingPage";
import Welcome from "./pages/Welcome";
import RecuperaAccesso from "./pages/RecuperaAccesso";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Helmet titleTemplate="%s | 4 elementi Italia" defaultTitle="4 elementi Italia - Piattaforma di Crescita per Business Beauty" />
      <Toaster />
      <Sonner />
      <CookieBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected user routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/personalized" element={
            <ProtectedRoute>
              <PersonalizedDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/management" element={
            <ProtectedRoute>
              <ManagementTools />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/community/post/:postId" element={
            <ProtectedRoute>
              <PostDetail />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/training" element={
            <ProtectedRoute>
              <Training />
            </ProtectedRoute>
          } />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          {/* Landing page isolata */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/recupera-accesso" element={<RecuperaAccesso />} />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/clients/:id" element={
            <ProtectedRoute requireAdmin>
              <ClientDetail />
            </ProtectedRoute>
          } />
          <Route path="/admin/collaboratori" element={
            <ProtectedRoute requireAdmin>
              <CollaboratorManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/video-management" element={
            <ProtectedRoute requireAdmin>
              <VideoManagementPage />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
