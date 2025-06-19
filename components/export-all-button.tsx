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
import { exportMultipleApis, downloadFile, getFileExtension, ExportFormat } from "@/lib/export-utils"
import { toast } from "sonner"

interface ExportAllButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ExportAllButton({ variant = "outline", size = "default" }: ExportAllButtonProps) {
  const { t } = useI18n()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportAll = async (format: ExportFormat) => {
    setIsExporting(true)
    try {
      // Fetch all API content from the server
      const response = await fetch('/api/export')
      if (!response.ok) {
        throw new Error('Failed to fetch API content')
      }
      
      const data = await response.json()
      const validApis = data.apis
      
      if (!validApis || validApis.length === 0) {
        toast.error("No APIs available to export")
        return
      }
      
      const blob = exportMultipleApis({
        format,
        apis: validApis,
        includeMetadata: true
      })
      
      const timestamp = new Date().toISOString().split('T')[0]
      const extension = getFileExtension(format)
      const filename = `all-apis-documentation-${timestamp}${extension}`
      
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
          {t("api.exportAll")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("api.selectFormat")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExportAll('json')}>
          {getFormatIcon('json')}
          {t("api.exportFormat.json")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportAll('markdown')}>
          {getFormatIcon('markdown')}
          {t("api.exportFormat.markdown")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportAll('text')}>
          {getFormatIcon('text')}
          {t("api.exportFormat.text")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportAll('xml')}>
          {getFormatIcon('xml')}
          {t("api.exportFormat.xml")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}