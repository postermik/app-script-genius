import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const PRODUCT_LINKS = [
  { label: "Sign In", path: "/auth" },
  { label: "Pricing", path: "/pricing" },
];

const SUPPORT_LINKS = [
  { label: "FAQ", path: "/faq" },
  { label: "Contact", path: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Terms", path: "/terms" },
  { label: "Privacy", path: "/privacy" },
];

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="border-t border-border/40 pt-16 pb-12">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="flex flex-col gap-3">
              <Logo size={24} to="/" />
              <p className="text-[11px] text-muted-foreground/50">
                &copy; {new Date().getFullYear()} Rhetoric. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap gap-10 sm:gap-16">
              <div>
                <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">Product</p>
                <ul className="space-y-2.5">
                  {PRODUCT_LINKS.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">Support</p>
                <ul className="space-y-2.5">
                  {SUPPORT_LINKS.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-4">Legal</p>
                <ul className="space-y-2.5">
                  {LEGAL_LINKS.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}