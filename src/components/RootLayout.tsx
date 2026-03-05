import { Outlet, useLocation } from "react-router-dom";
import { MarketingNav } from "@/components/MarketingNav";
import { Footer } from "@/components/Footer";
import { useDecksmith } from "@/context/DecksmithContext";

export function RootLayout() {
  const { output } = useDecksmith();
  const location = useLocation();
  const isRaise = location.pathname.startsWith("/raise");
  const isProjectView = !!output && !isRaise;
  const isDashboard = location.pathname === "/dashboard";

  // Show footer only on marketing/public pages
  const showFooter = !isProjectView && !isRaise && !isDashboard;

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
