import { notFound } from 'next/navigation'
import { Header } from "@/components/header"
import { ApiSidebar } from "@/components/api-sidebar"
import { MarkdownContent } from "@/components/markdown-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getApiContent, getAvailableApis } from "@/lib/api-content"

export async function generateStaticParams() {
  const apis = getAvailableApis()
  return apis.map((apiId) => ({
    apiId,
  }))
}

export default async function ApiDocumentationPage({
  params,
}: {
  params: { apiId: string }
}) {
  const apiContent = await getApiContent(params.apiId)

  if (!apiContent) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <ApiSidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-8">
            <h1 className="text-3xl font-bold">{apiContent.name} API Documentation</h1>
            <p className="mt-2 text-muted-foreground">
              Click "⚡ Copy for AI" on any section to get AI-optimized prompts
            </p>

            {apiContent.files.length === 1 ? (
              <div className="mt-8">
                <MarkdownContent 
                  content={apiContent.files[0].content} 
                  apiName={apiContent.name}
                />
              </div>
            ) : (
              <Tabs defaultValue={apiContent.files[0].filename} className="mt-8">
                <TabsList className="grid w-full grid-cols-3">
                  {apiContent.files.map((file) => (
                    <TabsTrigger key={file.filename} value={file.filename}>
                      {file.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {apiContent.files.map((file) => (
                  <TabsContent key={file.filename} value={file.filename}>
                    <MarkdownContent 
                      content={file.content} 
                      apiName={apiContent.name}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}