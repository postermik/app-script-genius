import { Link } from "react-router-dom";
import fullImg from "@/assets/rhetoric-full.png";
import markImg from "@/assets/rhetoric-mark.png";

interface LogoProps {
  variant?: "full" | "mark";
  size?: number;
  to?: string;
  className?: string;
}

export function Logo({ variant = "full", size, to, className = "" }: LogoProps) {
  const h = size ?? (variant === "full" ? 22 : 28);
  const src = variant === "full" ? fullImg : markImg;

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
