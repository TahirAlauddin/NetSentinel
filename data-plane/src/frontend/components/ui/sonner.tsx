"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // Use "light" so toasts match the app; set theme="dark" if you add dark mode and wrap with ThemeProvider
  const theme = "light";

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-emerald-500/50 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900 dark:group-[.toaster]:bg-emerald-950/90 dark:group-[.toaster]:text-emerald-100",
          error:
            "group-[.toaster]:border-destructive/50 group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive dark:group-[.toaster]:bg-destructive/20",
          warning:
            "group-[.toaster]:border-amber-500/50 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 dark:group-[.toaster]:bg-amber-950/90 dark:group-[.toaster]:text-amber-100",
        },
      }}
      position="top-center"
      richColors
      {...props}
    />
  );
};

export { Toaster };
