import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap border border-input rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow sm:hover:bg-primary/90',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-sm sm:hover:bg-destructive/60',
        outline: 'bg-background shadow-sm sm:hover:bg-accent sm:hover:text-accent-foreground',
        outlineSecondary:
          'bg-secondary shadow-sm sm:hover:bg-secondary/80 sm:hover:text-secondary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground shadow-sm sm:hover:bg-secondary/80',
        accent:
          'border-transparent bg-transparent text-lime-400 shadow-sm sm:hover:bg-secondary/80',
        ghost: 'border-transparent sm:hover:bg-accent sm:hover:text-accent-foreground',
        link: 'border-transparent text-primary underline-offset-4 sm:hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        xs: 'h-6 rounded-md px-2 text-xs',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
