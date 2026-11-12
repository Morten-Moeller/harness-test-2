package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class ItemRepository {

    private final Map<UUID, Map<UUID, Item>> itemsByList = new ConcurrentHashMap<>();

    public void init(UUID listId) {
        itemsByList.putIfAbsent(listId, Collections.synchronizedMap(new LinkedHashMap<>()));
    }

    public Optional<Item> save(UUID listId, Item item) {
        Map<UUID, Item> items = itemsByList.get(listId);
        if (items == null) {
            return Optional.empty();
        }
        items.put(item.id(), item);
        return Optional.of(item);
    }

    public boolean setDone(UUID listId, UUID id, boolean done) {
        Map<UUID, Item> items = itemsByList.get(listId);
        if (items == null) {
            return false;
        }
        return items.computeIfPresent(id, (key, item) -> new Item(item.id(), item.name(), item.quantity(), done))
                != null;
    }

    public Optional<List<Item>> findAll(UUID listId) {
        Map<UUID, Item> items = itemsByList.get(listId);
        if (items == null) {
            return Optional.empty();
        }
        synchronized (items) {
            return Optional.of(new ArrayList<>(items.values()));
        }
    }

    public void deleteAll(UUID listId) {
        itemsByList.remove(listId);
    }
}
