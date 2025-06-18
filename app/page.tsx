import { Header } from "@/components/header"
import { ApiSidebar } from "@/components/api-sidebar"
import { Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <ApiSidebar />
        <main className="flex-1 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <Zap className="mx-auto h-16 w-16 text-primary" />
              <h1 className="mt-4 text-4xl font-bold">Welcome to API Context Hub</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Get up-to-date API documentation optimized for AI development tools
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">⚡ AI-Ready Documentation</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Copy structured prompts with the latest API information directly to your clipboard,
                  formatted for ChatGPT, GitHub Copilot, and other AI tools.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">🔄 Always Up-to-Date</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Our documentation is automatically synchronized with official API sources,
                  ensuring you always have the latest information.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">🚀 Save Development Time</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stop manually searching through documentation. Get exactly what you need
                  with one click, formatted for immediate use.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold">🎯 Developer Focused</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Built by developers, for developers. We focus on the essential information
                  you need to integrate APIs quickly and correctly.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h2 className="text-2xl font-semibold">Get Started</h2>
              <p className="mt-2 text-muted-foreground">
                Select an API from the sidebar to view its documentation
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}