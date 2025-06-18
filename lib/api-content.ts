import fs from 'fs'
import path from 'path'

export interface ApiContent {
  id: string
  name: string
  files: Array<{
    filename: string
    title: string
    content: string
  }>
}

const apiMetadata: Record<string, { name: string; description: string }> = {
  stripe: {
    name: 'Stripe',
    description: 'Payment processing platform'
  },
  sendgrid: {
    name: 'SendGrid',
    description: 'Email delivery service'
  },
  twilio: {
    name: 'Twilio',
    description: 'SMS & Voice communication'
  },
  supabase: {
    name: 'Supabase',
    description: 'Backend as a Service'
  }
}

export async function getApiContent(apiId: string): Promise<ApiContent | null> {
  const contentDir = path.join(process.cwd(), 'contents', apiId)
  
  if (!fs.existsSync(contentDir)) {
    return null
  }

  const files = fs.readdirSync(contentDir)
    .filter(file => file.endsWith('.md'))
    .map(filename => {
      const filepath = path.join(contentDir, filename)
      const content = fs.readFileSync(filepath, 'utf-8')
      const title = filename.replace('.md', '').replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      return {
        filename,
        title,
        content
      }
    })

  return {
    id: apiId,
    name: apiMetadata[apiId]?.name || apiId,
    files
  }
}

export function getAvailableApis(): string[] {
  return Object.keys(apiMetadata)
}