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
        return lists.save(new ShoppingList(ids.next(), request.name()));
    }

    public List<ShoppingList> findAll() {
        return lists.findAll();
    }

    public boolean rename(UUID id, String name) {
        return lists.rename(id, name);
    }

    public boolean delete(UUID id) {
        if (!lists.delete(id)) {
            return false;
        }
        items.deleteAll(id);
        return true;
    }
}
