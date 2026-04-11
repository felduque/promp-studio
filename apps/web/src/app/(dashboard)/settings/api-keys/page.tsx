'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-3xl">
      <div>
        <h1 className="font-bold text-2xl sm:text-3xl tracking-tight">API Keys</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Configura las API keys de tus proveedores de LLM
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Agregar API Key
          </CardTitle>
          <CardDescription>
            Tus keys se almacenan cifradas y nunca se muestran completas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="gap-4 grid sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select
                value={provider}
                onValueChange={(val) => val && setProvider(val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etiqueta (opcional)</Label>
              <Input
                placeholder="Mi key de producción"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="top-1/2 right-1 absolute w-7 h-7 -translate-y-1/2"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
            {saving ? 'Guardando...' : 'Guardar API Key'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Keys guardadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : keys.length === 0 ? (
            <p className="py-6 text-muted-foreground text-sm text-center">
              No tienes API keys configuradas aún.
            </p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex justify-between items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                    <Badge>{key.provider}</Badge>
                    <span className="text-sm truncate">{key.label}</span>
                    <span className="hidden sm:inline text-muted-foreground text-xs">
                      {new Date(key.createdAt).toLocaleDateString('es')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
