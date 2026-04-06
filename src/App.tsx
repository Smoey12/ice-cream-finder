import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CustomerAuth from "./pages/CustomerAuth.tsx";
import VendorAuth from "./pages/VendorAuth.tsx";
import LiveMap from "./pages/LiveMap.tsx";
import VendorDashboard from "./pages/VendorDashboard.tsx";
import FleetDashboard from "./pages/FleetDashboard.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import CustomerDashboard from "./pages/CustomerDashboard.tsx";
import EmailConfirmed from "./pages/EmailConfirmed.tsx";
import DevNav from "./components/DevNav.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/customer" element={<CustomerAuth />} />
          <Route path="/auth/vendor" element={<VendorAuth />} />
          <Route path="/map" element={<LiveMap />} />
          <Route path="/dashboard" element={<VendorDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/my-card" element={<CustomerDashboard />} />
          <Route path="/email-confirmed" element={<EmailConfirmed />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <DevNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
