
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RefreshCcw, Github } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";


export function GlobalHeader() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem("theme") || "light" : "light";
    setTheme(storedTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2 sm:py-4">
      <SidebarTrigger className="md:hidden" /> 
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => typeof window !== 'undefined' && window.location.reload()} aria-label="Refresh page">
          <RefreshCcw className="h-5 w-5" />
        </Button>
        <a href="https://github.com/firebase/genkit/tree/main/experimental/genkit-nextjs-starter" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" aria-label="GitHub Repository">
            <Github className="h-5 w-5" />
          </Button>
        </a>
      </div>
    </header>
  );
}
