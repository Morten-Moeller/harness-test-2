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
        return repository.save(new Item(UUID.randomUUID(), request.name(), request.quantity(), false));
    }

    public List<Item> findAll() {
        return repository.findAll();
    }
}
