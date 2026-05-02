import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import MembersPage from "./pages/Members";
import TransactionsPage from "./pages/Transactions";
import SmsImportPage from "./pages/SmsImport";
import SmsWebhookPage from "./pages/SmsWebhook";
import LeadersPage from "./pages/Leaders";
import ReportsPage from "./pages/Reports";
import PrayersPage from "./pages/Prayers";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AboutPage from "./pages/About";
import UdiakoniaPublicPage from "./pages/UdiakoniaPublic";
import SubscribersPage from "./pages/Subscribers";
import AssistantPage from "./pages/Assistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Admin login is at /admin — secret URL, not visible on homepage */}
              <Route path="/admin" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><AppLayout><MembersPage /></AppLayout></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><AppLayout><TransactionsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/sms-import" element={<ProtectedRoute><AppLayout><SmsImportPage /></AppLayout></ProtectedRoute>} />
              <Route path="/sms-webhook" element={<ProtectedRoute><AppLayout><SmsWebhookPage /></AppLayout></ProtectedRoute>} />
              <Route path="/leaders" element={<ProtectedRoute><AppLayout><LeadersPage /></AppLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/prayers" element={<ProtectedRoute><AppLayout><PrayersPage /></AppLayout></ProtectedRoute>} />
              <Route path="/subscribers" element={<ProtectedRoute><AppLayout><SubscribersPage /></AppLayout></ProtectedRoute>} />
              <Route path="/assistant" element={<ProtectedRoute><AppLayout><AssistantPage /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/udiakonia" element={<ProtectedRoute><AppLayout><UdiakoniaPublicPage /></AppLayout></ProtectedRoute>} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

