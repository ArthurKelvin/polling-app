import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Container({ 
  children, 
  className, 
  size = "lg", 
  padding = "md" 
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl", 
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full"
  };

  const paddingClasses = {
    none: "",
    sm: "px-4 py-2",
    md: "px-4 py-6",
    lg: "px-6 py-8"
  };

  return (
    <div 
      className={cn(
        "mx-auto w-full",
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
