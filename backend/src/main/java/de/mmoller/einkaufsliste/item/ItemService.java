package de.mmoller.einkaufsliste.item;

import de.mmoller.einkaufsliste.ids.IdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class ItemService {

    private final ItemRepository repository;
    private final IdGenerator ids;

    public ItemService(ItemRepository repository, IdGenerator ids) {
        this.repository = repository;
        this.ids = ids;
    }

    public Item create(CreateItemRequest request) {
        return repository.save(new Item(ids.next(), request.name(), request.quantity(), false));
    }

    public List<Item> findAll() {
        return repository.findAll();
    }
}
