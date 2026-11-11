import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Item, ItemsApi } from './items-api';

@Component({
  selector: 'app-items',
  imports: [FormsModule],
  templateUrl: './items.html',
  styleUrl: './items.css',
})
export class Items implements OnInit {
  private readonly api = inject(ItemsApi);
  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly name = signal('');
  protected readonly quantity = signal('');
  protected readonly items = signal<Item[]>([]);
  protected readonly onlyOpen = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly cannotSubmit = computed(
    () => this.saving() || this.name().trim().length === 0,
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
      .create({ name: this.name().trim(), quantity: quantity.length > 0 ? quantity : undefined })
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
    this.api.setDone(item.id, { done: !item.done }).subscribe({
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

  private load(): void {
    this.api.findAll().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('Die Einkaufsliste konnte nicht geladen werden.'),
    });
  }
}
