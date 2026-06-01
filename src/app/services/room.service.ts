import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { Room } from '../models/room.model';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private cache$: Observable<Record<string, Room[]>> | null = null;

  constructor(private http: HttpClient) {}

  private loadAll(): Observable<Record<string, Room[]>> {
    if (!this.cache$) {
      this.cache$ = this.http.get<Record<string, Room[]>>('assets/rooms.json').pipe(
        catchError(() => of({})),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  getRoomsForHotel(hotelId: string): Observable<Room[]> {
    return this.loadAll().pipe(
      map(data => data[hotelId] ?? [])
    );
  }
}
