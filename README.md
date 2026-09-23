# Relatório Técnico-Acadêmico: Avaliação e Mitigação de Respostas Não Sustentadas em Modelos de Linguagem

**Discente:** Alan Jackson Silva de Medeiros  
**Curso:** Tecnologia em Sistemas para Internet (TSI)  
**Instituição:** Instituto Federal do Rio Grande do Norte (IFRN) - Campus Currais Novos  
**Ambiente de Desenvolvimento:** Docker / Arch Linux / Ollama (`llama3.2:latest`)  

---

## 1. Introdução e Arquitetura do Sistema
O presente projeto documenta a implementação de um sistema baseado em Inteligência Artificial Generativa local, estruturado sob uma arquitetura de microsserviços. A solução é composta por uma interface de usuário desenvolvida em Angular, que consome dados em fluxo contínuo (*streaming* via NDJSON), e uma API construída em NestJS. 

O foco analítico desta entrega (Atividade 11) reside no **módulo de classificação de chamados de suporte técnico**, cujo propósito é avaliar a resiliência do Modelo de Linguagem de Grande Escala (LLM) diante de diretrizes estritas de categorização, mitigando o fenômeno de respostas não sustentadas (alucinações).

---

## 2. Metodologia do Experimento
Para o teste de classificação, o modelo foi instruído a restringir sua saída a um conjunto fechado de cinco categorias taxonômicas: `ACESSO`, `FINANCEIRO`, `MATRICULA`, `DOCUMENTOS` e `OUTROS`.

Foi desenvolvida uma suíte de testes automatizados (`src/chamados/avaliacao`) composta por 12 cenários de validação, estratificados nas seguintes classes:
*   **Casos Normais:** Requisições explícitas com correspondência direta à categoria.
*   **Casos de Fronteira:** Ambiguidade e estruturas de negação explícita.
*   **Casos de Ausência:** Falta de contexto mínimo para categorização (esperado fallback para `OUTROS`).
*   **Casos Adversariais:** Tentativas de evasão das regras de prompt (*prompt injection*).

---

## 3. Análise de Resultados e Evolução de Métricas

O experimento foi conduzido em duas fases arquitetônicas para evidenciar o impacto de estratégias de programação defensiva.

### 3.1. Fase 1: Validação Estrita (Sem Tratamento de Ruído)
Nesta etapa inicial, o *backend* validou a saída do LLM exigindo correspondência estrita (tipoagem forte via `isChamadoCategoria` em TypeScript).
*   **Acurácia Global:** 41,6%
*   **Conformidade de Formato:** 41,6%
*   **Discussão:** Observou-se uma alta taxa de indisciplina na formatação por parte do modelo. A geração incluía sinais de pontuação não solicitados (ex.: `"ACESSO."`) e textos conversacionais, violando o contrato da API e resultando em exceções do tipo `BadGatewayException`.

### 3.2. Fase 2: Implementação de Sanitização Extrativa
Para mitigar a falha de formatação, desenvolveu-se um mecanismo de extração léxica no `ChamadosService`, responsável por varrer a *string* bruta retornada pelo LLM e isolar as palavras-chave pertencentes ao domínio válido.
*   **Acurácia Global:** 50,0%
*   **Conformidade de Formato:** 83,3%
*   **Discussão:** A aplicação da sanitização demonstrou eficácia significativa, dobrando o índice de conformidade estrutural. A margem de erro residual (16,7%) foi atribuída a alucinações de natureza ortográfica (ex.: a geração do vocábulo `"ACCESSO"`, com grafia divergente do léxico padrão em língua portuguesa), o que impossibilitou a extração determinística.

---

## 4. Desafios Semânticos e Engenharia de Prompt

Na tentativa de otimizar o discernimento lógico do modelo, foram estabelecidas oito diretrizes rígidas no *prompt* de sistema. Destaca-se a formulação da Regra 8, concebida para evitar viés de ancoragem em termos negados:
> *"Regra 8: Se o usuário estiver negando uma intenção (ex: 'não quero X, quero Y'), classifique pelo Y."*

Não obstante a instrução explícita, constatou-se que o modelo local (`llama3.2:latest`) apresenta limitações cognitivas no processamento de negações cruzadas. No caso de teste fronteiriço *"Não quero trancar a matrícula, só questionar o valor"*, a inteligência artificial ancorou-se no substantivo "matrícula", classificando o texto erroneamente na categoria `MATRICULA` e suprimindo o intento central da solicitação (`FINANCEIRO`). 

---

## 5. Conclusões
Os dados obtidos indicam que a dependência exclusiva de engenharia de *prompt* é insuficiente para garantir a estabilidade de LLMs de menor escala em ambientes de produção. A conformidade do sistema e a redução de respostas não sustentadas exigem a acoplagem obrigatória de camadas de programação defensiva no lado do servidor (*backend*), garantindo que a higienização de *outputs* atue como barreira arquitetônica contra alucinações.

---

## 6. Instruções de Implantação e Reprodução

As etapas a seguir descrevem o procedimento para reproduzir o ambiente de testes e validação:

**I. Orquestração do Ambiente (Containers)**
```bash
docker compose up -d --build
