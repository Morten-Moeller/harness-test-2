import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ShoppingListPanel } from './shopping-list';
import { Item, ShoppingList } from './shopping-lists-api';

function anItem(overrides: Partial<Item> = {}): Item {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Milch',
    quantity: null,
    done: false,
    ...overrides,
  };
}

const rewe: ShoppingList = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Rewe' };
const itemsUrl = `/api/lists/${rewe.id}/items`;
const milch = anItem({ id: '11111111-1111-1111-1111-111111111111', name: 'Milch' });
const brot = anItem({ id: '22222222-2222-2222-2222-222222222222', name: 'Brot', done: true });

async function createPanel(): Promise<{
  fixture: ComponentFixture<ShoppingListPanel>;
  http: HttpTestingController;
}> {
  await TestBed.configureTestingModule({
    imports: [ShoppingListPanel],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }).compileComponents();
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(ShoppingListPanel);
  fixture.componentRef.setInput('list', rewe);
  await fixture.whenStable();
  return { fixture, http };
}

describe('ShoppingListPanel without a backend', () => {
  it('shows an error when the items cannot be loaded', async () => {
    const { fixture, http } = await createPanel();
    http
      .expectOne({ method: 'GET', url: itemsUrl })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.error')?.textContent).toContain(
      'Die Einkaufsliste konnte nicht geladen werden.',
    );
    http.verify();
  });
});

describe('ShoppingListPanel', () => {
  let fixture: ComponentFixture<ShoppingListPanel>;
  let http: HttpTestingController;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const nameInput = (): HTMLInputElement => element().querySelector(`#item-name-${rewe.id}`)!;
  const quantityInput = (): HTMLInputElement =>
    element().querySelector(`#item-quantity-${rewe.id}`)!;
  const button = (): HTMLButtonElement => element().querySelector('.form button[type=submit]')!;

  const type = async (input: HTMLInputElement, value: string): Promise<void> => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    ({ fixture, http } = await createPanel());
    http.expectOne({ method: 'GET', url: itemsUrl }).flush([]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('shows the list name as heading with Umbenennen and Löschen', () => {
    expect(element().querySelector('h2')?.textContent).toContain('Rewe');
    const labels = Array.from(element().querySelectorAll('.actions button')).map((b) =>
      b.textContent?.trim(),
    );
    expect(labels).toEqual(['Umbenennen', 'Löschen']);
  });

  it('disables the button while the request is pending', async () => {
    await type(nameInput(), 'Milch');
    button().click();
    await fixture.whenStable();

    expect(button().disabled).toBe(true);
    http
      .expectOne({ method: 'POST', url: itemsUrl })
      .flush(anItem(), { status: 201, statusText: 'Created' });
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: itemsUrl }).flush([anItem()]);
    await fixture.whenStable();
    expect(button().disabled).toBe(true);
    expect(nameInput().value).toBe('');
  });

  it('renders the form with labelled fields and the button', () => {
    expect(element().querySelector(`label[for=item-name-${rewe.id}]`)?.textContent).toContain(
      'Name',
    );
    expect(element().querySelector(`label[for=item-quantity-${rewe.id}]`)?.textContent).toContain(
      'Menge',
    );
    expect(button().textContent).toContain('Hinzufügen');
  });

  it('disables the button while the name is blank', async () => {
    expect(button().disabled).toBe(true);
    await type(nameInput(), '   ');
    expect(button().disabled).toBe(true);
    await type(nameInput(), 'Milch');
    expect(button().disabled).toBe(false);
  });

  it('adds the created item to the list and clears the form', async () => {
    await type(nameInput(), 'Milch');
    await type(quantityInput(), '1 l');
    button().click();

    const request = http.expectOne({ method: 'POST', url: itemsUrl });
    expect(request.request.body).toEqual({ name: 'Milch', quantity: '1 l' });
    request.flush(anItem({ name: 'Milch', quantity: '1 l' }), {
      status: 201,
      statusText: 'Created',
    });
    await fixture.whenStable();
    http
      .expectOne({ method: 'GET', url: itemsUrl })
      .flush([anItem({ name: 'Milch', quantity: '1 l' })]);
    await fixture.whenStable();

    const rows = element().querySelectorAll('.item');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Milch');
    expect(rows[0].textContent).toContain('1 l');
    expect(nameInput().value).toBe('');
    expect(quantityInput().value).toBe('');
    expect(document.activeElement).toBe(nameInput());
  });

  it('shows an error when the backend rejects the item', async () => {
    await type(nameInput(), 'Milch');
    button().click();

    http
      .expectOne({ method: 'POST', url: itemsUrl })
      .flush({}, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(element().querySelector('.error')?.textContent).toContain(
      'Der Artikel konnte nicht angelegt werden.',
    );
    expect(nameInput().value).toBe('Milch');
    expect(element().querySelectorAll('.item').length).toBe(0);
  });

  it('shows the filter unchecked and the empty text', () => {
    const filter = element().querySelector<HTMLInputElement>(`#only-open-${rewe.id}`)!;
    expect(filter.checked).toBe(false);
    expect(element().querySelector(`label[for=only-open-${rewe.id}]`)?.textContent).toContain(
      'Nur offene anzeigen',
    );
    expect(element().querySelector('.empty')?.textContent).toContain('Noch keine Artikel.');
  });
});

