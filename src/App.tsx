import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Concerts from "./pages/Concerts";
import ConcertDetail from "./pages/ConcertDetail";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminGuard from "./components/admin/AdminGuard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminConcerts from "./pages/admin/AdminConcerts";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminValidation from "./pages/admin/AdminValidation";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminEventApproval from "./pages/admin/AdminEventApproval";
import AgentInfo from "./pages/AgentInfo";

// Agent pages
import AgentRegister from "./pages/AgentRegister";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentEvents from "./pages/agent/AgentEvents";
import AgentEventCreate from "./pages/agent/AgentEventCreate";
import AgentEarnings from "./pages/agent/AgentEarnings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/concerts" element={<Concerts />} />
            <Route path="/concert/:id" element={<ConcertDetail />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/about" element={<About />} />
            <Route path="/agent-info" element={<AgentInfo />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/concerts"
              element={
                <AdminGuard>
                  <AdminConcerts />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/concerts/:concertId/tickets"
              element={
                <AdminGuard>
                  <AdminTickets />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminGuard>
                  <AdminOrders />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/validation"
              element={
                <AdminGuard>
                  <AdminValidation />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminGuard>
                  <AdminUsers />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/agents"
              element={
                <AdminGuard>
                  <AdminAgents />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/event-approval"
              element={
                <AdminGuard>
                  <AdminEventApproval />
                </AdminGuard>
              }
            />

            {/* Agent routes */}
            <Route path="/agent/register" element={<AgentRegister />} />
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/agent/events" element={<AgentEvents />} />
            <Route path="/agent/events/new" element={<AgentEventCreate />} />
            <Route path="/agent/earnings" element={<AgentEarnings />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
