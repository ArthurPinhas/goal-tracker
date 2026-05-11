import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { appleSpring, tactileHover, tactileTap } from "@/lib/motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/30 dark:shadow-primary/15 dark:hover:shadow-primary/25",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/30 transition-shadow duration-300 hover:shadow-lg hover:shadow-destructive/40",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-md shadow-black/[0.06] transition-shadow duration-300 hover:shadow-lg dark:shadow-black/35",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const reduceMotion = useReducedMotion();
    const cv = buttonVariants({ variant, size, className });

    if (asChild) {
      return <Slot className={cn(cv)} ref={ref} {...props} />;
    }

    return (
      <motion.button
        ref={ref}
        className={cn(cv)}
        whileHover={reduceMotion ? undefined : tactileHover}
        whileTap={reduceMotion ? undefined : tactileTap}
        transition={appleSpring}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
