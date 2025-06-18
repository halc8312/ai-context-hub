"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { CopyButton } from "@/components/copy-button"

interface MarkdownContentProps {
  content: string
  apiName?: string
}

export function MarkdownContent({ content, apiName }: MarkdownContentProps) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ children, ...props }) => {
            const codeElement = children as any
            const codeText = codeElement?.props?.children?.[0] || ""
            
            return (
              <div className="relative">
                <pre {...props}>{children}</pre>
                <div className="absolute right-2 top-2">
                  <CopyButton text={codeText} />
                </div>
              </div>
            )
          },
          h2: ({ children, ...props }) => {
            const headingText = children?.toString() || ""
            return (
              <div className="group relative">
                <h2 {...props}>{children}</h2>
                <div className="absolute -right-20 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <CopyButton 
                    text={headingText}
                    context={content}
                    apiName={apiName}
                    functionName={headingText}
                  />
                </div>
              </div>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}