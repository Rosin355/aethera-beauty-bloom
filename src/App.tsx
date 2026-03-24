
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import CookieBanner from "@/components/ui/CookieBanner";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PersonalizedDashboard = lazy(() => import("./pages/PersonalizedDashboard"));
const ManagementTools = lazy(() => import("./pages/ManagementTools"));
const Community = lazy(() => import("./pages/Community"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Training = lazy(() => import("./pages/Training"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard"));
const ClientDetail = lazy(() => import("./pages/Admin/ClientDetail"));
const CollaboratorManagement = lazy(() => import("./pages/Admin/CollaboratorManagement"));
const VideoManagementPage = lazy(() => import("./pages/Admin/VideoManagement"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Welcome = lazy(() => import("./pages/Welcome"));
const RecuperaAccesso = lazy(() => import("./pages/RecuperaAccesso"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Helmet titleTemplate="%s | 4 elementi Italia" defaultTitle="4 elementi Italia - Piattaforma di Crescita per Business Beauty" />
      <Toaster />
      <Sonner />
      <CookieBanner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
            <Route path="/dashboard/ai-assistant" element={
              <ProtectedRoute>
                <AIAssistant />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
