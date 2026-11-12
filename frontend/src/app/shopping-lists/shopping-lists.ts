import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShoppingListPanel } from './shopping-list';
import { ShoppingList, ShoppingListsApi } from './shopping-lists-api';

export type Layout = 'columns' | 'rows';

@Component({
  selector: 'app-shopping-lists',
  imports: [FormsModule, ShoppingListPanel],
  templateUrl: './shopping-lists.html',
  styleUrl: './shopping-lists.css',
})
export class ShoppingLists implements OnInit {
  private readonly api = inject(ShoppingListsApi);

  protected readonly lists = signal<ShoppingList[]>([]);
  protected readonly loaded = signal(false);
  protected readonly listName = signal('');
  protected readonly layout = signal<Layout>('columns');
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly cannotSubmit = computed(
    () => this.saving() || this.listName().trim().length === 0,
  );

  ngOnInit(): void {
    this.load();
  }

  protected submit(): void {
    if (this.cannotSubmit()) {
      return;
    }
    this.saving.set(true);
    this.api.createList({ name: this.listName().trim() }).subscribe({
      next: () => {
        this.listName.set('');
        this.error.set(null);
        this.saving.set(false);
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Die Einkaufsliste konnte nicht angelegt werden.');
      },
    });
  }

  protected load(): void {
    this.api.findAllLists().subscribe({
      next: (lists) => {
        this.lists.set(lists);
        this.loaded.set(true);
        this.error.set(null);
      },
      error: () => this.error.set('Die Einkaufslisten konnten nicht geladen werden.'),
    });
  }
}
