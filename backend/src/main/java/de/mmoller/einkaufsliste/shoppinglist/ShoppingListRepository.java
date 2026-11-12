package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ShoppingListRepository {

    private final List<ShoppingList> lists = new ArrayList<>();

    public synchronized ShoppingList save(ShoppingList list) {
        lists.add(list);
        return list;
    }

    public synchronized List<ShoppingList> findAll() {
        return new ArrayList<>(lists);
    }

    public synchronized boolean exists(UUID id) {
        return indexOf(id) >= 0;
    }

    public synchronized UpdateResult update(UUID id, String name, Integer position) {
        int index = indexOf(id);
        if (index < 0) {
            return UpdateResult.NOT_FOUND;
        }
        if (position != null && (position < 0 || position >= lists.size())) {
            return UpdateResult.INVALID_POSITION;
        }
        ShoppingList current = lists.remove(index);
        ShoppingList updated = name == null ? current : new ShoppingList(current.id(), name);
        lists.add(position == null ? index : position, updated);
        return UpdateResult.OK;
    }

    public synchronized boolean delete(UUID id) {
        int index = indexOf(id);
        if (index < 0) {
            return false;
        }
        lists.remove(index);
        return true;
    }

    private int indexOf(UUID id) {
        for (int i = 0; i < lists.size(); i++) {
            if (lists.get(i).id().equals(id)) {
                return i;
            }
        }
        return -1;
    }
}
