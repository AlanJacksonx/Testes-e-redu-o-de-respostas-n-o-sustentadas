import { Body, Controller, HttpCode, Logger, Post, Res, ServiceUnavailableException } from '@nestjs/common';
import type { Response } from 'express';
import { ResponderDto } from './dto/responder.dto';
import { IaService } from './ia.service';

@Controller('ia')
export class IaController {
  private readonly logger = new Logger(IaController.name);
  
  constructor(private readonly iaService: IaService) {}

  @Post('responder')
  async responder(@Body() dto: ResponderDto) {
    const res = await this.iaService.responder(dto.mensagem);
    return { resposta: res.resposta, modelo: res.modelo, uso: { tokensEntrada: res.tokensEntrada, tokensSaida: res.tokensSaida } };
  }

  @Post('responder-stream')
  @HttpCode(200)
  async responderStream(@Body() dto: ResponderDto, @Res() response: Response): Promise<void> {
    const abortController = new AbortController();
    response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('X-Accel-Buffering', 'no');

    response.on('close', () => {
      if (!response.writableEnded) abortController.abort();
    });

    try {
      const stream = this.iaService.gerarStream(dto.mensagem, abortController.signal);
      for await (const content of stream) {
        response.write(`${JSON.stringify({ type: 'delta', content })}\n`);
      }
      response.write(`${JSON.stringify({ type: 'done' })}\n`);
      response.end();
    } catch (error) {
      this.logger.error('Falha na comunicação com a IA', error);
      if (response.headersSent) {
        response.write(`${JSON.stringify({ type: 'error', message: 'A geração foi interrompida' })}\n`);
        response.end();
        return;
      }
      // Limpa os cabeçalhos para o NestJS enviar o erro JSON nativo sem gerar Warnings
      response.removeHeader('Content-Type');
      response.removeHeader('Cache-Control');
      response.removeHeader('X-Accel-Buffering');
      throw new ServiceUnavailableException('Não foi possível iniciar a geração');
    }
  }
}
