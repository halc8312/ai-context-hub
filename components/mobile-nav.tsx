"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"
import { Menu, X } from "lucide-react"
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
  }
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">{t("common.menu")}</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 border-b bg-background shadow-lg">
          <nav className="flex flex-col space-y-1 p-4">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              {t("common.home")}
            </Link>
            <Link
              href="/roadmap"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              {t("common.roadmap")}
            </Link>
            <div className="my-2 h-px bg-border" />
            <div className="text-xs font-semibold text-muted-foreground px-3 py-1">
              {t("common.availableApis")}
            </div>
            {apiList.map((api) => {
              const isActive = pathname.includes(`/api/${api.id}`)
              return (
                <Link
                  key={api.id}
                  href={`/api/${api.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted",
                    isActive && "bg-muted font-medium"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-xl">{api.icon}</span>
                  <div>
                    <div className="font-medium">{t(`apis.${api.id}.name`)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(`apis.${api.id}.description`)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}