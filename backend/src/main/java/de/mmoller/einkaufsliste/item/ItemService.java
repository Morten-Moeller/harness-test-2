package de.mmoller.einkaufsliste.item;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ItemService {

    private final ItemRepository repository;

    public ItemService(ItemRepository repository) {
        this.repository = repository;
    }

    public Item create(CreateItemRequest request) {
        Item item = new Item(UUID.randomUUID(), request.name().trim(), normalizeQuantity(request.quantity()), false);
        return repository.save(item);
    }

    public List<Item> findAll() {
        return repository.findAll();
    }

    private static String normalizeQuantity(String quantity) {
        if (quantity == null) {
            return null;
        }
        String trimmed = quantity.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
