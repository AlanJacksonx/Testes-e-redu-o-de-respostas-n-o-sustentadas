import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  mensagem = '';
  resposta = '';
  status: 'idle' | 'streaming' | 'error' = 'idle';
  private abortController: AbortController | null = null;

  async enviar() {
    if (!this.mensagem.trim()) return;

    this.resposta = '';
    this.status = 'streaming';
    this.abortController = new AbortController();

    try {
      const res = await fetch('http://localhost:3000/ia/responder-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: this.mensagem }),
        signal: this.abortController.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error('Falha na comunicação com o backend');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const linhas = chunk.split('\n').filter((linha) => linha.trim() !== '');
          
          for (const linha of linhas) {
            const data = JSON.parse(linha);
            if (data.type === 'delta' && data.content) {
              this.resposta += data.content;
            }
          }
        }
      }
      this.status = 'idle';
      this.mensagem = ''; // Limpa o input após o envio
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.status = 'idle';
      } else {
        console.error(error);
        this.status = 'error';
      }
    } finally {
      this.abortController = null;
    }
  }

  cancelar() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}