export type ExportFormat = 'json' | 'markdown' | 'text' | 'xml'

export interface ExportOptions {
  format: ExportFormat
  apiName: string
  content: string | { files: Array<{ title: string; content: string }> }
  includeMetadata?: boolean
}

export function exportDocument(options: ExportOptions): Blob {
  const { format, apiName, content, includeMetadata = true } = options
  
  switch (format) {
    case 'json':
      return exportAsJSON(apiName, content, includeMetadata)
    case 'markdown':
      return exportAsMarkdown(apiName, content, includeMetadata)
    case 'text':
      return exportAsText(apiName, content, includeMetadata)
    case 'xml':
      return exportAsXML(apiName, content, includeMetadata)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

function exportAsJSON(apiName: string, content: any, includeMetadata: boolean): Blob {
  const data = {
    api: apiName,
    exportDate: new Date().toISOString(),
    source: 'API Context Hub',
    ...(includeMetadata && {
      metadata: {
        version: '1.0',
        url: 'https://api-context-hub.vercel.app',
        purpose: 'AI Development Tool Documentation'
      }
    }),
    documentation: typeof content === 'string' 
      ? { content } 
      : content
  }
  
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

function exportAsMarkdown(apiName: string, content: any, includeMetadata: boolean): Blob {
  let markdown = ''
  
  if (includeMetadata) {
    markdown += `---
api: ${apiName}
exportDate: ${new Date().toISOString()}
source: API Context Hub
purpose: AI Development Tool Documentation
---

`
  }
  
  markdown += `# ${apiName} API Documentation\n\n`
  markdown += `> Exported from API Context Hub on ${new Date().toLocaleDateString()}\n\n`
  
  if (typeof content === 'string') {
    markdown += content
  } else if (content.files) {
    content.files.forEach((file: any, index: number) => {
      if (index > 0) markdown += '\n\n---\n\n'
      markdown += `## ${file.title}\n\n`
      markdown += file.content
    })
  }
  
  return new Blob([markdown], { type: 'text/markdown' })
}

function exportAsText(apiName: string, content: any, includeMetadata: boolean): Blob {
  let text = ''
  
  if (includeMetadata) {
    text += `API: ${apiName}\n`
    text += `Export Date: ${new Date().toISOString()}\n`
    text += `Source: API Context Hub\n`
    text += `Purpose: AI Development Tool Documentation\n`
    text += '='.repeat(50) + '\n\n'
  }
  
  text += `${apiName} API DOCUMENTATION\n`
  text += '='.repeat(50) + '\n\n'
  
  if (typeof content === 'string') {
    // Convert Markdown to plain text (basic conversion)
    text += content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
  } else if (content.files) {
    content.files.forEach((file: any, index: number) => {
      if (index > 0) text += '\n' + '-'.repeat(50) + '\n\n'
      text += `${file.title.toUpperCase()}\n`
      text += '-'.repeat(file.title.length) + '\n\n'
      text += file.content
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    })
  }
  
  return new Blob([text], { type: 'text/plain' })
}

function exportAsXML(apiName: string, content: any, includeMetadata: boolean): Blob {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<apiDocumentation>\n'
  
  if (includeMetadata) {
    xml += '  <metadata>\n'
    xml += `    <api>${escapeXML(apiName)}</api>\n`
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`
    xml += '    <source>API Context Hub</source>\n'
    xml += '    <purpose>AI Development Tool Documentation</purpose>\n'
    xml += '  </metadata>\n'
  }
  
  xml += '  <content>\n'
  
  if (typeof content === 'string') {
    xml += `    <section>\n`
    xml += `      <data><![CDATA[${content}]]></data>\n`
    xml += `    </section>\n`
  } else if (content.files) {
    content.files.forEach((file: any) => {
      xml += `    <section>\n`
      xml += `      <title>${escapeXML(file.title)}</title>\n`
      xml += `      <data><![CDATA[${file.content}]]></data>\n`
      xml += `    </section>\n`
    })
  }
  
  xml += '  </content>\n'
  xml += '</apiDocumentation>'
  
  return new Blob([xml], { type: 'application/xml' })
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'json': return '.json'
    case 'markdown': return '.md'
    case 'text': return '.txt'
    case 'xml': return '.xml'
    default: return '.txt'
  }
}

export function generateFilename(apiName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const extension = getFileExtension(format)
  return `${apiName.toLowerCase()}-api-docs-${timestamp}${extension}`
}

export interface MultiApiExportOptions {
  format: ExportFormat
  apis: Array<{
    name: string
    content: any
  }>
  includeMetadata?: boolean
}

export function exportMultipleApis(options: MultiApiExportOptions): Blob {
  const { format, apis, includeMetadata = true } = options
  
  switch (format) {
    case 'json':
      return exportMultipleAsJSON(apis, includeMetadata)
    case 'markdown':
      return exportMultipleAsMarkdown(apis, includeMetadata)
    case 'text':
      return exportMultipleAsText(apis, includeMetadata)
    case 'xml':
      return exportMultipleAsXML(apis, includeMetadata)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

function exportMultipleAsJSON(apis: Array<{ name: string; content: any }>, includeMetadata: boolean): Blob {
  const data = {
    exportDate: new Date().toISOString(),
    source: 'API Context Hub',
    ...(includeMetadata && {
      metadata: {
        version: '1.0',
        url: 'https://api-context-hub.vercel.app',
        purpose: 'AI Development Tool Documentation',
        totalApis: apis.length
      }
    }),
    apis: apis.map(api => ({
      name: api.name,
      documentation: api.content
    }))
  }
  
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
}

function exportMultipleAsMarkdown(apis: Array<{ name: string; content: any }>, includeMetadata: boolean): Blob {
  let markdown = ''
  
  if (includeMetadata) {
    markdown += `---
exportDate: ${new Date().toISOString()}
source: API Context Hub
purpose: AI Development Tool Documentation
totalApis: ${apis.length}
---

`
  }
  
  markdown += `# API Documentation Collection\n\n`
  markdown += `> Exported from API Context Hub on ${new Date().toLocaleDateString()}\n\n`
  markdown += `## Table of Contents\n\n`
  
  apis.forEach((api, index) => {
    markdown += `${index + 1}. [${api.name} API](#${api.name.toLowerCase().replace(/\s+/g, '-')}-api)\n`
  })
  
  markdown += '\n---\n\n'
  
  apis.forEach((api, index) => {
    if (index > 0) markdown += '\n\n---\n\n'
    markdown += `# ${api.name} API\n\n`
    
    if (typeof api.content === 'string') {
      markdown += api.content
    } else if (api.content.files) {
      api.content.files.forEach((file: any, fileIndex: number) => {
        if (fileIndex > 0) markdown += '\n\n'
        markdown += `## ${file.title}\n\n`
        markdown += file.content
      })
    }
  })
  
  return new Blob([markdown], { type: 'text/markdown' })
}

function exportMultipleAsText(apis: Array<{ name: string; content: any }>, includeMetadata: boolean): Blob {
  let text = ''
  
  if (includeMetadata) {
    text += `Export Date: ${new Date().toISOString()}\n`
    text += `Source: API Context Hub\n`
    text += `Purpose: AI Development Tool Documentation\n`
    text += `Total APIs: ${apis.length}\n`
    text += '='.repeat(50) + '\n\n'
  }
  
  text += `API DOCUMENTATION COLLECTION\n`
  text += '='.repeat(50) + '\n\n'
  text += `TABLE OF CONTENTS\n`
  text += '-'.repeat(30) + '\n'
  
  apis.forEach((api, index) => {
    text += `${index + 1}. ${api.name} API\n`
  })
  
  text += '\n' + '='.repeat(50) + '\n\n'
  
  apis.forEach((api, index) => {
    if (index > 0) text += '\n\n' + '='.repeat(50) + '\n\n'
    text += `${api.name.toUpperCase()} API\n`
    text += '='.repeat(api.name.length + 4) + '\n\n'
    
    const plainContent = typeof api.content === 'string' 
      ? api.content 
      : api.content.files?.map((f: any) => f.content).join('\n\n') || ''
    
    text += plainContent
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  })
  
  return new Blob([text], { type: 'text/plain' })
}

function exportMultipleAsXML(apis: Array<{ name: string; content: any }>, includeMetadata: boolean): Blob {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<apiDocumentationCollection>\n'
  
  if (includeMetadata) {
    xml += '  <metadata>\n'
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`
    xml += '    <source>API Context Hub</source>\n'
    xml += '    <purpose>AI Development Tool Documentation</purpose>\n'
    xml += `    <totalApis>${apis.length}</totalApis>\n`
    xml += '  </metadata>\n'
  }
  
  xml += '  <apis>\n'
  
  apis.forEach(api => {
    xml += '    <api>\n'
    xml += `      <name>${escapeXML(api.name)}</name>\n`
    xml += '      <documentation>\n'
    
    if (typeof api.content === 'string') {
      xml += `        <section>\n`
      xml += `          <data><![CDATA[${api.content}]]></data>\n`
      xml += `        </section>\n`
    } else if (api.content.files) {
      api.content.files.forEach((file: any) => {
        xml += `        <section>\n`
        xml += `          <title>${escapeXML(file.title)}</title>\n`
        xml += `          <data><![CDATA[${file.content}]]></data>\n`
        xml += `        </section>\n`
      })
    }
    
    xml += '      </documentation>\n'
    xml += '    </api>\n'
  })
  
  xml += '  </apis>\n'
  xml += '</apiDocumentationCollection>'
  
  return new Blob([xml], { type: 'application/xml' })
}