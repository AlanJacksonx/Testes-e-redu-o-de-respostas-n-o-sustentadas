import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import { MODELO_PROVIDER, type ModeloProvider } from '../ia/providers/modelo.provider';
import { CHAMADO_CATEGORIAS, isChamadoCategoria, type ChamadoCategoria } from './chamado-categoria';
import { buildClassificacaoPrompt } from './classificacao.prompt';

export interface ClassificacaoResultado {
  texto: string;
  categoria: ChamadoCategoria;
  modelo: string;
}

@Injectable()
export class ChamadosService {
  constructor(@Inject(MODELO_PROVIDER) private readonly modelo: ModeloProvider) {}

  async classificar(textoOriginal: string): Promise<ClassificacaoResultado> {
    const texto = textoOriginal.trim();
    const prompt = buildClassificacaoPrompt(texto);
    const resultado = await this.modelo.gerar({ mensagem: prompt });
    
    // Sanitização: Procura a categoria válida dentro da string bruta retornada pela IA
    const respostaBruta = resultado.resposta.toUpperCase();
    const categoriaExtraida = CHAMADO_CATEGORIAS.find(cat => respostaBruta.includes(cat));

    if (!categoriaExtraida) {
      throw new BadGatewayException(`O modelo retornou uma categoria inválida: ${resultado.resposta}`);
    }

    return { texto, categoria: categoriaExtraida, modelo: resultado.modelo };
  }
}