describe('ShoppingListPanel with stored items', () => {
  let fixture: ComponentFixture<ShoppingListPanel>;
  let http: HttpTestingController;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const rows = (): HTMLElement[] => Array.from(element().querySelectorAll<HTMLElement>('.item'));
  const checkboxOf = (name: string): HTMLInputElement =>
    rows()
      .find((row) => row.querySelector('.item-name')?.textContent?.trim() === name)!
      .querySelector<HTMLInputElement>('input[type=checkbox]')!;
  const filter = (): HTMLInputElement => element().querySelector(`#only-open-${rewe.id}`)!;

  const setFilter = async (checked: boolean): Promise<void> => {
    filter().checked = checked;
    filter().dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  const load = async (items: Item[]): Promise<void> => {
    http.expectOne({ method: 'GET', url: itemsUrl }).flush(items);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    ({ fixture, http } = await createPanel());
    await load([milch, brot]);
  });

  afterEach(() => http.verify());

  it('renders a checkbox per item labelled with the name', () => {
    expect(rows().length).toBe(2);
    const checkbox = checkboxOf('Milch');
    expect(checkbox.checked).toBe(false);
    expect(checkbox.closest('label')?.textContent).toContain('Milch');
    expect(checkboxOf('Brot').checked).toBe(true);
  });

  it('strikes through done items', () => {
    const names = rows().map((row) => row.querySelector('.item-name')!);
    expect(names[0].classList.contains('done')).toBe(false);
    expect(names[1].classList.contains('done')).toBe(true);
  });

  it('marks an item as done and reloads the list', async () => {
    checkboxOf('Milch').click();
    await fixture.whenStable();

    const request = http.expectOne({ method: 'PATCH', url: `${itemsUrl}/${milch.id}` });
    expect(request.request.body).toEqual({ done: true });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await load([{ ...milch, done: true }, brot]);

    expect(checkboxOf('Milch').checked).toBe(true);
    expect(rows()[0].querySelector('.item-name')!.classList.contains('done')).toBe(true);
  });

  it('reopens a done item', async () => {
    checkboxOf('Brot').click();
    await fixture.whenStable();

    const request = http.expectOne({ method: 'PATCH', url: `${itemsUrl}/${brot.id}` });
    expect(request.request.body).toEqual({ done: false });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await load([milch, { ...brot, done: false }]);

    expect(checkboxOf('Brot').checked).toBe(false);
  });

  it('shows an error when the backend rejects the change', async () => {
    checkboxOf('Milch').click();
    await fixture.whenStable();

    http
      .expectOne({ method: 'PATCH', url: `${itemsUrl}/${milch.id}` })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    await load([milch, brot]);

    expect(element().querySelector('.error')?.textContent).toContain(
      'Der Artikel konnte nicht geändert werden.',
    );
    expect(checkboxOf('Milch').checked).toBe(false);
  });

  it('hides done items while only open is checked', async () => {
    await setFilter(true);
    expect(rows().map((row) => row.querySelector('.item-name')?.textContent?.trim())).toEqual([
      'Milch',
    ]);

    await setFilter(false);
    expect(rows().length).toBe(2);
  });

  it('sends no request when toggling the filter', async () => {
    await setFilter(true);
    await setFilter(false);

    http.expectNone({ method: 'GET', url: itemsUrl });
  });

  it('shows Keine offenen Artikel when the filter hides everything', async () => {
    checkboxOf('Milch').click();
    await fixture.whenStable();
    http
      .expectOne({ method: 'PATCH', url: `${itemsUrl}/${milch.id}` })
      .flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await load([{ ...milch, done: true }, brot]);

    await setFilter(true);

    expect(rows().length).toBe(0);
    expect(element().querySelector('.empty')?.textContent).toContain('Keine offenen Artikel.');
  });
});

