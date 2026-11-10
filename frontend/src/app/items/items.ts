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
  protected readonly error = signal<string | null>(null);
  protected readonly cannotSubmit = computed(() => this.name().trim().length === 0);

  ngOnInit(): void {
    this.api.findAll().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('Die Einkaufsliste konnte nicht geladen werden.'),
    });
  }

  protected submit(): void {
    if (this.cannotSubmit()) {
      return;
    }
    const quantity = this.quantity().trim();
    this.api
      .create({ name: this.name().trim(), quantity: quantity.length > 0 ? quantity : undefined })
      .subscribe({
        next: (item) => {
          this.items.update((items) => [...items, item]);
          this.name.set('');
          this.quantity.set('');
          this.error.set(null);
          this.nameInput().nativeElement.focus();
        },
        error: () => this.error.set('Der Artikel konnte nicht angelegt werden.'),
      });
  }
}
