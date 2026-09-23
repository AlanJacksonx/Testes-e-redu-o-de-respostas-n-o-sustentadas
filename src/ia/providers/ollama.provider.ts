import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ConversarInput,
  GerarRespostaInput,
  GerarRespostaOutput,
  GerarStreamInput,
  ModeloProvider,
} from './modelo.provider';

interface OllamaChatResponse {
  model: string;
  message?: { role: string; content: string };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaStreamChunk {
  message?: { content?: string };
  done: boolean;
  error?: string;
}

function parseOllamaLine(line: string): OllamaStreamChunk | undefined {
  const normalized = line.trim();
  if (!normalized) return undefined;
  const parsed: unknown = JSON.parse(normalized);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new BadGatewayException('Fragmento inválido recebido do modelo');
  }
  return parsed as OllamaStreamChunk;
}

@Injectable()
export class OllamaProvider implements ModeloProvider {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async gerar(input: GerarRespostaInput): Promise<GerarRespostaOutput> {
    const baseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    const model = this.config.getOrThrow<string>('OLLAMA_MODEL', 'llama3.2:latest');
    const timeout = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS') ?? '30000');

    const response = await this.http.axiosRef.post<OllamaChatResponse>(
      `${baseUrl}/api/chat`,
      {
        model,
        messages: [{ role: 'user', content: input.mensagem }],
        stream: false,
      },
      { timeout },
    );

    const content = response.data.message?.content?.trim();
    if (!content) throw new BadGatewayException('Resposta inválida do modelo');

    return {
      resposta: content,
      modelo: response.data.model,
      tokensEntrada: response.data.prompt_eval_count,
      tokensSaida: response.data.eval_count,
    };
  }

  async conversar(input: ConversarInput): Promise<GerarRespostaOutput> {
    const baseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    const model = this.config.getOrThrow<string>('OLLAMA_MODEL', 'llama3.2:latest');
    const timeout = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS') ?? '30000');

    const response = await this.http.axiosRef.post<OllamaChatResponse>(
      `${baseUrl}/api/chat`,
      {
        model,
        messages: input.messages,
        stream: false,
      },
      { timeout },
    );

    const content = response.data.message?.content?.trim();
    if (!content) throw new BadGatewayException('Resposta inválida do modelo');

    return {
      resposta: content,
      modelo: response.data.model,
      tokensEntrada: response.data.prompt_eval_count,
      tokensSaida: response.data.eval_count,
    };
  }

  async *gerarStream(input: GerarStreamInput): AsyncIterable<string> {
    const baseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    const model = this.config.getOrThrow<string>('OLLAMA_MODEL', 'llama3.2:latest');
    const timeout = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS') ?? '30000');

    const response = await this.http.axiosRef.post<NodeJS.ReadableStream>(
      `${baseUrl}/api/chat`,
      {
        model,
        messages: [{ role: 'user', content: input.mensagem }],
        stream: true,
      },
      {
        responseType: 'stream',
        signal: input.signal,
        timeout,
      },
    );

    const decoder = new TextDecoder();
    let buffer = '';

    for await (const bytes of response.data as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(bytes, { stream: true });
      let lineBreak = buffer.indexOf('\n');

      while (lineBreak >= 0) {
        const line = buffer.slice(0, lineBreak);
        buffer = buffer.slice(lineBreak + 1);
        lineBreak = buffer.indexOf('\n');

        const chunk = parseOllamaLine(line);
        if (!chunk) continue;
        if (chunk.error) throw new BadGatewayException(chunk.error);

        const content = chunk.message?.content;
        if (content) yield content;
      }
    }

    buffer += decoder.decode();
    const lastChunk = parseOllamaLine(buffer);
    if (lastChunk?.error) throw new BadGatewayException(lastChunk.error);
    if (lastChunk?.message?.content) yield lastChunk.message.content;
  }
}
