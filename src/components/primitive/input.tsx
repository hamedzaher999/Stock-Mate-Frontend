import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute start-3 text-muted-foreground [&_svg]:size-4">{leftIcon}</span>
          )}
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-xl border border-border bg-input px-3 py-1 text-sm shadow-sm transition-colors",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "ps-9",
              rightIcon && "pe-9",
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute end-3 text-muted-foreground [&_svg]:size-4">{rightIcon}</span>
          )}
        </div>
      );
    }
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl border border-border bg-input px-3 py-1 text-sm shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
