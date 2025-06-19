"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"
import { ExternalLink } from "lucide-react"

export default function RoadmapPage() {
  const { t } = useI18n()
  
  const comingSoonApis = [
    { id: "slack", name: "Slack API", description: "Team collaboration" },
    { id: "googleMaps", name: "Google Maps API", description: "Mapping services" },
    { id: "notion", name: "Notion API", description: "Workspace management" },
    { id: "firebase", name: "Firebase", description: "App development platform" },
    { id: "auth0", name: "Auth0", description: "Authentication & authorization" },
    { id: "algolia", name: "Algolia", description: "Search infrastructure" },
    { id: "shopify", name: "Shopify API", description: "E-commerce platform" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-bold">{t("roadmap.title")}</h1>
          <p className="mt-4 text-muted-foreground">
            {t("roadmap.subtitle")}
          </p>

          <div className="mt-12">
            <h2 className="text-xl md:text-2xl font-semibold">{t("roadmap.comingSoon")}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {comingSoonApis.map((api) => (
                <div key={api.name} className="rounded-lg border bg-card p-4">
                  <h3 className="font-semibold">{t(`comingSoonApis.${api.id}.name`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`comingSoonApis.${api.id}.description`)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl md:text-2xl font-semibold">{t("roadmap.requestApi")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("roadmap.requestApiDesc")}
            </p>
            
            <div className="mt-6 rounded-lg border bg-card p-6">
              <p className="mb-4">
                {t("roadmap.requestFormDesc")}
              </p>
              <Button asChild>
                <a 
                  href="https://forms.gle/example" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  {t("roadmap.submitRequest")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl md:text-2xl font-semibold">{t("roadmap.recentUpdates")}</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t("apis.stripe.name")} API</h3>
                  <span className="text-sm text-muted-foreground">{t("roadmap.added")}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("apis.stripe.description")}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t("apis.sendgrid.name")} API</h3>
                  <span className="text-sm text-muted-foreground">{t("roadmap.comingSoonStatus")}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("apis.sendgrid.description")}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t("apis.twilio.name")} API</h3>
                  <span className="text-sm text-muted-foreground">{t("roadmap.comingSoonStatus")}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("apis.twilio.description")}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t("apis.supabase.name")} API</h3>
                  <span className="text-sm text-muted-foreground">{t("roadmap.comingSoonStatus")}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("apis.supabase.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}