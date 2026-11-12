package de.mmoller.einkaufsliste.shoppinglist;

import de.mmoller.einkaufsliste.ids.IdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ShoppingListService {

    private final ShoppingListRepository lists;
    private final ItemRepository items;
    private final IdGenerator ids;

    public ShoppingListService(ShoppingListRepository lists, ItemRepository items, IdGenerator ids) {
        this.lists = lists;
        this.items = items;
        this.ids = ids;
    }

    public ShoppingList create(CreateShoppingListRequest request) {
        ShoppingList list = new ShoppingList(ids.next(), request.name());
        items.init(list.id());
        return lists.save(list);
    }

    public List<ShoppingList> findAll() {
        return lists.findAll();
    }

    public UpdateResult update(UUID id, UpdateShoppingListRequest request) {
        if (!request.hasField() || (request.name() != null && request.name().isEmpty())) {
            return UpdateResult.INVALID;
        }
        return lists.update(id, request.name(), request.position());
    }

    public boolean delete(UUID id) {
        if (!lists.delete(id)) {
            return false;
        }
        items.deleteAll(id);
        return true;
    }
}
