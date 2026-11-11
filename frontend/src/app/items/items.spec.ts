import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Items } from './items';
import { Item } from './items-api';

function anItem(overrides: Partial<Item> = {}): Item {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Milch',
    quantity: null,
    done: false,
    ...overrides,
  };
}

const milch = anItem({ id: '11111111-1111-1111-1111-111111111111', name: 'Milch' });
const brot = anItem({ id: '22222222-2222-2222-2222-222222222222', name: 'Brot', done: true });

describe('Items without a backend', () => {
  it('shows an error when the list cannot be loaded', async () => {
    await TestBed.configureTestingModule({
      imports: [Items],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Items);
    await fixture.whenStable();
    http
      .expectOne({ method: 'GET', url: '/api/items' })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.error')?.textContent).toContain(
      'Die Einkaufsliste konnte nicht geladen werden.',
    );
    http.verify();
  });
});

describe('Items', () => {
  let fixture: ComponentFixture<Items>;
  let http: HttpTestingController;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const nameInput = (): HTMLInputElement => element().querySelector('#item-name')!;
  const quantityInput = (): HTMLInputElement => element().querySelector('#item-quantity')!;
  const button = (): HTMLButtonElement => element().querySelector('button[type=submit]')!;

  const type = async (input: HTMLInputElement, value: string): Promise<void> => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Items],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Items);
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: '/api/items' }).flush([]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('disables the button while the request is pending', async () => {
    await type(nameInput(), 'Milch');
    button().click();
    await fixture.whenStable();

    expect(button().disabled).toBe(true);
    http
      .expectOne({ method: 'POST', url: '/api/items' })
      .flush(anItem(), { status: 201, statusText: 'Created' });
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: '/api/items' }).flush([anItem()]);
    await fixture.whenStable();
    expect(button().disabled).toBe(true);
    expect(nameInput().value).toBe('');
  });

  it('renders the form with labelled fields and the button', () => {
    expect(element().querySelector('label[for=item-name]')?.textContent).toContain('Name');
    expect(element().querySelector('label[for=item-quantity]')?.textContent).toContain('Menge');
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

    const request = http.expectOne({ method: 'POST', url: '/api/items' });
    expect(request.request.body).toEqual({ name: 'Milch', quantity: '1 l' });
    request.flush(anItem({ name: 'Milch', quantity: '1 l' }), {
      status: 201,
      statusText: 'Created',
    });
    await fixture.whenStable();
    http
      .expectOne({ method: 'GET', url: '/api/items' })
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
      .expectOne({ method: 'POST', url: '/api/items' })
      .flush({}, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(element().querySelector('.error')?.textContent).toContain(
      'Der Artikel konnte nicht angelegt werden.',
    );
    expect(nameInput().value).toBe('Milch');
    expect(element().querySelectorAll('.item').length).toBe(0);
  });

  it('shows the filter unchecked and the empty text', () => {
    const filter = element().querySelector<HTMLInputElement>('#only-open')!;
    expect(filter.checked).toBe(false);
    expect(element().querySelector('label[for=only-open]')?.textContent).toContain(
      'Nur offene anzeigen',
    );
    expect(element().querySelector('.empty')?.textContent).toContain('Noch keine Artikel.');
  });
});

describe('Items with stored items', () => {
  let fixture: ComponentFixture<Items>;
  let http: HttpTestingController;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const rows = (): HTMLElement[] => Array.from(element().querySelectorAll<HTMLElement>('.item'));
  const checkboxOf = (name: string): HTMLInputElement =>
    rows()
      .find((row) => row.querySelector('.item-name')?.textContent?.trim() === name)!
      .querySelector<HTMLInputElement>('input[type=checkbox]')!;
  const filter = (): HTMLInputElement => element().querySelector('#only-open')!;

  const setFilter = async (checked: boolean): Promise<void> => {
    filter().checked = checked;
    filter().dispatchEvent(new Event('change'));
    await fixture.whenStable();
  };

  const load = async (items: Item[]): Promise<void> => {
    http.expectOne({ method: 'GET', url: '/api/items' }).flush(items);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Items],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Items);
    await fixture.whenStable();
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

    const request = http.expectOne({ method: 'PATCH', url: `/api/items/${milch.id}` });
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

    const request = http.expectOne({ method: 'PATCH', url: `/api/items/${brot.id}` });
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
      .expectOne({ method: 'PATCH', url: `/api/items/${milch.id}` })
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

    http.expectNone({ method: 'GET', url: '/api/items' });
  });

  it('shows Keine offenen Artikel when the filter hides everything', async () => {
    checkboxOf('Milch').click();
    await fixture.whenStable();
    http
      .expectOne({ method: 'PATCH', url: `/api/items/${milch.id}` })
      .flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await load([{ ...milch, done: true }, brot]);

    await setFilter(true);

    expect(rows().length).toBe(0);
    expect(element().querySelector('.empty')?.textContent).toContain('Keine offenen Artikel.');
  });
});
