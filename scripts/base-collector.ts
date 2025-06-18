import * as fs from 'fs/promises'
import * as path from 'path'
import * as cheerio from 'cheerio'

export interface ApiFunction {
  name: string
  description: string
  endpoint?: string
  method?: string
  parameters?: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  example?: string
  response?: string
}

export abstract class BaseApiCollector {
  protected apiName: string
  protected outputDir: string

  constructor(apiName: string) {
    this.apiName = apiName
    this.outputDir = path.join(process.cwd(), 'contents', apiName.toLowerCase())
  }

  abstract collect(): Promise<void>

  protected async saveMarkdown(filename: string, content: string): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true })
    const filePath = path.join(this.outputDir, filename)
    await fs.writeFile(filePath, content, 'utf-8')
    console.log(`Saved: ${filePath}`)
  }

  protected formatFunctionToMarkdown(func: ApiFunction): string {
    let markdown = `## ${func.name}\n\n`
    
    if (func.description) {
      markdown += `${func.description}\n\n`
    }

    if (func.endpoint) {
      markdown += `**Endpoint:** \`${func.method || 'GET'} ${func.endpoint}\`\n\n`
    }

    if (func.parameters && func.parameters.length > 0) {
      markdown += `### Parameters\n\n`
      markdown += `| Name | Type | Required | Description |\n`
      markdown += `|------|------|----------|-------------|\n`
      
      func.parameters.forEach(param => {
        markdown += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`
      })
      markdown += '\n'
    }

    if (func.example) {
      markdown += `### Example\n\n\`\`\`javascript\n${func.example}\n\`\`\`\n\n`
    }

    if (func.response) {
      markdown += `### Response\n\n\`\`\`json\n${func.response}\n\`\`\`\n\n`
    }

    return markdown
  }

  protected async fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
    const response = await fetch(url)
    const html = await response.text()
    return cheerio.load(html)
  }
}