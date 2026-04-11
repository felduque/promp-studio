'use client';

import { useCallback, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { usePromptStore } from '@/lib/stores/prompt-store';
import { setEditorInstance } from '@/lib/editor-ref';
import { EditorToolbar } from './editor-toolbar';
import { MessageBuilder } from './message-builder';

export function PromptEditor() {
  const { content, setContent, editorMode } = usePromptStore();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    return () => setEditorInstance(null);
  }, []);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    setEditorInstance(editor);
    monaco.languages.register({ id: 'prompt' });

    monaco.languages.setMonarchTokensProvider('prompt', {
      tokenizer: {
        root: [
          [/\{\{/, { token: 'variable.bracket', next: '@variable' }],
        ],
        variable: [
          [/\w+/, 'variable.name'],
          [/\}\}/, { token: 'variable.bracket', next: '@root' }],
        ],
      },
    });

    monaco.editor.defineTheme('prompt-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'variable.bracket', foreground: '7c3aed', fontStyle: 'bold' },
        { token: 'variable.name', foreground: '7c3aed', fontStyle: 'bold' },
      ],
      colors: {},
    });

    monaco.editor.defineTheme('prompt-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'variable.bracket', foreground: 'a78bfa', fontStyle: 'bold' },
        { token: 'variable.name', foreground: 'a78bfa', fontStyle: 'bold' },
      ],
      colors: {},
    });

    const themeName = resolvedTheme === 'dark' ? 'prompt-dark' : 'prompt-light';
    monaco.editor.setTheme(themeName);

    editor.updateOptions({
      fontSize: 14,
      lineHeight: 22,
      wordWrap: 'on',
      minimap: { enabled: false },
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      lineNumbers: 'off',
      folding: false,
      glyphMargin: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
    });
  }, [resolvedTheme]);

  return (
    <div className="flex flex-col border rounded-lg h-full min-h-48 sm:min-h-64 overflow-hidden">
      <EditorToolbar />
      {editorMode === 'template' ? (
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="prompt"
            value={content}
            onChange={(value) => setContent(value || '')}
            onMount={handleEditorMount}
            theme={resolvedTheme === 'dark' ? 'prompt-dark' : 'prompt-light'}
            options={{
              fontSize: 14,
              wordWrap: 'on',
              minimap: { enabled: false },
              lineNumbers: 'off',
            }}
            loading={
              <div className="flex justify-center items-center h-full text-muted-foreground">
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
    </div>
  );
}
