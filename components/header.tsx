"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"
import { LanguageSelector } from "@/components/language-selector"
import { useI18n } from "@/lib/i18n/i18n-context"
import { Moon, Sun, Zap } from "lucide-react"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Zap className="h-6 w-6" />
          <span className="text-lg md:text-xl font-bold">API Context Hub</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-2 md:space-x-4">
          <nav className="hidden md:flex items-center space-x-3 md:space-x-6">
            <Link 
              href="/" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t("common.apis")}
            </Link>
            <Link 
              href="/roadmap" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t("common.roadmap")}
            </Link>
          </nav>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 md:h-10 md:w-10"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t("common.toggleTheme")}</span>
          </Button>
          
          <LanguageSelector />
          
          <MobileNav />
        </div>
      </div>
    </header>
  )
}