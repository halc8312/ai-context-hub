import { notFound } from 'next/navigation'
import { getApiContent, getAvailableApis } from "@/lib/api-content"
import { ApiContentPage } from "./page-content"

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

  return <ApiContentPage apiContent={apiContent} />
}