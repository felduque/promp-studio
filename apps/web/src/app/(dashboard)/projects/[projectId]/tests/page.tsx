'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FlaskConical,
  X,
  Clock,
} from 'lucide-react';

interface Assertion {
  type: string;
  value: string;
}

interface TestCase {
  id: string;
  name: string;
  promptId: string;
  variables: Record<string, string>;
  expectedOutput: string | null;
  assertions: Assertion[];
  runs?: TestRun[];
  createdAt: string;
}

interface AssertionResult {
  type: string;
  value: string;
  passed: boolean;
}

interface TestRun {
  id: string;
  status: 'passed' | 'failed' | 'error';
  actualOutput: string | null;
  assertionResults: AssertionResult[];
  latencyMs: number;
  model: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface Prompt {
  id: string;
  name: string;
  currentVersionId: string | null;
  defaultModel: string | null;
}

const ASSERTION_TYPES = [
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'validJSON', label: 'Valid JSON' },
  { value: 'regex', label: 'Regex Match' },
];

export default function TestsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);

  // Create panel state
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVars, setNewVars] = useState('{\n  "user_name": "Alice",\n  "issue": "billing"\n}');
  const [newAssertions, setNewAssertions] = useState<Assertion[]>([
    { type: 'contains', value: '' },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get<Prompt[]>(`/prompts?projectId=${projectId}`);
        setPrompts(data);
        if (data.length > 0) setSelectedPrompt(data[0].id);
      } catch { /* error */ }
    })();
  }, [projectId]);

  const loadTestCases = useCallback(async () => {
    if (!selectedPrompt) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<TestCase[]>(`/test-cases/prompt/${selectedPrompt}`);
      setTestCases(data);
    } catch { /* error */ } finally {
      setLoading(false);
    }
  }, [selectedPrompt]);

  useEffect(() => { loadTestCases(); }, [loadTestCases]);

  const handleCreate = async () => {
    try {
      let variables: Record<string, string> = {};
      try { variables = JSON.parse(newVars); } catch { /* keep empty */ }
      await apiClient.post('/test-cases', {
        name: newName,
        promptId: selectedPrompt,
        variables,
        assertions: newAssertions.filter(a => a.value.trim()),
      });
      setShowCreatePanel(false);
      setNewName('');
      setNewVars('{\n  "user_name": "Alice",\n  "issue": "billing"\n}');
      setNewAssertions([{ type: 'contains', value: '' }]);
      loadTestCases();
    } catch { /* error */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/test-cases/${id}`);
      loadTestCases();
    } catch { /* error */ }
  };

  const handleRun = async (id: string) => {
    setRunning(id);
    try {
      const prompt = prompts.find(p => p.id === selectedPrompt);
      const modelParam = prompt?.defaultModel ? `?model=${prompt.defaultModel}` : '';
      await apiClient.post(`/test-cases/${id}/run${modelParam}`);
      loadTestCases();
    } catch { /* error */ } finally { setRunning(null); }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      const prompt = prompts.find(p => p.id === selectedPrompt);
      const modelParam = prompt?.defaultModel ? `?model=${prompt.defaultModel}` : '';
      await apiClient.post(`/test-cases/prompt/${selectedPrompt}/run-all${modelParam}`);
      loadTestCases();
    } catch { /* error */ } finally { setRunningAll(false); }
  };

  const addAssertion = () => {
    setNewAssertions([...newAssertions, { type: 'contains', value: '' }]);
  };

  const updateAssertion = (index: number, field: 'type' | 'value', val: string) => {
    const updated = [...newAssertions];
    updated[index] = { ...updated[index], [field]: val };
    setNewAssertions(updated);
  };

  const removeAssertion = (index: number) => {
    setNewAssertions(newAssertions.filter((_, i) => i !== index));
  };

  const formatVars = () => {
    try {
      const parsed = JSON.parse(newVars);
      setNewVars(JSON.stringify(parsed, null, 2));
    } catch { /* invalid json */ }
  };

  // Stats
  const totalTests = testCases.length;
  const passedTests = testCases.filter(tc => tc.runs?.[0]?.status === 'passed').length;
  const failedTests = testCases.filter(tc => tc.runs?.[0]?.status === 'failed').length;

  const selectedPromptData = prompts.find(p => p.id === selectedPrompt);

  return (
    <div className="flex h-full bg-ps-bg-base">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 bg-ps-bg-deep border-b border-ps-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-2xl tracking-tight">
                Testing Suite
              </h1>
              <p className="text-ps-text-muted text-sm mt-1">
                Valida tus prompts con test cases y assertions automatizadas
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Target Prompt Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-ps-text-muted">Target Prompt</span>
                <Select value={selectedPrompt} onValueChange={(v) => v && setSelectedPrompt(v)}>
                  <SelectTrigger className="w-64 bg-ps-bg-surface border-ps-border text-ps-text-primary">
                    <SelectValue placeholder="Selecciona un prompt" />
                  </SelectTrigger>
                  <SelectContent className="bg-ps-bg-surface border-ps-border">
                    {prompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          <Button variant="gradient" size="lg" onClick={handleRunAll} disabled={runningAll || !selectedPrompt || testCases.length === 0}>
                <Play className="w-3.5 h-3.5" />
                {runningAll ? 'Ejecutando...' : 'Execute All'}
              </Button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-ps-text-muted text-sm">{totalTests}</span>
              <span className="text-ps-text-muted text-xs uppercase tracking-wider">Total Tests</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ps-success text-sm font-medium">{passedTests}</span>
              <span className="text-ps-text-muted text-xs uppercase tracking-wider">Passed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ps-error text-sm font-medium">{failedTests}</span>
              <span className="text-ps-text-muted text-xs uppercase tracking-wider">Failed</span>
            </div>
          </div>
        </header>

        {/* Test Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 ps-editor-scroll">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="border-4 border-ps-accent border-t-transparent rounded-full w-8 h-8 animate-spin" />
            </div>
          ) : testCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FlaskConical className="w-12 h-12 text-ps-text-muted/30 mb-3" />
              <p className="text-ps-text-muted text-sm">No hay test cases para este prompt</p>
              <button
                onClick={() => setShowCreatePanel(true)}
                className="mt-4 text-ps-accent text-sm hover:text-ps-accent-light transition-colors"
              >
                Crear primer test →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {testCases.map((tc) => {
                const lastRun = tc.runs?.[0];
                const isPassed = lastRun?.status === 'passed';
                const isFailed = lastRun?.status === 'failed';

                return (
                  <div
                    key={tc.id}
                    className={`group relative rounded-lg border p-5 transition-all hover:shadow-lg ${
                      isPassed
                        ? 'bg-ps-bg-surface border-ps-success/20 hover:border-ps-success/40'
                        : isFailed
                        ? 'bg-ps-bg-surface border-ps-error/20 hover:border-ps-error/40'
                        : 'bg-ps-bg-surface border-ps-border-subtle hover:border-ps-border'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-ps-text-primary text-sm">{tc.name}</h3>
                      <div className="flex items-center gap-2">
                        {lastRun && (
                          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            isPassed
                              ? 'bg-ps-success/10 text-ps-success'
                              : isFailed
                              ? 'bg-ps-error/10 text-ps-error'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {lastRun.status === 'passed' ? 'PASS' : lastRun.status === 'failed' ? 'FAIL' : 'ERROR'}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRun(tc.id)}
                            disabled={running === tc.id}
                            className="p-1.5 rounded hover:bg-ps-bg-elevated text-ps-text-muted hover:text-ps-accent transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tc.id)}
                            className="p-1.5 rounded hover:bg-ps-bg-elevated text-ps-text-muted hover:text-ps-error transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Variables */}
                    <div className="mb-3">
                      <pre className="bg-ps-bg-deep rounded p-3 text-xs font-mono text-ps-text-secondary overflow-x-auto">
                        {JSON.stringify(tc.variables, null, 2)}
                      </pre>
                    </div>

                    {/* Assertions */}
                    {tc.assertions.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {tc.assertions.map((a, i) => {
                          const result = lastRun?.assertionResults?.[i];
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {result ? (
                                result.passed ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-ps-success shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-ps-error shrink-0" />
                                )
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-ps-text-muted/30 shrink-0" />
                              )}
                              <span className="text-ps-text-muted capitalize">{a.type}:</span>
                              <span className="text-ps-text-secondary font-mono truncate">"{a.value}"</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Error message */}
                    {lastRun?.errorMessage && (
                      <div className="bg-ps-error/10 border border-ps-error/20 rounded p-2.5 text-xs text-ps-error mb-3">
                        {lastRun.errorMessage}
                      </div>
                    )}

                    {/* Timestamp */}
                    {lastRun && (
                      <div className="flex items-center gap-1.5 text-ps-text-muted text-xs">
                        <Clock className="w-3 h-3" />
                        Last run: {getTimeAgo(lastRun.createdAt)}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add New Test Card */}
              <button
                onClick={() => setShowCreatePanel(true)}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-ps-border hover:border-ps-accent/40 p-8 transition-all hover:bg-ps-bg-surface/50 group"
              >
                <Plus className="w-8 h-8 text-ps-text-muted group-hover:text-ps-accent transition-colors mb-2" />
                <span className="text-ps-text-muted group-hover:text-ps-accent text-sm transition-colors">
                  Nuevo Test
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create New Test Panel (Right Side) */}
      {showCreatePanel && (
        <div className="w-[380px] shrink-0 bg-ps-bg-surface border-l border-ps-border flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-ps-border">
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-ps-text-primary text-lg">
              Create New Test
            </h2>
            <button
              onClick={() => setShowCreatePanel(false)}
              className="p-1.5 rounded hover:bg-ps-bg-elevated text-ps-text-muted hover:text-ps-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 ps-editor-scroll">
            {/* Test Name */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">
                Test Name
              </Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Standard Greeting"
                className="bg-ps-bg-deep border-ps-border text-ps-text-primary"
              />
            </div>

            {/* Inject Variables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">
                  Inject Variables
                </Label>
                <button
                  onClick={formatVars}
                  className="text-xs text-ps-accent hover:text-ps-accent-light transition-colors"
                >
                  Format
                </button>
              </div>
              <Textarea
                value={newVars}
                onChange={(e) => setNewVars(e.target.value)}
                rows={5}
                className="font-mono text-sm bg-ps-bg-deep border-ps-border text-ps-text-primary resize-none"
              />
            </div>

            {/* Assertions Logic */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-ps-text-muted font-normal">
                Assertions Logic
              </Label>
              <div className="space-y-2">
                {newAssertions.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={a.type}
                      onValueChange={(v) => v && updateAssertion(i, 'type', v)}
                    >
                      <SelectTrigger className="w-36 bg-ps-bg-deep border-ps-border text-ps-text-primary text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-ps-bg-surface border-ps-border">
                        {ASSERTION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={a.value}
                      onChange={(e) => updateAssertion(i, 'value', e.target.value)}
                      placeholder="Value..."
                      className="flex-1 bg-ps-bg-deep border-ps-border text-ps-text-primary text-xs"
                    />
                    <button
                      onClick={() => removeAssertion(i)}
                      className="p-1.5 rounded hover:bg-ps-bg-elevated text-ps-text-muted hover:text-ps-error transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addAssertion}
                className="flex items-center gap-1.5 text-ps-accent text-xs hover:text-ps-accent-light transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Condition
              </button>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="flex items-center gap-3 px-6 py-4 border-t border-ps-border">
            <Button variant="ghost-ps" className="flex-1" onClick={() => setShowCreatePanel(false)}>
              Cancel
            </Button>
            <Button variant="gradient" className="flex-1" onClick={handleCreate} disabled={!newName.trim()}>
              Save Test
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
