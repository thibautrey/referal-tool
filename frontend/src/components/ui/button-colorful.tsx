import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonColorfulProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: React.ReactNode;
}

export function ButtonColorful({
  className,
  label = "",
  icon,
  children,
  ...props
}: ButtonColorfulProps) {
  return (
    <Button
      className={cn(
        "relative h-10 px-4 overflow-hidden",
        "bg-zinc-900/50 dark:bg-zinc-100/50", // Opacité réduite pour rendre l'effet moins prononcé
        "transition-all duration-200",
        "group",
        className
      )}
      {...props}
    >
      {/* Gradient background effect */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
          "opacity-40 group-hover:opacity-80",
          "blur transition-opacity duration-500"
        )}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        {icon}
        <span className="text-white dark:text-zinc-900">{label}</span>
        {children}
      </div>
    </Button>
  );
}
