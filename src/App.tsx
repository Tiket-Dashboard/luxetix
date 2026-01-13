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

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
