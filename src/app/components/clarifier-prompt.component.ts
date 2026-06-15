import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickReply } from '../models/search-strategy.model';

@Component({
  selector: 'app-clarifier-prompt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clarifier-prompt.component.html',
  styleUrls: ['./clarifier-prompt.component.css'],
})
export class ClarifierPromptComponent {
  @Input() text = '';
  @Input() chips: QuickReply[] = [];
  @Output() chosen = new EventEmitter<QuickReply>();
}
