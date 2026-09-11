import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MODELO_PROVIDER, type GerarRespostaOutput, type ModeloProvider } from './providers/modelo.provider';

@Injectable()
export class IaService {
  constructor(@Inject(MODELO_PROVIDER) private readonly modelo: ModeloProvider) {}

  responder(mensagem: string): Promise<GerarRespostaOutput> {
    const msg = mensagem.trim();
    if (!msg) throw new BadRequestException('Mensagem invalida');
    return this.modelo.gerar({ mensagem: msg });
  }

  gerarStream(mensagem: string, signal: AbortSignal): AsyncIterable<string> {
    const msg = mensagem.trim();
    if (!msg) throw new BadRequestException('A mensagem não pode conter apenas espaços');
    return this.modelo.gerarStream({ mensagem: msg, signal });
  }
}
