"use client";

import { useDesignTheme } from "@/components/design-theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/ui/icons";

const AVAILABLE_THEMES = [
  { value: "original", label: "Original" },
  { value: "brutalist", label: "Brutalist" },
  // Additional themes can be enabled in the future:
  // { value: "minimal", label: "Minimal" },
  // { value: "technical", label: "Technical" },
  // { value: "hardware", label: "Hardware" },
  // { value: "lumina", label: "Lumina" },
  // { value: "monitor", label: "Monitor" },
  // { value: "editorial", label: "Editorial" },
  // { value: "organic", label: "Organic" },
  // { value: "typographic", label: "Typographic" },
];

export function DesignThemeSwitcher() {
  const { designTheme, setDesignTheme } = useDesignTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Change design theme">
          <Icons.Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change design theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {AVAILABLE_THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setDesignTheme(theme.value as any)}
            className={designTheme === theme.value ? "bg-accent" : ""}
          >
            {theme.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
