"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-context"
import { Check, Copy, Zap } from "lucide-react"

interface CopyButtonProps {
  text: string
  context?: string
  apiName?: string
  functionName?: string
}

export function CopyButton({ text, context, apiName, functionName }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)
  const { t } = useI18n()

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasCopied])

  const generateAIPrompt = () => {
    const basePrompt = `# Instruction
You are an expert software developer. Based on the following up-to-date API documentation, please write a code snippet to perform the task: "[TASK DESCRIPTION HERE]".

# API Context: ${apiName || 'API'} - ${functionName || 'Function'}
${context || text}

# Requirements
- Use proper error handling
- Follow best practices for this API
- Include necessary imports
- Add comments for clarity

# Code`

    return basePrompt
  }

  const copyToClipboard = async () => {
    const textToCopy = context ? generateAIPrompt() : text
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      setHasCopied(true)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      className="h-7 px-2 text-xs"
    >
      {hasCopied ? (
        <>
          <Check className="mr-1 h-3 w-3" />
          {t("api.copiedToClipboard")}
        </>
      ) : (
        <>
          {context ? (
            <>
              <Zap className="mr-1 h-3 w-3" />
              {t("api.copyForAi")}
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              {t("api.copyForAi")}
            </>
          )}
        </>
      )}
    </Button>
  )
}