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
});
