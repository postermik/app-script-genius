import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DecksmithProvider } from "@/context/DecksmithContext";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { RootLayout } from "@/components/RootLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Resources from "./pages/Resources";
import Raise from "./pages/Raise";
import Investors from "./pages/raise/Investors";
import Outreach from "./pages/raise/Outreach";
import DataRoom from "./pages/raise/DataRoom";
import Pipeline from "./pages/raise/Pipeline";
import PublicDataRoom from "./pages/PublicDataRoom";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <SubscriptionProvider>
          <DecksmithProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public data room - outside RootLayout for clean presentation */}
              <Route path="/room/:slug" element={<PublicDataRoom />} />
              <Route element={<RootLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/investors" element={<Navigate to="/raise/investors" replace />} />
                <Route path="/raise" element={<Raise />}>
                  <Route path="investors" element={<Investors />} />
                  <Route path="outreach" element={<Outreach />} />
                  <Route path="data-room" element={<DataRoom />} />
                  <Route path="pipeline" element={<Pipeline />} />
                </Route>
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </DecksmithProvider>
        </SubscriptionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
