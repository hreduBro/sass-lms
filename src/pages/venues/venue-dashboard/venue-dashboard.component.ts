import { Component, computed, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { calculateVenueTotalCapacity } from '../../../models/venue.model';

@Component({
  selector: 'app-venue-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './venue-dashboard.component.html'
})
export class VenueDashboardComponent {
  lmsData = inject(LmsDataService);

  totalVenues = computed(() => this.lmsData.venues().length);
  activeVenues = computed(() => this.lmsData.venues().filter(v => v.status === 'active').length);
  totalRooms = computed(() => this.lmsData.venues().reduce((acc, v) => acc + v.rooms.length, 0));
  totalCapacity = computed(() => this.lmsData.venues().reduce((acc, v) => acc + calculateVenueTotalCapacity(v), 0));

  topVenuesByCapacity = computed(() => {
    return [...this.lmsData.venues()]
      .sort((a, b) => calculateVenueTotalCapacity(b) - calculateVenueTotalCapacity(a))
      .slice(0, 5);
  });

  cityBreakdown = computed(() => {
    const map = new Map<string, { count: number; capacity: number }>();
    this.lmsData.venues().forEach(v => {
      const city = v.address.city || 'Other';
      const cap = calculateVenueTotalCapacity(v);
      const curr = map.get(city) || { count: 0, capacity: 0 };
      map.set(city, { count: curr.count + 1, capacity: curr.capacity + cap });
    });
    return Array.from(map.entries()).map(([city, data]) => ({ city, ...data }));
  });

  getCap(venue: any): number {
    return calculateVenueTotalCapacity(venue);
  }
}
