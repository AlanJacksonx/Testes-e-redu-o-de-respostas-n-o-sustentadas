import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MODELO_PROVIDER, type ModeloProvider } from './providers/modelo.provider';

@Injectable()
export class IaService {
  constructor(
    @Inject(MODELO_PROVIDER)
    private readonly modelo: ModeloProvider,
  ) {}

  async responder(mensagem: string) {
    const mensagemNormalizada = mensagem.trim();
    if (!mensagemNormalizada) {
      throw new BadRequestException('A mensagem não pode conter apenas espaços');
    }
    return this.modelo.gerar({ mensagem: mensagemNormalizada });
  }

  gerarStream(mensagem: string, signal: AbortSignal): AsyncIterable<string> {
    const mensagemNormalizada = mensagem.trim();
    if (!mensagemNormalizada) {
      throw new BadRequestException('A mensagem não pode conter apenas espaços');
    }
    return this.modelo.gerarStream({
      mensagem: mensagemNormalizada,
      signal,
    });
  }
}
