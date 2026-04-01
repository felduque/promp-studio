import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProviderModel, ProviderType } from '../common/entities';

export interface ExecutionRequest {
  model: ProviderModel;
  apiKey: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  maxTokens: number;
  topP?: number;
}

export interface ExecutionResponse {
  output: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  rawResponse?: any;
}

@Injectable()
export class ModelOrchestratorService {
  constructor(private readonly httpService: HttpService) {}

  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();
    
    switch (request.model.provider) {
      case 'openai':
        return this.executeOpenAI(request, startTime);
      case 'anthropic':
        return this.executeAnthropic(request, startTime);
      case 'groq':
        return this.executeGroq(request, startTime);
      case 'openrouter':
        return this.executeOpenRouter(request, startTime);
      case 'google':
        return this.executeGoogle(request, startTime);
      case 'mistral':
        return this.executeMistral(request, startTime);
      default:
        throw new Error(`Provider ${request.model.provider} not supported`);
    }
  }

  private async executeOpenAI(request: ExecutionRequest, startTime: number): Promise<ExecutionResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: request.model.externalId,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP ?? 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${request.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      ),
    );

    const data = response.data;
    return {
      output: data.choices?.[0]?.message?.content || '',
      tokensIn: data.usage?.prompt_tokens || 0,
      tokensOut: data.usage?.completion_tokens || 0,
      latencyMs: Date.now() - startTime,
      rawResponse: data,
    };
  }

  private async executeAnthropic(request: ExecutionRequest, startTime: number): Promise<ExecutionResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: request.model.externalId,
          messages: request.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          top_p: request.topP ?? 1,
        },
        {
          headers: {
            'x-api-key': request.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      ),
    );

    const data = response.data;
    return {
      output: data.content?.[0]?.text || '',
      tokensIn: data.usage?.input_tokens || 0,
      tokensOut: data.usage?.output_tokens || 0,
      latencyMs: Date.now() - startTime,
      rawResponse: data,
    };
  }

  private async executeGroq(request: ExecutionRequest, startTime: number): Promise<ExecutionResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: request.model.externalId,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP ?? 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${request.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      ),
    );

    const data = response.data;
    return {
      output: data.choices?.[0]?.message?.content || '',
      tokensIn: data.usage?.prompt_tokens || 0,
      tokensOut: data.usage?.completion_tokens || 0,
      latencyMs: Date.now() - startTime,
      rawResponse: data,
    };
  }

  private async executeOpenRouter(request: ExecutionRequest, startTime: number): Promise<ExecutionResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: request.model.externalId,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP ?? 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${request.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://promptstudio.app',
            'X-Title': 'Prompt Studio',
          },
          timeout: 120000,
        },
      ),
    );

    const data = response.data;
    return {
      output: data.choices?.[0]?.message?.content || '',
      tokensIn: data.usage?.prompt_tokens || 0,
      tokensOut: data.usage?.completion_tokens || 0,
      latencyMs: Date.now() - startTime,
      rawResponse: data,
    };
  }

  private async executeGoogle(request: ExecutionRequest, startTime: number): Promise<ExecutionResponse> {
    // Google Gemini API
    const response = await firstValueFrom(
      this.httpService.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${request.model.externalId}:generateContent`,
        {
          contents: request.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: request.temperature,
            maxOutputTokens: request.maxTokens,
            topP: request.topP ?? 1,
          },
        },
        {
          headers: {
            'x-goog-api-key': request.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      ),
    );

    const data = response.data;
    return {
      output: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      tokensIn: data.usageMetadata?.promptTokenCount || 0,
      tokensOut: data.usageMetadata?.candidatesTokenCount || 0,
      latencyMs: Date.now() - startTime,
      rawResponse: data,
    };
  }

  private async executeMistral(request: ExecutionRequest, startTime: number): Promise<ExecutionResponse> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: request.model.externalId,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP ?? 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${request.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      ),
    );

    const data = response.data;
    return {
      output: data.choices?.[0]?.message?.content || '',
      tokensIn: data.usage?.prompt_tokens || 0,
      tokensOut: data.usage?.completion_tokens || 0,
      latencyMs: Date.now() - startTime,
      rawResponse: data,
    };
  }
}
