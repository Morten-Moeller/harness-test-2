import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, OnInit, computed, inject, signal, viewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShoppingListPanel, itemDropListId } from './shopping-list';
import { ShoppingList, ShoppingListsApi } from './shopping-lists-api';

export type Layout = 'columns' | 'rows';

@Component({
  selector: 'app-shopping-lists',
  imports: [FormsModule, ShoppingListPanel, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './shopping-lists.html',
  styleUrl: './shopping-lists.css',
})
export class ShoppingLists implements OnInit {
  private readonly api = inject(ShoppingListsApi);
  private readonly panels = viewChildren(ShoppingListPanel);

  protected readonly lists = signal<ShoppingList[]>([]);
  protected readonly loaded = signal(false);
  protected readonly listName = signal('');
  protected readonly layout = signal<Layout>('columns');
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly cannotSubmit = computed(
    () => this.saving() || this.listName().trim().length === 0,
  );
  protected readonly itemDropListIds = computed(() =>
    this.lists().map((list) => itemDropListId(list.id)),
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

  protected moveList(list: ShoppingList, to: number): void {
    if (to < 0 || to >= this.lists().length) {
      return;
    }
    this.api.updateList(list.id, { position: to }).subscribe({
      next: () => {
        this.error.set(null);
        this.load();
      },
      error: () => {
        this.error.set('Die Einkaufsliste konnte nicht verschoben werden.');
        this.load(true);
      },
    });
  }

  protected dropped(event: CdkDragDrop<ShoppingList[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.moveList(this.lists()[event.previousIndex], event.currentIndex);
    }
  }

  protected onMoved(sourceId: string): void {
    this.panels()
      .find((panel) => panel.list().id === sourceId)
      ?.reload();
  }

  protected load(keepError = false): void {
    this.api.findAllLists().subscribe({
      next: (lists) => {
        this.lists.set(lists);
        this.loaded.set(true);
        if (!keepError) {
          this.error.set(null);
        }
      },
      error: () => this.error.set('Die Einkaufslisten konnten nicht geladen werden.'),
    });
  }
}
