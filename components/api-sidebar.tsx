"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/lib/i18n/i18n-context"
import { cn } from "@/lib/utils"

export type ApiItem = {
  id: string
  name: string
  description: string
  icon: string
}

const apiList: ApiItem[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing",
    icon: "💳"
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Email delivery",
    icon: "📧"
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS & Voice",
    icon: "📱"
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Backend as a Service",
    icon: "🗄️"
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "AI models",
    icon: "🤖"
  }
]

export function ApiSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="w-full md:w-64 border-r bg-muted/10">
      <div className="p-6">
        <h2 className="text-lg font-semibold">{t("common.availableApis")}</h2>
      </div>
      <nav className="space-y-1 px-3">
        {apiList.map((api) => {
          const isActive = pathname.includes(`/api/${api.id}`)
          return (
            <Link
              key={api.id}
              href={`/api/${api.id}`}
              className={cn(
                "block rounded-lg px-3 py-2 transition-colors hover:bg-muted",
                isActive && "bg-muted font-medium"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{api.icon}</span>
                <div>
                  <div className="font-medium">{t(`apis.${api.id}.name`)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(`apis.${api.id}.description`)}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}