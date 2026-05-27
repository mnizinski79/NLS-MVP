import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../models/room.model';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.css']
})
export class RoomCardComponent {
  @Input() room!: Room;

  /** The first two amenities shown inline; the rest hidden behind "X more" */
  get previewAmenities(): string[] {
    return this.room.amenities.slice(0, 2);
  }

  get remainingCount(): number {
    return Math.max(0, this.room.amenities.length - 2);
  }
}
