"use client"

import { Header } from "@/components/header"
import { ApiSidebar } from "@/components/api-sidebar"
import { MarkdownContent } from "@/components/markdown-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/i18n-context"

interface ApiContentPageProps {
  apiContent: {
    id: string
    name: string
    files: Array<{
      filename: string
      title: string
      content: string
    }>
  }
}

export function ApiContentPage({ apiContent }: ApiContentPageProps) {
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="hidden md:block">
          <ApiSidebar />
        </div>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold">{apiContent.name} {t("api.documentation")}</h1>
            <p className="mt-2 text-muted-foreground">
              {t("api.copyPrompt")}
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
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
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