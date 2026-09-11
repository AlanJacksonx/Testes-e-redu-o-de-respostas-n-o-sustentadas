import { Component } from '@angular/core';
import { ChatStreamComponent } from './ia/chat-stream.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatStreamComponent],
  templateUrl: './app.html',
})
export class App {}