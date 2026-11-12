import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { components } from '../shared/api';

export type ShoppingList = components['schemas']['ShoppingList'];
export type CreateShoppingListRequest = components['schemas']['CreateShoppingListRequest'];
export type UpdateShoppingListRequest = components['schemas']['UpdateShoppingListRequest'];
export type Item = components['schemas']['Item'];
export type CreateItemRequest = components['schemas']['CreateItemRequest'];
export type UpdateItemRequest = components['schemas']['UpdateItemRequest'];

@Injectable({ providedIn: 'root' })
export class ShoppingListsApi {
  private readonly http = inject(HttpClient);

  findAllLists(): Observable<ShoppingList[]> {
    return this.http.get<ShoppingList[]>('/api/lists');
  }

  createList(request: CreateShoppingListRequest): Observable<ShoppingList> {
    return this.http.post<ShoppingList>('/api/lists', request);
  }

  updateList(id: string, request: UpdateShoppingListRequest): Observable<void> {
    return this.http.patch<void>(`/api/lists/${id}`, request);
  }

  deleteList(id: string): Observable<void> {
    return this.http.delete<void>(`/api/lists/${id}`);
  }

  findAllItems(listId: string): Observable<Item[]> {
    return this.http.get<Item[]>(`/api/lists/${listId}/items`);
  }

  createItem(listId: string, request: CreateItemRequest): Observable<Item> {
    return this.http.post<Item>(`/api/lists/${listId}/items`, request);
  }

  updateItem(listId: string, id: string, request: UpdateItemRequest): Observable<void> {
    return this.http.patch<void>(`/api/lists/${listId}/items/${id}`, request);
  }
}
