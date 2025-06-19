import { NextResponse } from 'next/server'
import { getApiContent, getAvailableApis } from '@/lib/api-content'

export async function GET() {
  try {
    const apiIds = getAvailableApis()
    
    const apis = await Promise.all(
      apiIds.map(async (apiId) => {
        const content = await getApiContent(apiId)
        return content ? {
          id: apiId,
          name: content.name,
          content: content
        } : null
      })
    )
    
    const validApis = apis.filter(api => api !== null)
    
    return NextResponse.json({ apis: validApis })
  } catch (error) {
    console.error('Error fetching API content:', error)
    return NextResponse.json({ error: 'Failed to fetch API content' }, { status: 500 })
  }
}