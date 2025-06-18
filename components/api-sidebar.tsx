"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

export function ApiSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-full md:w-64 border-r bg-muted/10">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Available APIs</h2>
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
                  <div className="font-medium">{api.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {api.description}
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