import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import fullImg from "@/assets/rhetoric-full.png";
import markImg from "@/assets/rhetoric-mark.png";

interface LogoProps {
  /** @deprecated – variant is now auto-detected by screen size */
  variant?: "full" | "mark" | "responsive";
  size?: number;
  to?: string;
  className?: string;
}

export function Logo({ variant = "responsive", size, to, className = "" }: LogoProps) {
  const isMobile = useIsMobile();

  // "responsive" = full wordmark on desktop, icon on mobile
  const resolvedVariant = variant === "responsive"
    ? (isMobile ? "mark" : "full")
    : variant;

  const h = size ?? (resolvedVariant === "full" ? 24 : 24);
  const src = resolvedVariant === "full" ? fullImg : markImg;

  const content = (
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={src}
        alt="Rhetoric"
        className="w-auto"
        style={{ height: `${h}px` }}
      />
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
