import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hotel } from '../models/hotel.model';
import { Tag } from '../models/tag.model';

@Component({
  selector: 'app-helper-tags',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './helper-tags.component.html',
  styleUrls: ['./helper-tags.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * HelperTagsComponent - Dynamic refinement suggestion pills
 *
 * Generates and displays clickable suggestion tags based on current search results.
 * Tags are dynamically created from:
 * - Top 3 most common amenities in results
 * - Up to 2 unique locations/neighborhoods
 *
 * Features horizontal scrolling for overflow and hides when no results available.
 *
 * @example
 * <app-helper-tags
 *   [hotels]="currentResults"
 *   [visible]="hasResults"
 *   (tagClicked)="handleTagClick($event)">
 * </app-helper-tags>
 */
export class HelperTagsComponent implements OnChanges {
  /** Array of hotels to generate tags from */
  @Input() hotels: Hotel[] = [];

  /** Whether tags should be visible */
  @Input() visible: boolean = false;

  /** Emitted when a tag is clicked, passes the query string */
  @Output() tagClicked = new EventEmitter<string>();

  /** Generated tags for display */
  tags: Tag[] = [];

  /**
   * Regenerate tags when hotels input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hotels'] && this.hotels.length > 0) {
      this.generateTags();
    }
  }

  /**
   * Generate helper tags from current hotel results
   * Creates amenity tags (top 3) and location tags (up to 2)
   */
  generateTags(): void {
    const tags: Tag[] = [];

    // Count amenity occurrences
    const amenityCounts = new Map<string, number>();
    this.hotels.forEach(hotel => {
      hotel.amenities.forEach(amenity => {
        amenityCounts.set(amenity, (amenityCounts.get(amenity) || 0) + 1);
      });
    });

    // Get top 3 amenities
    const topAmenities = Array.from(amenityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([amenity]) => ({
        type: 'amenity' as const,
        label: amenity,
        icon: this.getAmenityIcon(amenity),
        query: `which ones have ${amenity}`
      }));

    tags.push(...topAmenities);

    // Get unique locations (up to 2)
    const locations = new Set<string>();
    this.hotels.forEach(hotel => {
      hotel.sentiment.forEach(sentiment => locations.add(sentiment));
    });

    if (locations.size > 1) {
      const locationTags = Array.from(locations)
        .slice(0, 2)
        .map(loc => ({
          type: 'location' as const,
          label: `Near ${loc}`,
          icon: '🏢',
          query: `show me hotels near ${loc}`
        }));

      tags.push(...locationTags);
    }

    this.tags = tags;
  }

  /**
   * Handle tag click and emit query
   * @param tag - Clicked tag object
   */
  onTagClick(tag: Tag): void {
    this.tagClicked.emit(tag.query);
  }

  /**
   * Get icon emoji for amenity type
   * @param amenity - Amenity name
   * @returns Emoji icon string
   */
  private getAmenityIcon(amenity: string): string {
    const iconMap: Record<string, string> = {
      'Rooftop Bar': '🍸',
      'Fitness Center': '💪',
      'Pet Friendly': '🐕',
      'Pool': '🏊',
      'Spa': '💆',
      'Restaurant': '🍽️',
      'Free WiFi': '📶',
      'Parking': '🅿️'
    };

    return iconMap[amenity] || '✨';
  }
}
