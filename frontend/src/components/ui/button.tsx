import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "subtle";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

    const variantClasses = {
      default: "bg-zinc-900 text-white shadow hover:bg-zinc-800",
      outline:
        "border border-black/[0.1] bg-white text-zinc-900 shadow-sm hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
      secondary: "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200",
      ghost: "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
      subtle: "bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-900",
    }[variant];

    const sizeClasses = {
      default: "h-9 px-4 py-2 text-xs",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-6 text-sm",
      icon: "h-8 w-8",
    }[size];

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
