import Link from 'next/link'
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
          <p className="mt-2 text-muted-foreground">
            The API documentation you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-8">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}