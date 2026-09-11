import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IaStreamService } from './ia-stream.service';

@Component({
  selector: 'app-chat-stream',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat-stream.component.html',
})
export class ChatStreamComponent {
  private readonly ia = inject(IaStreamService);
  private abortController?: AbortController;
  mensagem = '';
  resposta = signal('');
  status = signal<'idle' | 'loading' | 'done' | 'error' | 'cancelled'>('idle');

  async enviar(): Promise<void> {
    const mensagem = this.mensagem.trim();
    if (!mensagem || this.status() === 'loading') return;
    this.abortController = new AbortController();
    this.resposta.set('');
    this.status.set('loading');
    try {
      for await (const event of this.ia.responder(mensagem, this.abortController.signal)) {
        if (event.type === 'delta' && event.content) this.resposta.update((c) => c + event.content);
        if (event.type === 'error') throw new Error(event.message);
      }
      this.status.set('done');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') this.status.set('cancelled');
      else this.status.set('error');
    } finally {
      this.abortController = undefined;
    }
  }
  cancelar(): void { this.abortController?.abort(); }
}
