import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { positionAfterMove } from './order';
import { Item, ShoppingList, ShoppingListsApi, UpdateItemRequest } from './shopping-lists-api';

@Component({
  selector: 'app-shopping-list',
  imports: [FormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.css',
})
export class ShoppingListPanel implements OnInit {
  readonly list = input.required<ShoppingList>();
  readonly connectedTo = input<string[]>([]);
  readonly changed = output<void>();
  readonly moved = output<string>();

  private readonly api = inject(ShoppingListsApi);
  private readonly injector = inject(Injector);
  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');
  private readonly renameInput = viewChild<ElementRef<HTMLInputElement>>('renameInput');

  protected readonly name = signal('');
  protected readonly quantity = signal('');
  protected readonly items = signal<Item[]>([]);
  protected readonly onlyOpen = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly editing = signal(false);
  protected readonly renaming = signal(false);
  protected readonly newName = signal('');
  protected readonly cannotSubmit = computed(
    () => this.saving() || this.name().trim().length === 0,
  );
  protected readonly cannotRename = computed(
    () => this.renaming() || this.newName().trim().length === 0,
  );
  protected readonly visibleItems = computed(() =>
    this.onlyOpen() ? this.items().filter((item) => !item.done) : this.items(),
  );
  protected readonly emptyText = computed(() =>
    this.items().length === 0 ? 'Noch keine Artikel.' : 'Keine offenen Artikel.',
  );

  ngOnInit(): void {
    this.load();
  }

  reload(): void {
    this.load();
  }

  protected submit(): void {
    if (this.cannotSubmit()) {
      return;
    }
    const quantity = this.quantity().trim();
    this.saving.set(true);
    this.api
      .createItem(this.list().id, {
        name: this.name().trim(),
        quantity: quantity.length > 0 ? quantity : undefined,
      })
      .subscribe({
        next: () => {
          this.name.set('');
          this.quantity.set('');
          this.error.set(null);
          this.saving.set(false);
          this.nameInput().nativeElement.focus();
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('Der Artikel konnte nicht angelegt werden.');
        },
      });
  }

  protected toggleDone(item: Item, checkbox: HTMLInputElement): void {
    checkbox.checked = item.done;
    this.updateItem(item, { done: !item.done }, 'Der Artikel konnte nicht geändert werden.');
  }

  protected moveItem(item: Item, toVisible: number): void {
    const visible = this.visibleItems();
    const fromVisible = visible.indexOf(item);
    if (fromVisible < 0 || toVisible < 0 || toVisible >= visible.length) {
      return;
    }
    const position = positionAfterMove(this.items(), visible, fromVisible, toVisible);
    this.updateItem(item, { position }, 'Der Artikel konnte nicht verschoben werden.');
  }

  protected dropped(event: CdkDragDrop<ShoppingList, ShoppingList, Item>): void {
    if (event.previousContainer === event.container) {
      if (event.previousIndex !== event.currentIndex) {
        this.moveItem(this.visibleItems()[event.previousIndex], event.currentIndex);
      }
      return;
    }
    const source = event.previousContainer.data;
    const visible = this.visibleItems();
    const position =
      event.currentIndex >= visible.length
        ? this.items().length
        : this.items().indexOf(visible[event.currentIndex]);
    this.api
      .updateItem(source.id, event.item.data.id, { listId: this.list().id, position })
      .subscribe({
        next: () => {
          this.error.set(null);
          this.load();
          this.moved.emit(source.id);
        },
        error: () => {
          this.error.set('Der Artikel konnte nicht verschoben werden.');
          this.load();
        },
      });
  }

  protected startRename(): void {
    this.newName.set(this.list().name);
    this.editing.set(true);
    afterNextRender(() => this.renameInput()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected cancelRename(): void {
    this.editing.set(false);
  }

  protected saveRename(): void {
    if (this.cannotRename()) {
      return;
    }
    this.renaming.set(true);
    this.api.updateList(this.list().id, { name: this.newName().trim() }).subscribe({
      next: () => {
        this.renaming.set(false);
        this.editing.set(false);
        this.error.set(null);
        this.changed.emit();
      },
      error: () => {
        this.renaming.set(false);
        this.error.set('Die Einkaufsliste konnte nicht umbenannt werden.');
      },
    });
  }

  protected remove(): void {
    this.api.deleteList(this.list().id).subscribe({
      next: () => this.changed.emit(),
      error: () => this.error.set('Die Einkaufsliste konnte nicht gelöscht werden.'),
    });
  }

  private updateItem(item: Item, request: UpdateItemRequest, errorText: string): void {
    this.api.updateItem(this.list().id, item.id, request).subscribe({
      next: () => {
        this.error.set(null);
        this.load();
      },
      error: () => {
        this.error.set(errorText);
        this.load();
      },
    });
  }

  private load(): void {
    this.api.findAllItems(this.list().id).subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('Die Einkaufsliste konnte nicht geladen werden.'),
    });
  }
}
