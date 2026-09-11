export interface GerarRespostaInput { mensagem: string; }
export interface GerarRespostaOutput { resposta: string; modelo: string; tokensEntrada?: number; tokensSaida?: number; }
export interface GerarStreamInput { mensagem: string; signal?: AbortSignal; }

export interface ModeloProvider {
  gerar(input: GerarRespostaInput): Promise<GerarRespostaOutput>;
  gerarStream(input: GerarStreamInput): AsyncIterable<string>;
}
export const MODELO_PROVIDER = Symbol('MODELO_PROVIDER');
