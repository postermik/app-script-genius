import { Outlet } from "react-router-dom";
import { MarketingNav } from "@/components/MarketingNav";
import { Footer } from "@/components/Footer";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
