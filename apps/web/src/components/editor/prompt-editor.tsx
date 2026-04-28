'use client';

import { useCallback, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { usePromptStore } from '@/lib/stores/prompt-store';
import { setEditorInstance } from '@/lib/editor-ref';
import { EditorToolbar } from './editor-toolbar';
import { MessageBuilder } from './message-builder';

interface PromptEditorProps {
  promptId: string;
  projectId: string;
  onImported?: (promptId?: string | null) => void;
}

export function PromptEditor({ promptId, projectId, onImported }: PromptEditorProps) {
  const { content, setContent, editorMode } = usePromptStore();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    return () => setEditorInstance(null);
  }, []);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      setEditorInstance(editor);
      monaco.languages.register({ id: 'prompt' });

      monaco.languages.setMonarchTokensProvider('prompt', {
        tokenizer: {
          root: [
            [/\/\/.*$/, 'comment'],
            [/\{\{/, { token: 'variable.bracket', next: '@variable' }],
          ],
          variable: [
            [/\w+/, 'variable.name'],
            [/\}\}/, { token: 'variable.bracket', next: '@root' }],
          ],
        },
      });

      monaco.editor.defineTheme('prompt-studio-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '8083ff', fontStyle: 'italic' },
          { token: 'variable.bracket', foreground: 'a7b6cc', fontStyle: 'bold' },
          { token: 'variable.name', foreground: 'a7b6cc', fontStyle: 'bold' },
        ],
        colors: {
          'editor.background': '#060e20',
          'editor.foreground': '#dae2fd',
          'editor.lineHighlightBackground': '#0b132600',
          'editorLineNumber.foreground': '#464554',
          'editorLineNumber.activeForeground': '#c0c1ff',
          'editor.selectionBackground': '#2d344980',
          'editorCursor.foreground': '#c0c1ff',
          'editorGutter.background': '#060e2080',
        },
      });

      monaco.editor.defineTheme('prompt-studio-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6366f1', fontStyle: 'italic' },
          { token: 'variable.bracket', foreground: '7c3aed', fontStyle: 'bold' },
          { token: 'variable.name', foreground: '7c3aed', fontStyle: 'bold' },
        ],
        colors: {},
      });

      const themeName = resolvedTheme === 'dark' ? 'prompt-studio-dark' : 'prompt-studio-light';
      monaco.editor.setTheme(themeName);

      editor.updateOptions({
        fontSize: 15,
        lineHeight: 24,
        fontFamily: 'var(--font-geist-mono), "Geist Mono", monospace',
        wordWrap: 'on',
        minimap: { enabled: false },
        padding: { top: 24, bottom: 24 },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        folding: false,
        glyphMargin: false,
        lineDecorationsWidth: 16,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      });
    },
    [resolvedTheme],
  );

  // Compute line/col info
  const lines = content.split('\n');
  const lineCount = lines.length;

  return (
    <div className="flex flex-col bg-[#060e20] rounded-xl h-full overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-[rgba(70,69,84,0.05)]">
      <EditorToolbar promptId={promptId} projectId={projectId} onImported={onImported} />

      {editorMode === 'template' ? (
        <div className="flex-1 min-h-0 relative">
          <Editor
            height="100%"
            defaultLanguage="prompt"
            value={content}
            onChange={(value) => setContent(value || '')}
            onMount={handleEditorMount}
            theme={resolvedTheme === 'dark' ? 'prompt-studio-dark' : 'prompt-studio-light'}
            options={{
              fontSize: 15,
              fontFamily: 'var(--font-geist-mono), "Geist Mono", monospace',
              wordWrap: 'on',
              minimap: { enabled: false },
              lineNumbers: 'on',
            }}
            loading={
              <div className="flex justify-center items-center h-full text-ps-text-muted">
                Cargando editor...
              </div>
            }
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <MessageBuilder />
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-[#131b2e] border-t border-[#2d3449]/30 px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#4edea3]" />
            <span className="font-[var(--font-geist-mono)] text-xs text-[#464554]">
              System Prompt
            </span>
          </div>
          <span className="font-[var(--font-geist-mono)] text-xs text-[#464554]">
            Ln {lineCount}, Col 1
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-[var(--font-geist-mono)] text-xs text-[#464554]">UTF-8</span>
          <span className="font-[var(--font-geist-mono)] text-xs text-[#464554]">Geist Mono</span>
        </div>
      </div>
    </div>
  );
}
