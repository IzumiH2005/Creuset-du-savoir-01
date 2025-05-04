
import { cn } from "@/lib/utils";
import React from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  children: React.ReactNode;
}

export function Heading({
  as: Tag = 'h2',
  size = 'xl',
  className,
  children,
  ...props
}: HeadingProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  return (
    <Tag 
      className={cn(
        'font-serif tracking-tight font-medium leading-tight',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Paragraph({
  size = 'md',
  className,
  children,
  ...props
}: ParagraphProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <p 
      className={cn(
        'leading-7',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

interface DisplayTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  children: React.ReactNode;
}

export function DisplayText({
  size = '4xl',
  className,
  children,
  ...props
}: DisplayTextProps) {
  const sizeClasses = {
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  };

  return (
    <h1 
      className={cn(
        'font-serif font-bold tracking-tight leading-tight bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}
