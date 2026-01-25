import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({
  href = "/dashboard",
  size = "md",
  showText = true,
  className,
}: {
  href?: string;
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
}) {
  const dims = size === "sm" ? 28 : 32;

  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.svg"   // <-- your actual file in /public
        alt="Paint & Sip Depot"
        width={dims}
        height={dims}
        priority
      />
      {showText && (
        <span className="font-display font-bold leading-none">
          Paint &amp; Sip Depot
        </span>
      )}
    </Link>
  );
}