"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Download, FileJson, FileText, FileCode, FileX } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-context"
import { exportDocument, downloadFile, generateFilename, ExportFormat } from "@/lib/export-utils"
import { toast } from "sonner"

interface ExportButtonProps {
  apiName: string
  content: string | { files: Array<{ title: string; content: string }> }
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ExportButton({ apiName, content, variant = "outline", size = "default" }: ExportButtonProps) {
  const { t } = useI18n()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    try {
      const blob = exportDocument({
        format,
        apiName,
        content,
        includeMetadata: true
      })
      
      const filename = generateFilename(apiName, format)
      downloadFile(blob, filename)
      
      toast.success(t("api.exportSuccess"))
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'json':
        return <FileJson className="mr-2 h-4 w-4" />
      case 'markdown':
        return <FileCode className="mr-2 h-4 w-4" />
      case 'text':
        return <FileText className="mr-2 h-4 w-4" />
      case 'xml':
        return <FileX className="mr-2 h-4 w-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {t("api.export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("api.selectFormat")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('json')}>
          {getFormatIcon('json')}
          {t("api.exportFormat.json")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          {getFormatIcon('markdown')}
          {t("api.exportFormat.markdown")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('text')}>
          {getFormatIcon('text')}
          {t("api.exportFormat.text")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xml')}>
          {getFormatIcon('xml')}
          {t("api.exportFormat.xml")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}