import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { components } from '../shared/api';

export type Item = components['schemas']['Item'];
export type CreateItemRequest = components['schemas']['CreateItemRequest'];
export type UpdateItemRequest = components['schemas']['UpdateItemRequest'];

@Injectable({ providedIn: 'root' })
export class ItemsApi {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Item[]> {
    return this.http.get<Item[]>('/api/items');
  }

  create(request: CreateItemRequest): Observable<Item> {
    return this.http.post<Item>('/api/items', request);
  }

  setDone(id: string, request: UpdateItemRequest): Observable<void> {
    return this.http.patch<void>(`/api/items/${id}`, request);
  }
}
