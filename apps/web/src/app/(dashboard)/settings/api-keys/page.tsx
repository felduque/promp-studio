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
import { KeyRound, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  provider: string;
  label: string;
  createdAt: string;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'groq', label: 'Groq' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'mistral', label: 'Mistral' },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const fetchKeys = async () => {
    try {
      const { data } = await apiClient.get('/api-keys');
      setKeys(data);
    } catch (err) {
      console.error('Error fetching keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api-keys', {
        provider,
        key: apiKey,
        label: label || `${provider} key`,
      });
      setApiKey('');
      setLabel('');
      fetchKeys();
    } catch (err) {
      console.error('Error saving key:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta API key?')) return;
    try {
      await apiClient.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch (err) {
      console.error('Error deleting key:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-ps-bg-base overflow-y-auto ps-editor-scroll">
      <header className="px-8 py-6 shrink-0">
        <h1 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-2xl tracking-tight">
          API Keys
        </h1>
        <p className="text-ps-text-muted text-sm mt-1">
          Configura las API keys de tus proveedores de LLM
        </p>
      </header>

      <div className="flex-1 px-8 pb-8 space-y-6 max-w-3xl">
        {/* Add Key */}
        <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-5 h-5 text-ps-accent" />
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-base">
              Agregar API Key
            </h2>
          </div>
          <p className="text-ps-text-muted text-sm mb-5">
            Tus keys se almacenan cifradas y nunca se muestran completas.
          </p>
          <div className="space-y-4">
            <div className="gap-4 grid sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">Proveedor</Label>
                <Select value={provider} onValueChange={(val) => val && setProvider(val)}>
                  <SelectTrigger className="bg-ps-bg-deep border-ps-border text-ps-text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-ps-bg-surface border-ps-border">
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">Etiqueta (opcional)</Label>
                <Input
                  placeholder="Mi key de producción"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="bg-ps-bg-deep border-ps-border text-ps-text-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-ps-bg-deep border-ps-border text-ps-text-primary pr-10"
                />
                <button
                  className="top-1/2 right-2 absolute p-1 rounded hover:bg-ps-bg-elevated text-ps-text-muted hover:text-ps-text-primary transition-colors -translate-y-1/2"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button variant="gradient" onClick={handleSave} disabled={saving || !apiKey.trim()}>
              {saving ? 'Guardando...' : 'Guardar API Key'}
            </Button>
          </div>
        </div>

        {/* Saved Keys */}
        <div className="bg-ps-bg-surface border border-ps-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-ps-accent" />
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-base">
              Keys guardadas
            </h2>
          </div>
          {loading ? (
            <p className="text-ps-text-muted text-sm">Cargando...</p>
          ) : keys.length === 0 ? (
            <p className="py-6 text-ps-text-muted text-sm text-center">
              No tienes API keys configuradas aún.
            </p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex justify-between items-center gap-2 p-3 rounded-lg bg-ps-bg-elevated hover:bg-ps-border/30 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                    <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-ps-accent/10 text-ps-accent">
                      {key.provider}
                    </span>
                    <span className="text-sm text-ps-text-primary truncate">{key.label}</span>
                    <span className="hidden sm:inline text-ps-text-muted text-xs">
                      {new Date(key.createdAt).toLocaleDateString('es')}
                    </span>
                  </div>
                  <button
                    className="p-1.5 rounded hover:bg-ps-bg-deep text-ps-text-muted hover:text-ps-error transition-colors shrink-0"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
