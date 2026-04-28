'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PromptStudioExport } from '@/lib/types/studio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Copy, Download, FileInput, Share2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface PromptExportProps {
  promptId: string;
  projectId: string;
  onImported?: (promptId?: string | null) => void;
}

export function PromptExport({ promptId, projectId, onImported }: PromptExportProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportedContent, setExportedContent] = useState('');
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
        'string'
    ) {
      return (error as { response: { data: { message: string } } }).response.data.message;
    }
    return fallback;
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<PromptStudioExport>(
        `/studio-io/prompts/${promptId}/export`,
      );
      setExportedContent(JSON.stringify(data, null, 2));
      setExportOpen(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'No se pudo exportar'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedContent);
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([exportedContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'prompt-studio-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Export descargado');
  };

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setImportText(text);
  };

  const handleImport = async () => {
    let data: unknown;
    try {
      data = JSON.parse(importText);
    } catch {
      toast.error('El archivo no es JSON valido');
      return;
    }

    const payload = data as Partial<PromptStudioExport>;
    if (payload.format !== 'prompt-studio' || payload.formatVersion !== 1) {
      toast.error('Formato Prompt Studio no compatible');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/studio-io/import', {
        projectId,
        data: payload,
      });
      toast.success('Import completado');
      setImportOpen(false);
      setImportText('');
      onImported?.(response.data?.importedPromptId ?? null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'No se pudo importar'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="gap-1 px-2 h-7 text-xs" />}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">IO</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Prompt Studio</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExport} disabled={loading}>
              <Download className="w-3.5 h-3.5 mr-2" />
              Exportar formato propio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportOpen(true)} disabled={loading}>
              <Upload className="w-3.5 h-3.5 mr-2" />
              Importar formato propio
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Export Prompt Studio
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto bg-muted/30 border rounded-lg">
            <pre className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {exportedContent}
            </pre>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Descargar JSON
            </Button>
            <span className="ml-auto text-muted-foreground text-xs">
              {exportedContent.length} caracteres
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileInput className="w-4 h-4" />
              Import Prompt Studio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="file"
              accept="application/json,.json"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
            <Textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              placeholder="Pega aqui un export prompt-studio JSON"
              className="min-h-56 font-mono text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={loading || !importText.trim()}>
              {loading ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
