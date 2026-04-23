'use client';

import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Zap,
  Coins,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Code,
  Download,
  FileText,
  Hash,
  Type,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ExecutionResult, CatalogModel } from './types';

type ViewMode = 'preview' | 'raw';
export type Rating = 'up' | 'down' | null;

interface ResultCardProps {
  result: ExecutionResult;
  index: number;
  findModel: (id: string) => CatalogModel | undefined;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  compact?: boolean;
  rating?: Rating;
  onRate?: (index: number, rating: Rating) => void;
}

function countStats(text: string) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split('\n').length;
  return { chars, words, lines };
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultCard({
  result,
  index,
  findModel,
  copiedIndex,
  onCopy,
  compact = false,
  rating = null,
  onRate,
}: ResultCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [collapsed, setCollapsed] = useState(false);

  const output = result.data?.output ?? '';
  const stats = result.data ? countStats(output) : null;
  const i = index;

  return (
    <div className={`space-y-2 ${compact ? 'p-2' : 'p-3'} border rounded-lg`}>
      {/* Model badge + metrics */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={result.status === 'fulfilled' ? 'default' : 'destructive'}
          className={compact ? 'text-xs' : ''}
        >
          {findModel(result.model)?.label ?? result.model}
        </Badge>
        {result.data && (
          <div className={`flex items-center gap-3 ml-auto text-muted-foreground ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.round(result.data.latencyMs)}ms
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {result.data.tokensIn + result.data.tokensOut} tok
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" />
              ${result.data.cost.toFixed(5)}
            </span>
          </div>
        )}
      </div>

      {result.status === 'fulfilled' && result.data ? (
        <div className="border rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="flex justify-between items-center bg-muted/40 px-2 py-1 border-b">
            {/* View mode toggle */}
            <div className="flex items-center bg-background border rounded-md overflow-hidden">
              <button
                className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setViewMode('preview')}
                title="Preview Markdown"
              >
                <Eye className="w-3 h-3" />
                {!compact && 'Preview'}
              </button>
              <div className="bg-border w-px h-4" />
              <button
                className={`flex items-center gap-1 px-2 py-0.5 text-xs transition-colors ${
                  viewMode === 'raw'
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setViewMode('raw')}
                title="Texto crudo"
              >
                <Code className="w-3 h-3" />
                {!compact && 'Raw'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {/* Rating buttons */}
              {onRate && (
                <>
                  <button
                    className={`p-1.5 rounded transition-colors ${
                      rating === 'up'
                        ? 'bg-green-500/20 text-green-500'
                        : 'hover:bg-background text-muted-foreground hover:text-green-500'
                    }`}
                    onClick={() => onRate(i, rating === 'up' ? null : 'up')}
                    title="Buena respuesta"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    className={`p-1.5 rounded transition-colors ${
                      rating === 'down'
                        ? 'bg-red-500/20 text-red-500'
                        : 'hover:bg-background text-muted-foreground hover:text-red-500'
                    }`}
                    onClick={() => onRate(i, rating === 'down' ? null : 'down')}
                    title="Mala respuesta"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                  <div className="bg-border w-px h-3.5 mx-0.5" />
                </>
              )}
              <button
                className="hover:bg-background p-1.5 rounded transition-colors"
                onClick={() => onCopy(output, i)}
                title="Copiar respuesta"
              >
                {copiedIndex === i ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                className="hover:bg-background p-1.5 rounded transition-colors"
                onClick={() => {
                  const modelLabel = findModel(result.model)?.label ?? result.model;
                  downloadText(output, `${modelLabel.replace(/\s+/g, '-')}-response.md`);
                }}
                title="Descargar respuesta"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                className="hover:bg-background p-1.5 rounded transition-colors"
                onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? 'Expandir' : 'Colapsar'}
              >
                {collapsed ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          {!collapsed && (
            <>
              {viewMode === 'preview' ? (
                <div className="dark:prose-invert prose-pre:m-0 p-3 prose-pre:p-0 max-w-none prose-code:before:content-none prose-code:after:content-none prose prose-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeStr = String(children).replace(/\n$/, '');
                        if (match) {
                          return (
                            <div className="group/code relative my-2">
                              <div className="flex justify-between items-center bg-[#282c34] px-3 py-1 rounded-t text-gray-400 text-xs">
                                <span>{match[1]}</span>
                                <button
                                  className="opacity-0 group-hover/code:opacity-100 hover:text-white transition-opacity"
                                  onClick={() => onCopy(codeStr, i)}
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{
                                  margin: 0,
                                  borderTopLeftRadius: 0,
                                  borderTopRightRadius: 0,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {codeStr}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        return (
                          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                      table({ children }) {
                        return (
                          <div className="my-2 overflow-x-auto">
                            <table className="w-full text-sm">{children}</table>
                          </div>
                        );
                      },
                    }}
                  >
                    {output}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="bg-muted/20 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {output}
                </pre>
              )}

              {/* Stats bar */}
              {stats && (
                <div className={`flex items-center gap-3 bg-muted/20 px-3 py-1.5 border-t text-muted-foreground ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  <span className="flex items-center gap-1">
                    <Type className="w-3 h-3" />
                    {stats.words} palabras
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {stats.chars.toLocaleString()} chars
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {stats.lines} líneas
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-destructive/10 px-3 py-2 rounded text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {result.error || 'Error desconocido'}
        </div>
      )}
    </div>
  );
}
