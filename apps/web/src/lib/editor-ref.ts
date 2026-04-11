import type { editor } from 'monaco-editor';

let editorInstance: editor.IStandaloneCodeEditor | null = null;

export function setEditorInstance(inst: editor.IStandaloneCodeEditor | null) {
  editorInstance = inst;
}

export function getEditorInstance() {
  return editorInstance;
}

export function insertTextAtCursor(text: string) {
  const ed = editorInstance;
  if (!ed) return;
  const selection = ed.getSelection();
  if (!selection) return;
  ed.executeEdits('toolbar', [
    { range: selection, text, forceMoveMarkers: true },
  ]);
  ed.focus();
}
