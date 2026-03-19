import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SubmitBook from "./pages/SubmitBook";
import MyProgress from "./pages/MyProgress";
import Leaderboard from "./pages/Leaderboard";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import BookGallery from "./pages/BookGallery";
import Challenges from "./pages/Challenges";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import HousePatronDashboard from "./pages/HousePatronDashboard";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
useEffect(() => {
  const url = window.location.href;

  // Detect Lovable redirect with token
  if (
    url.includes("lovable.app") &&
    (url.includes("access_token") || url.includes("type=recovery"))
  ) {
    const hash = window.location.hash;

    // Redirect to your real reset page with token
    window.location.href =
      "https://mfareadingchallenge.netlify.app/reset-password" + hash;
  }
}, []);
const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Auth Route wrapper (redirect to dashboard if already logged in)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={
        <AuthRoute>
          <Auth />
        </AuthRoute>
      } />

<Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/submit" element={
        <ProtectedRoute>
          <SubmitBook />
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <MyProgress />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/gallery" element={
        <ProtectedRoute>
          <BookGallery />
        </ProtectedRoute>
      } />
      <Route path="/challenges" element={
        <ProtectedRoute>
          <Challenges />
        </ProtectedRoute>
      } />
      <Route path="/librarian" element={
        <ProtectedRoute>
          <LibrarianDashboard />
        </ProtectedRoute>
      } />
      <Route path="/tutor" element={
        <ProtectedRoute>
          <TutorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/house" element={
        <ProtectedRoute>
          <HousePatronDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <PWAInstallPrompt />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
