import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { ShoppingListPanel } from './shopping-list';
import { ShoppingLists } from './shopping-lists';
import { Item, ShoppingList } from './shopping-lists-api';

const rewe: ShoppingList = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Rewe' };
const edeka: ShoppingList = { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Edeka' };

function anItem(overrides: Partial<Item> = {}): Item {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Milch',
    quantity: null,
    done: false,
    ...overrides,
  };
}

async function createPage(): Promise<{
  fixture: ComponentFixture<ShoppingLists>;
  http: HttpTestingController;
}> {
  await TestBed.configureTestingModule({
    imports: [ShoppingLists],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  }).compileComponents();
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(ShoppingLists);
  await fixture.whenStable();
  return { fixture, http };
}

describe('ShoppingLists without a backend', () => {
  it('shows an error when the lists cannot be loaded', async () => {
    const { fixture, http } = await createPage();
    http
      .expectOne({ method: 'GET', url: '/api/lists' })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.error')?.textContent).toContain(
      'Die Einkaufslisten konnten nicht geladen werden.',
    );
    expect(element.querySelector('.no-lists')).toBeNull();
    http.verify();
  });
});

describe('ShoppingLists without lists', () => {
  let fixture: ComponentFixture<ShoppingLists>;
  let http: HttpTestingController;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const nameInput = (): HTMLInputElement => element().querySelector('#list-name')!;
  const button = (): HTMLButtonElement =>
    element().querySelector('.list-form button[type=submit]')!;

  const type = async (value: string): Promise<void> => {
    nameInput().value = value;
    nameInput().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    ({ fixture, http } = await createPage());
    http.expectOne({ method: 'GET', url: '/api/lists' }).flush([]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('renders the form for a new list', () => {
    expect(element().querySelector('.list-form legend')?.textContent).toContain(
      'Neue Einkaufsliste',
    );
    expect(element().querySelector('label[for=list-name]')?.textContent).toContain('Name');
    expect(button().textContent).toContain('Anlegen');
  });

  it('shows Noch keine Einkaufslisten', () => {
    expect(element().querySelector('.no-lists')?.textContent).toContain(
      'Noch keine Einkaufslisten.',
    );
    expect(element().querySelectorAll('app-shopping-list').length).toBe(0);
  });

  it('disables Anlegen while the name is blank', async () => {
    expect(button().disabled).toBe(true);
    await type('   ');
    expect(button().disabled).toBe(true);
    await type('Rewe');
    expect(button().disabled).toBe(false);
  });

  it('creates a list and shows its panel', async () => {
    await type('  Rewe ');
    button().click();

    const request = http.expectOne({ method: 'POST', url: '/api/lists' });
    expect(request.request.body).toEqual({ name: 'Rewe' });
    request.flush(rewe, { status: 201, statusText: 'Created' });
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: '/api/lists' }).flush([rewe]);
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: `/api/lists/${rewe.id}/items` }).flush([]);
    await fixture.whenStable();

    expect(nameInput().value).toBe('');
    expect(element().querySelector('app-shopping-list h2')?.textContent).toContain('Rewe');
    expect(element().querySelector('.no-lists')).toBeNull();
  });

  it('shows an error when the list cannot be created', async () => {
    await type('Rewe');
    button().click();

    http
      .expectOne({ method: 'POST', url: '/api/lists' })
      .flush({}, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(element().querySelector('.error')?.textContent).toContain(
      'Die Einkaufsliste konnte nicht angelegt werden.',
    );
    expect(nameInput().value).toBe('Rewe');
  });

  it('starts with the layout Nebeneinander', () => {
    const columns = element().querySelector<HTMLInputElement>('#layout-columns')!;
    const rows = element().querySelector<HTMLInputElement>('#layout-rows')!;
    expect(element().querySelector('.layout legend')?.textContent).toContain('Anordnung');
    expect(element().querySelector('label[for=layout-columns]')?.textContent).toContain(
      'Nebeneinander',
    );
    expect(element().querySelector('label[for=layout-rows]')?.textContent).toContain(
      'Untereinander',
    );
    expect(columns.checked).toBe(true);
    expect(rows.checked).toBe(false);
    expect(element().querySelector('.lists')?.classList.contains('columns')).toBe(true);
  });
});

