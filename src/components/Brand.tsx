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
  const subtitleClassName =
    size === "sm" ? "text-[10px] sm:text-xs" : "text-xs";

  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <Image
        src="/Misc/logo.svg"
        alt="Paint & Sip Depot"
        width={dims}
        height={dims}
        priority
      />
      {showText && (
        <span className="flex flex-col justify-center leading-none">
          <span className="font-display font-bold">Paint &amp; Sip Depot</span>
          <span className={cn("font-medium text-muted-foreground", subtitleClassName)}>
            Formerly known as Millennium Studios
          </span>
        </span>
      )}
    </Link>
  );
}
