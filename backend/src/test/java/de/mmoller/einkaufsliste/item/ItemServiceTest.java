package de.mmoller.einkaufsliste.item;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import de.mmoller.einkaufsliste.ids.IdGenerator;
import org.junit.jupiter.api.Test;

class ItemServiceTest {

    private final ItemService service = new ItemService(new ItemRepository(), new IdGenerator());

    @Test
    void trimsNameAndQuantity() {
        Item item = service.create(new CreateItemRequest("  Milch ", " 1 l  "));

        assertEquals("Milch", item.name());
        assertEquals("1 l", item.quantity());
        assertNotNull(item.id());
        assertFalse(item.done());
    }

    @Test
    void storesBlankQuantityAsNull() {
        assertNull(service.create(new CreateItemRequest("Brot", "   ")).quantity());
        assertNull(service.create(new CreateItemRequest("Brot", null)).quantity());
    }
}