describe('ShoppingListPanel moving items', () => {
  let fixture: ComponentFixture<ShoppingListPanel>;
  let http: HttpTestingController;

  const eier = anItem({ id: '33333333-3333-3333-3333-333333333333', name: 'Eier' });
  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const rows = (): HTMLElement[] => Array.from(element().querySelectorAll<HTMLElement>('.item'));
  const rowOf = (name: string): HTMLElement =>
    rows().find((row) => row.querySelector('.item-name')?.textContent?.trim() === name)!;
  const buttonIn = (row: HTMLElement, label: string): HTMLButtonElement =>
    Array.from(row.querySelectorAll<HTMLButtonElement>('button.move')).find(
      (b) => b.textContent?.trim() === label,
    )!;

  const load = async (items: Item[]): Promise<void> => {
    http.expectOne({ method: 'GET', url: itemsUrl }).flush(items);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    ({ fixture, http } = await createPanel());
    await load([milch, brot, eier]);
  });

  afterEach(() => http.verify());

  it('renders handle and move buttons per item', () => {
    expect(rows().length).toBe(3);
    for (const row of rows()) {
      expect(row.querySelector('button.handle')?.getAttribute('aria-label')).toBe('Artikel ziehen');
      expect(buttonIn(row, 'Nach oben')).toBeDefined();
      expect(buttonIn(row, 'Nach unten')).toBeDefined();
    }
    expect(buttonIn(rowOf('Milch'), 'Nach oben').disabled).toBe(true);
    expect(buttonIn(rowOf('Milch'), 'Nach unten').disabled).toBe(false);
    expect(buttonIn(rowOf('Eier'), 'Nach unten').disabled).toBe(true);
    expect(buttonIn(rowOf('Brot'), 'Nach oben').getAttribute('aria-label')).toBe('Nach oben: Brot');
  });

  it('moves an item up with the button', async () => {
    buttonIn(rowOf('Brot'), 'Nach oben').click();

    const request = http.expectOne({ method: 'PATCH', url: `${itemsUrl}/${brot.id}` });
    expect(request.request.body).toEqual({ position: 0 });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await load([brot, milch, eier]);

    expect(rows().map((row) => row.querySelector('.item-name')?.textContent?.trim())).toEqual([
      'Brot',
      'Milch',
      'Eier',
    ]);
  });

  it('moves only among open items while the filter is on', async () => {
    const filter = element().querySelector<HTMLInputElement>(`#only-open-${rewe.id}`)!;
    filter.checked = true;
    filter.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(rows().length).toBe(2);

    buttonIn(rowOf('Milch'), 'Nach unten').click();

    const request = http.expectOne({ method: 'PATCH', url: `${itemsUrl}/${milch.id}` });
    expect(request.request.body).toEqual({ position: 2 });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await load([brot, eier, milch]);
  });

  it('shows an error when moving fails', async () => {
    buttonIn(rowOf('Milch'), 'Nach unten').click();

    http
      .expectOne({ method: 'PATCH', url: `${itemsUrl}/${milch.id}` })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    await load([milch, brot, eier]);

    expect(element().querySelector('.error')?.textContent).toContain(
      'Der Artikel konnte nicht verschoben werden.',
    );
    expect(rows()[0].querySelector('.item-name')?.textContent).toContain('Milch');
  });
});
