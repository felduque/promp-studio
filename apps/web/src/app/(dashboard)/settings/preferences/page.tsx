'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Save, Palette, Type, Thermometer } from 'lucide-react';

interface Preferences {
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultTopP: number;
  theme: 'light' | 'dark' | 'system';
  editorFontSize: number;
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences>({
    defaultTemperature: 0.7,
    defaultMaxTokens: 1024,
    defaultTopP: 1.0,
    theme: 'system',
    editorFontSize: 14,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get<Preferences>('/preferences');
        setPrefs(data);
      } catch {
        // defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await apiClient.put<Preferences>('/preferences', prefs);
      setPrefs(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-ps-bg-base">
        <div className="border-4 border-ps-accent border-t-transparent rounded-full w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-ps-bg-base overflow-y-auto ps-editor-scroll">
      <header className="px-8 py-6 shrink-0">
        <h1 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-2xl tracking-tight">
          Preferences
        </h1>
        <p className="text-ps-text-muted text-sm mt-1">
          Configura los valores por defecto para tus ejecuciones y editor
        </p>
      </header>

      <div className="flex-1 px-8 pb-8 space-y-6 max-w-2xl">
        {/* Appearance */}
        <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-ps-accent" />
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-base">
              Apariencia
            </h2>
          </div>
          <p className="text-ps-text-muted text-sm mb-5">Personaliza el tema y tamaño de fuente</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">Tema</Label>
              <Select
                value={prefs.theme}
                onValueChange={(v) => setPrefs({ ...prefs, theme: v as any })}
              >
                <SelectTrigger className="bg-ps-bg-deep border-ps-border text-ps-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-ps-bg-surface border-ps-border">
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wider text-ps-text-muted font-normal">
                <Type className="w-4 h-4" />
                Tamaño de fuente del editor: <span className="text-ps-text-primary font-medium">{prefs.editorFontSize}px</span>
              </Label>
              <Slider
                value={[prefs.editorFontSize]}
                onValueChange={([v]) => setPrefs({ ...prefs, editorFontSize: v })}
                min={10}
                max={24}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Default Parameters */}
        <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-5 h-5 text-ps-accent" />
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-base">
              Parámetros por Defecto
            </h2>
          </div>
          <p className="text-ps-text-muted text-sm mb-5">Valores iniciales al ejecutar un prompt</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">
                Temperature: <span className="text-ps-text-primary font-medium">{prefs.defaultTemperature}</span>
              </Label>
              <Slider
                value={[prefs.defaultTemperature]}
                onValueChange={([v]) => setPrefs({ ...prefs, defaultTemperature: v })}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">Max Tokens</Label>
              <Input
                type="number"
                value={prefs.defaultMaxTokens}
                onChange={(e) =>
                  setPrefs({ ...prefs, defaultMaxTokens: parseInt(e.target.value, 10) || 1024 })
                }
                min={1}
                max={128000}
                className="bg-ps-bg-deep border-ps-border text-ps-text-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">
                Top P: <span className="text-ps-text-primary font-medium">{prefs.defaultTopP}</span>
              </Label>
              <Slider
                value={[prefs.defaultTopP]}
                onValueChange={([v]) => setPrefs({ ...prefs, defaultTopP: v })}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>
        </div>

        <Button variant="gradient" onClick={handleSave} disabled={saving} className="self-end">
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : saved ? 'Guardado!' : 'Guardar preferencias'}
        </Button>
      </div>
    </div>
  );
}
