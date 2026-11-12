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
import { Item, ShoppingList, ShoppingListsApi } from './shopping-lists-api';

@Component({
  selector: 'app-shopping-list',
  imports: [FormsModule],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.css',
})
export class ShoppingListPanel implements OnInit {
  readonly list = input.required<ShoppingList>();
  readonly changed = output<void>();

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
    this.api.setDone(this.list().id, item.id, { done: !item.done }).subscribe({
      next: () => {
        this.error.set(null);
        this.load();
      },
      error: () => {
        this.error.set('Der Artikel konnte nicht geändert werden.');
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
    this.api.renameList(this.list().id, { name: this.newName().trim() }).subscribe({
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

  private load(): void {
    this.api.findAllItems(this.list().id).subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('Die Einkaufsliste konnte nicht geladen werden.'),
    });
  }
}
