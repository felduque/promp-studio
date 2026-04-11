'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  selectedCount,
  isDirty,
  hasSavedVersion,
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

  return (
    <div className="space-y-3 p-3 border-b">
      {isDirty && (
        <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-2 rounded-md text-amber-600 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Hay cambios sin guardar</span>
        </div>
      )}

      {showOptions && isDirty ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            ¿Cómo quieres ejecutar?
          </p>
          <div className="gap-2 grid grid-cols-1">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                onExecutePreview();
                setShowOptions(false);
              }}
              disabled={executing}
              className="justify-start"
            >
              <Eye className="mr-2 w-4 h-4" />
              <div className="text-left">
                <div className="font-medium text-xs">Preview</div>
                <div className="opacity-80 text-[10px]">Ejecutar sin guardar</div>
              </div>
            </Button>
            {onSaveAndExecute && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  onSaveAndExecute();
                  setShowOptions(false);
                }}
                disabled={executing}
                className="justify-start"
              >
                <Save className="mr-2 w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium text-xs">Guardar y ejecutar</div>
                  <div className="opacity-80 text-[10px]">Nueva versión + ejecución</div>
                </div>
              </Button>
            )}
            {hasSavedVersion && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onExecuteSaved();
                  setShowOptions(false);
                }}
                disabled={executing || disabled}
                className="justify-start"
              >
                <Play className="mr-2 w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium text-xs">Versión guardada</div>
                  <div className="opacity-80 text-[10px]">Ignorar cambios actuales</div>
                </div>
              </Button>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowOptions(false)}
            className="w-full text-xs"
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          className="w-full"
          onClick={handleMainClick}
          disabled={executing || disabled}
        >
          {executing ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Ejecutando...
            </>
          ) : (
            <>
              <Play className="mr-2 w-4 h-4" />
              Ejecutar ({selectedCount} modelo{selectedCount !== 1 ? 's' : ''})
            </>
          )}
        </Button>
      )}
    </div>
  );
}
