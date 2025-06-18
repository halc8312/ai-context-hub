import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export default function RoadmapPage() {
  const comingSoonApis = [
    { name: "Slack API", description: "Team collaboration" },
    { name: "Google Maps API", description: "Mapping services" },
    { name: "Notion API", description: "Workspace management" },
    { name: "OpenAI API", description: "AI models" },
    { name: "Firebase", description: "App development platform" },
    { name: "Auth0", description: "Authentication & authorization" },
    { name: "Algolia", description: "Search infrastructure" },
    { name: "Shopify API", description: "E-commerce platform" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">Roadmap & API Requests</h1>
          <p className="mt-4 text-muted-foreground">
            Here's what we're planning to add next. Your feedback helps us prioritize!
          </p>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold">Coming Soon</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {comingSoonApis.map((api) => (
                <div key={api.name} className="rounded-lg border bg-card p-4">
                  <h3 className="font-semibold">{api.name}</h3>
                  <p className="text-sm text-muted-foreground">{api.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold">Request an API</h2>
            <p className="mt-2 text-muted-foreground">
              Don't see the API you need? Let us know and we'll prioritize adding it.
            </p>
            
            <div className="mt-6 rounded-lg border bg-card p-6">
              <p className="mb-4">
                We use a simple form to collect API requests. This helps us understand
                which APIs are most needed by the developer community.
              </p>
              <Button asChild>
                <a 
                  href="https://forms.gle/example" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  Submit API Request
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold">Recent Updates</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Stripe API</h3>
                  <span className="text-sm text-muted-foreground">Added</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Payment processing with Payment Intents, Customers, and Subscriptions
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">SendGrid API</h3>
                  <span className="text-sm text-muted-foreground">Coming soon</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Email delivery and management
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Twilio API</h3>
                  <span className="text-sm text-muted-foreground">Coming soon</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  SMS and voice communication
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Supabase API</h3>
                  <span className="text-sm text-muted-foreground">Coming soon</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Backend as a Service platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}