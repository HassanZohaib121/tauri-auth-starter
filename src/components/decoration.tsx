"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTheme } from "next-themes";

import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";

export default function Decoration() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMinimizeToTray = async () => {
    try {
      await getCurrentWindow().hide();
    } catch (error) {
      console.error("Failed to hide window:", error);
    }
  };

  // Keep the server and first client render identical.
  // After mounting, switch to the actual resolved theme.
  const isDark = mounted && resolvedTheme === "dark";

  const logoSrc = isDark ? "/logo-dark.png" : "/logo.png";
  const titleSrc = isDark ? "/title-dark.png" : "/title.png";

  return (
    <header
      data-tauri-drag-region
      className="flex h-12 w-full select-none items-center border-b bg-background/95 px-2 backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      {/* Drag region / Branding */}
      <div
        data-tauri-drag-region
        className="flex h-full min-w-0 flex-1 items-center gap-2 px-1"
      >
        {/* App Logo */}
        <div
          data-tauri-drag-region
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md"
        >
          <Image
            src={logoSrc}
            alt="Medizora"
            width={32}
            height={32}
            priority
            className="size-8 object-contain"
          />
        </div>

        {/* App Title */}
        <div data-tauri-drag-region className="flex min-w-0 items-center">
          <Image
            src={titleSrc}
            alt="Medizora Business"
            width={110}
            height={32}
            priority
            className="h-7 w-auto object-contain"
          />
        </div>
      </div>

      {/* Window Controls */}
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />

        <Button
          type="button"
          size="icon-lg"
          variant="ghost"
          onClick={handleMinimizeToTray}
          className="size-11 rounded-md text-muted-foreground transition-colors hover:bg-destructive hover:text-primary focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <X className="size-5" />
        </Button>
      </div>
    </header>
  );
}
