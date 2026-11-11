package de.mmoller.einkaufsliste.item;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class ItemRepository {

    private final Map<UUID, Item> items = Collections.synchronizedMap(new LinkedHashMap<>());

    public Item save(Item item) {
        items.put(item.id(), item);
        return item;
    }

    public boolean setDone(UUID id, boolean done) {
        return items.computeIfPresent(id, (key, item) -> new Item(item.id(), item.name(), item.quantity(), done))
                != null;
    }

    public List<Item> findAll() {
        synchronized (items) {
            return new ArrayList<>(items.values());
        }
    }
}
