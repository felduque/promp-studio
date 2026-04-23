'use client';

import { useState } from 'react';
import { Play, Loader2, AlertTriangle, Save, Eye } from 'lucide-react';

interface ExecuteButtonProps {
  executing: boolean;
  disabled: boolean;
  selectedCount: number;
  isDirty?: boolean;
  hasSavedVersion?: boolean;
  onExecutePreview: () => void;
  onExecuteSaved: () => void;
  onSaveAndExecute?: () => void;
}

export function ExecuteButton({
  executing,
  disabled,
  isDirty,
  onExecutePreview,
  onExecuteSaved,
  onSaveAndExecute,
}: ExecuteButtonProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleMainClick = () => {
    if (isDirty) {
      setShowOptions(true);
    } else {
      onExecuteSaved();
    }
  };

  if (showOptions && isDirty) {
    return (
      <div className="space-y-2">
        <p className="text-[#c7c4d7] text-sm">¿Cómo quieres ejecutar?</p>
        <button
          onClick={() => { onExecutePreview(); setShowOptions(false); }}
          disabled={executing}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#171f33] hover:bg-[#2d3449]/50 text-left transition-colors"
        >
          <Eye className="w-4 h-4 text-[#c0c1ff]" />
          <div>
            <div className="text-sm font-medium text-[#dae2fd]">Preview</div>
            <div className="text-xs text-[#464554]">Ejecutar sin guardar</div>
          </div>
        </button>
        {onSaveAndExecute && (
          <button
            onClick={() => { onSaveAndExecute(); setShowOptions(false); }}
            disabled={executing}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#171f33] hover:bg-[#2d3449]/50 text-left transition-colors"
          >
            <Save className="w-4 h-4 text-[#c0c1ff]" />
            <div>
              <div className="text-sm font-medium text-[#dae2fd]">Guardar y ejecutar</div>
              <div className="text-xs text-[#464554]">Nueva versión + ejecución</div>
            </div>
          </button>
        )}
        <button
          onClick={() => setShowOptions(false)}
          className="w-full text-center text-xs text-[#464554] hover:text-[#c7c4d7] py-2 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isDirty && (
        <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-2 rounded text-amber-500 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Cambios sin guardar</span>
        </div>
      )}
      <button
        className="w-full bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] font-[var(--font-space-grotesk)] font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(192,193,255,0.15)] hover:shadow-[0_0_30px_rgba(192,193,255,0.3)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        onClick={handleMainClick}
        disabled={executing || disabled}
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        {executing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin relative z-10" />
            <span className="relative z-10">Ejecutando...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Ejecutar Prompt</span>
          </>
        )}
      </button>
    </div>
  );
}
