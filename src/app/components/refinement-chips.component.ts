import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RefinementChipVM } from '../services/match.service';

@Component({
  selector: 'app-refinement-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refinement-chips.component.html',
  styleUrls: ['./refinement-chips.component.css'],
})
export class RefinementChipsComponent {
  @Input() chips: RefinementChipVM[] = [];
  @Output() picked = new EventEmitter<RefinementChipVM>();
}