describe('ShoppingLists with two lists', () => {
  let fixture: ComponentFixture<ShoppingLists>;
  let http: HttpTestingController;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const panels = (): HTMLElement[] =>
    Array.from(element().querySelectorAll<HTMLElement>('app-shopping-list'));
  const panelOf = (name: string): HTMLElement =>
    panels().find((panel) => panel.querySelector('h2')?.textContent?.trim() === name)!;
  const buttonIn = (panel: HTMLElement, label: string): HTMLButtonElement =>
    Array.from(panel.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === label,
    )!;

  const flushItems = async (lists: ShoppingList[], items: Item[][]): Promise<void> => {
    lists.forEach((list, index) =>
      http.expectOne({ method: 'GET', url: `/api/lists/${list.id}/items` }).flush(items[index]),
    );
    await fixture.whenStable();
  };

  const reloadLists = async (lists: ShoppingList[]): Promise<void> => {
    http.expectOne({ method: 'GET', url: '/api/lists' }).flush(lists);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    ({ fixture, http } = await createPage());
    await reloadLists([rewe, edeka]);
    await flushItems(
      [rewe, edeka],
      [
        [anItem({ name: 'Milch' })],
        [anItem({ id: '22222222-2222-2222-2222-222222222222', name: 'Brot', done: true })],
      ],
    );
  });

  afterEach(() => http.verify());

  it('renders one panel per list with its own items', () => {
    expect(panels().map((panel) => panel.querySelector('h2')?.textContent?.trim())).toEqual([
      'Rewe',
      'Edeka',
    ]);
    expect(panelOf('Rewe').querySelector('.item-name')?.textContent).toContain('Milch');
    expect(panelOf('Edeka').querySelector('.item-name')?.textContent).toContain('Brot');
    expect(panelOf('Rewe').querySelectorAll('.item').length).toBe(1);
  });

  it('filters each panel on its own', async () => {
    const filter = panelOf('Edeka').querySelector<HTMLInputElement>(`#only-open-${edeka.id}`)!;
    filter.checked = true;
    filter.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(panelOf('Edeka').querySelector('.empty')?.textContent).toContain(
      'Keine offenen Artikel.',
    );
    expect(panelOf('Rewe').querySelectorAll('.item').length).toBe(1);
  });

  it('switches the layout between columns and rows without a request', async () => {
    const rows = element().querySelector<HTMLInputElement>('#layout-rows')!;
    const columns = element().querySelector<HTMLInputElement>('#layout-columns')!;
    const container = (): HTMLElement => element().querySelector('.lists')!;

    rows.checked = true;
    rows.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(container().classList.contains('columns')).toBe(false);

    columns.checked = true;
    columns.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(container().classList.contains('columns')).toBe(true);

    http.expectNone({ method: 'GET', url: '/api/lists' });
  });

  it('renames a list', async () => {
    buttonIn(panelOf('Rewe'), 'Umbenennen').click();
    await fixture.whenStable();

    const panel = panels()[0];
    expect(panel.querySelector('h2')).toBeNull();
    const input = panel.querySelector<HTMLInputElement>(`#list-rename-${rewe.id}`)!;
    expect(input.value).toBe('Rewe');
    input.value = ' Rewe City ';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    buttonIn(panel, 'Speichern').click();

    const request = http.expectOne({ method: 'PATCH', url: `/api/lists/${rewe.id}` });
    expect(request.request.body).toEqual({ name: 'Rewe City' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await reloadLists([{ ...rewe, name: 'Rewe City' }, edeka]);

    expect(panels()[0].querySelector('h2')?.textContent).toContain('Rewe City');
    expect(panels()[0].querySelector('.item-name')?.textContent).toContain('Milch');
  });

  it('cancels renaming without a request', async () => {
    buttonIn(panelOf('Rewe'), 'Umbenennen').click();
    await fixture.whenStable();
    const panel = panels()[0];
    const input = panel.querySelector<HTMLInputElement>(`#list-rename-${rewe.id}`)!;
    input.value = 'Anders';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    buttonIn(panel, 'Abbrechen').click();
    await fixture.whenStable();

    expect(panels()[0].querySelector('h2')?.textContent).toContain('Rewe');
    http.expectNone({ method: 'PATCH', url: `/api/lists/${rewe.id}` });
  });

  it('shows an error when renaming fails', async () => {
    buttonIn(panelOf('Rewe'), 'Umbenennen').click();
    await fixture.whenStable();
    buttonIn(panels()[0], 'Speichern').click();

    http
      .expectOne({ method: 'PATCH', url: `/api/lists/${rewe.id}` })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(panels()[0].querySelector('.error')?.textContent).toContain(
      'Die Einkaufsliste konnte nicht umbenannt werden.',
    );
  });

  it('deletes a list and keeps the others', async () => {
    buttonIn(panelOf('Rewe'), 'Löschen').click();

    http
      .expectOne({ method: 'DELETE', url: `/api/lists/${rewe.id}` })
      .flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    await reloadLists([edeka]);

    expect(panels().map((panel) => panel.querySelector('h2')?.textContent?.trim())).toEqual([
      'Edeka',
    ]);
    expect(panelOf('Edeka').querySelector('.item-name')?.textContent).toContain('Brot');
  });

  it('shows an error when deleting fails', async () => {
    buttonIn(panelOf('Edeka'), 'Löschen').click();

    http
      .expectOne({ method: 'DELETE', url: `/api/lists/${edeka.id}` })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(panelOf('Edeka').querySelector('.error')?.textContent).toContain(
      'Die Einkaufsliste konnte nicht gelöscht werden.',
    );
    expect(panels().length).toBe(2);
  });
});

describe('ShoppingLists moving lists', () => {
  let fixture: ComponentFixture<ShoppingLists>;
  let http: HttpTestingController;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const panels = (): HTMLElement[] =>
    Array.from(element().querySelectorAll<HTMLElement>('app-shopping-list'));
  const names = (): (string | undefined)[] =>
    panels().map((panel) => panel.querySelector('h2')?.textContent?.trim());
  const buttonIn = (panel: HTMLElement, label: string): HTMLButtonElement =>
    Array.from(panel.querySelectorAll<HTMLButtonElement>('.list-controls button.move')).find(
      (b) => b.textContent?.trim() === label,
    )!;

  beforeEach(async () => {
    ({ fixture, http } = await createPage());
    http.expectOne({ method: 'GET', url: '/api/lists' }).flush([rewe, edeka]);
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: `/api/lists/${rewe.id}/items` }).flush([]);
    http.expectOne({ method: 'GET', url: `/api/lists/${edeka.id}/items` }).flush([]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('renders handle and move buttons per panel', () => {
    for (const panel of panels()) {
      expect(panel.querySelector('.list-controls button.handle')?.getAttribute('aria-label')).toBe(
        'Einkaufsliste ziehen',
      );
    }
    expect(buttonIn(panels()[0], 'Nach oben').disabled).toBe(true);
    expect(buttonIn(panels()[0], 'Nach unten').disabled).toBe(false);
    expect(buttonIn(panels()[1], 'Nach oben').disabled).toBe(false);
    expect(buttonIn(panels()[1], 'Nach unten').disabled).toBe(true);
    expect(buttonIn(panels()[0], 'Nach unten').getAttribute('aria-label')).toBe('Nach unten: Rewe');
  });

  it('moves a list down with the button', async () => {
    buttonIn(panels()[0], 'Nach unten').click();

    const request = http.expectOne({ method: 'PATCH', url: `/api/lists/${rewe.id}` });
    expect(request.request.body).toEqual({ position: 1 });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: '/api/lists' }).flush([edeka, rewe]);
    await fixture.whenStable();

    expect(names()).toEqual(['Edeka', 'Rewe']);
  });

  it('shows an error when moving a list fails', async () => {
    buttonIn(panels()[1], 'Nach oben').click();

    http
      .expectOne({ method: 'PATCH', url: `/api/lists/${edeka.id}` })
      .flush({}, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    http.expectOne({ method: 'GET', url: '/api/lists' }).flush([rewe, edeka]);
    await fixture.whenStable();

    expect(element().querySelector('.error')?.textContent).toContain(
      'Die Einkaufsliste konnte nicht verschoben werden.',
    );
    expect(names()).toEqual(['Rewe', 'Edeka']);
  });

  it('connects the item drop lists of all panels', () => {
    const dropLists = fixture.debugElement.queryAll(By.css('ul.items'));
    const ids = dropLists.map((ul) => (ul.nativeElement as HTMLElement).id);
    expect(ids).toEqual([`items-${rewe.id}`, `items-${edeka.id}`]);
    for (const ul of dropLists) {
      expect(ul.injector.get(CdkDropList).connectedTo).toEqual(ids);
    }
  });

  it('reloads the source panel after moved', async () => {
    const target = fixture.debugElement.queryAll(By.directive(ShoppingListPanel))[1]
      .componentInstance as ShoppingListPanel;

    target.moved.emit(rewe.id);
    await fixture.whenStable();

    http
      .expectOne({ method: 'GET', url: `/api/lists/${rewe.id}/items` })
      .flush([anItem({ name: 'Milch' })]);
    await fixture.whenStable();
    expect(panels()[0].querySelector('.item-name')?.textContent).toContain('Milch');
  });
});
