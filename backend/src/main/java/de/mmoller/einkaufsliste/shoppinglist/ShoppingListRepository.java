package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class ShoppingListRepository {

    private final Map<UUID, ShoppingList> lists = Collections.synchronizedMap(new LinkedHashMap<>());

    public ShoppingList save(ShoppingList list) {
        lists.put(list.id(), list);
        return list;
    }

    public List<ShoppingList> findAll() {
        synchronized (lists) {
            return new ArrayList<>(lists.values());
        }
    }

    public boolean exists(UUID id) {
        return lists.containsKey(id);
    }

    public boolean rename(UUID id, String name) {
        return lists.computeIfPresent(id, (key, list) -> new ShoppingList(list.id(), name)) != null;
    }

    public boolean delete(UUID id) {
        return lists.remove(id) != null;
    }
}
