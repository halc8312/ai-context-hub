"use client"

import { Header } from "@/components/header"
import { ApiSidebar } from "@/components/api-sidebar"
import { ExportAllButton } from "@/components/export-all-button"
import { useI18n } from "@/lib/i18n/i18n-context"
import { Zap } from "lucide-react"

export default function HomePage() {
  const { t } = useI18n()
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="hidden md:block">
          <ApiSidebar />
        </div>
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <Zap className="mx-auto h-16 w-16 text-primary" />
              <h1 className="mt-4 text-2xl md:text-4xl font-bold">{t("home.welcome")}</h1>
              <p className="mt-4 text-base md:text-lg text-muted-foreground">
                {t("home.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">⚡ {t("home.aiReady")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("home.aiReadyDesc")}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">🔄 {t("home.upToDate")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("home.upToDateDesc")}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">🚀 {t("home.saveTime")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("home.saveTimeDesc")}
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">🎯 {t("home.devFocused")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("home.devFocusedDesc")}
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h2 className="text-2xl font-semibold">{t("home.getStarted")}</h2>
              <p className="mt-2 text-muted-foreground">
                {t("home.getStartedDesc")}
              </p>
              <div className="mt-6">
                <ExportAllButton size="lg" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}