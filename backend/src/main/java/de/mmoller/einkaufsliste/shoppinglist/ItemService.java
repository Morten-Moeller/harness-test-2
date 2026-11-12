package de.mmoller.einkaufsliste.shoppinglist;

import de.mmoller.einkaufsliste.ids.IdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ItemService {

    private final ItemRepository repository;
    private final ShoppingListRepository lists;
    private final IdGenerator ids;

    public ItemService(ItemRepository repository, ShoppingListRepository lists, IdGenerator ids) {
        this.repository = repository;
        this.lists = lists;
        this.ids = ids;
    }

    public Optional<Item> create(UUID listId, CreateItemRequest request) {
        if (!lists.exists(listId)) {
            return Optional.empty();
        }
        return Optional.of(repository.save(listId, new Item(ids.next(), request.name(), request.quantity(), false)));
    }

    public boolean setDone(UUID listId, UUID id, boolean done) {
        return repository.setDone(listId, id, done);
    }

    public Optional<List<Item>> findAll(UUID listId) {
        if (!lists.exists(listId)) {
            return Optional.empty();
        }
        return Optional.of(repository.findAll(listId).orElse(List.of()));
    }
}
