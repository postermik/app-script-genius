import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface LogoProps {
  variant?: "full" | "mark" | "responsive";
  size?: number;
  to?: string;
  className?: string;
}

function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="9" width="18" height="2" rx="1" fill="currentColor" />
      <rect x="1" y="15" width="10" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function LogoFull({ height = 24 }: { height?: number }) {
  const markSize = height * 0.75;
  const fontSize = height * 0.58;
  return (
    <span className="inline-flex items-center gap-[0.4em] text-foreground" style={{ height }}>
      <LogoMark size={markSize} />
      <span
        className="font-semibold tracking-[0.06em] text-foreground"
        style={{ fontSize, lineHeight: 1, letterSpacing: "0.06em" }}
      >
        RHETORIC
      </span>
    </span>
  );
}

export function Logo({ variant = "responsive", size, to, className = "" }: LogoProps) {
  const isMobile = useIsMobile();
  const resolvedVariant = variant === "responsive"
    ? (isMobile ? "mark" : "full")
    : variant;

  const h = size ?? 24;

  const content = (
    <span className={`inline-flex items-center ${className}`}>
      {resolvedVariant === "full" ? (
        <LogoFull height={h} />
      ) : (
        <LogoMark size={h} />
      )}
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