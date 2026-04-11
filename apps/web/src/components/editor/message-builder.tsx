'use client';

import { usePromptStore, type PromptMessage } from '@/lib/stores/prompt-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Bot,
  User,
  Settings,
  MessageSquare,
} from 'lucide-react';

const ROLE_CONFIG = {
  system: {
    label: 'System',
    icon: Settings,
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  user: {
    label: 'User',
    icon: User,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  assistant: {
    label: 'Assistant',
    icon: Bot,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
} as const;

export function MessageBuilder() {
  const { messages, addMessage, updateMessage, removeMessage, reorderMessages } =
    usePromptStore();

  const handleAddMessage = (role: PromptMessage['role'] = 'user') => {
    addMessage({ role, content: '' });
  };

  const handleRoleChange = (index: number, role: string) => {
    const msg = messages[index];
    if (msg) updateMessage(index, { ...msg, role: role as PromptMessage['role'] });
  };

  const handleContentChange = (index: number, content: string) => {
    const msg = messages[index];
    if (msg) updateMessage(index, { ...msg, content });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) reorderMessages(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index < messages.length - 1) reorderMessages(index, index + 1);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Sin mensajes</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Agrega mensajes para construir tu prompt de chat
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => handleAddMessage('system')}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  System
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => handleAddMessage('user')}
                >
                  <User className="w-3 h-3 mr-1" />
                  User
                </Button>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const config = ROLE_CONFIG[msg.role];
              const Icon = config.icon;

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-3 transition-colors ${config.color}`}
                >
                  {/* Message header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <button
                        className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground"
                        title="Reordenar"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-muted-foreground/50 hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === messages.length - 1}
                          className="text-muted-foreground/50 hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <Select
                      value={msg.role}
                      onValueChange={(val) => val && handleRoleChange(index, val)}
                    >
                      <SelectTrigger className="h-6 w-28 text-xs border-0 bg-transparent shadow-none px-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">
                          <div className="flex items-center gap-1.5">
                            <Settings className="w-3 h-3" /> System
                          </div>
                        </SelectItem>
                        <SelectItem value="user">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3" /> User
                          </div>
                        </SelectItem>
                        <SelectItem value="assistant">
                          <div className="flex items-center gap-1.5">
                            <Bot className="w-3 h-3" /> Assistant
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Badge variant="outline" className="text-[10px] px-1.5 ml-auto">
                      #{index + 1}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMessage(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Message content */}
                  <Textarea
                    placeholder={`Escribe el contenido del mensaje ${config.label}...`}
                    value={msg.content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    className="min-h-20 text-sm bg-background/50 border-0 shadow-none resize-none focus-visible:ring-1"
                    rows={3}
                  />
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Add message buttons */}
      {messages.length > 0 && (
        <div className="flex items-center gap-1.5 p-2 border-t bg-muted/20">
          <span className="text-[10px] text-muted-foreground mr-1">Agregar:</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] gap-1"
            onClick={() => handleAddMessage('system')}
          >
            <Settings className="w-3 h-3" />
            System
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] gap-1"
            onClick={() => handleAddMessage('user')}
          >
            <User className="w-3 h-3" />
            User
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] gap-1"
            onClick={() => handleAddMessage('assistant')}
          >
            <Bot className="w-3 h-3" />
            Assistant
          </Button>
        </div>
      )}
    </div>
  );
}
