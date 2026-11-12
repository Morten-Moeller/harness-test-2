package de.mmoller.einkaufsliste.shoppinglist;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import de.mmoller.einkaufsliste.ids.IdGenerator;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ItemServiceTest {

    private final IdGenerator ids = new IdGenerator();
    private final ItemRepository items = new ItemRepository();
    private final ShoppingListService lists = new ShoppingListService(new ShoppingListRepository(), items, ids);
    private final ItemService service = new ItemService(items, ids);

    private UUID aList() {
        return lists.create(new CreateShoppingListRequest("Liste")).id();
    }

    @Test
    void trimsNameAndQuantity() {
        Item item = service.create(aList(), new CreateItemRequest("  Milch ", " 1 l  "))
                .orElseThrow();

        assertEquals("Milch", item.name());
        assertEquals("1 l", item.quantity());
        assertNotNull(item.id());
        assertFalse(item.done());
    }

    @Test
    void storesBlankQuantityAsNull() {
        UUID listId = aList();

        assertNull(service.create(listId, new CreateItemRequest("Brot", "   "))
                .orElseThrow()
                .quantity());
        assertNull(service.create(listId, new CreateItemRequest("Brot", null))
                .orElseThrow()
                .quantity());
    }

    @Test
    void createsNothingForUnknownList() {
        assertTrue(service.create(UUID.randomUUID(), new CreateItemRequest("Brot", null))
                .isEmpty());
    }
}
