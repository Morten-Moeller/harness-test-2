package de.mmoller.einkaufsliste.shoppinglist;

import de.mmoller.einkaufsliste.ids.IdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ItemService {

    private final ItemRepository repository;
    private final IdGenerator ids;

    public ItemService(ItemRepository repository, IdGenerator ids) {
        this.repository = repository;
        this.ids = ids;
    }

    public Optional<Item> create(UUID listId, CreateItemRequest request) {
        return repository.save(listId, new Item(ids.next(), request.name(), request.quantity(), false));
    }

    public boolean setDone(UUID listId, UUID id, boolean done) {
        return repository.setDone(listId, id, done);
    }

    public Optional<List<Item>> findAll(UUID listId) {
        return repository.findAll(listId);
    }
}
