package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ItemRepository {

    private final Map<UUID, List<Item>> itemsByList = new HashMap<>();

    public synchronized void init(UUID listId) {
        itemsByList.putIfAbsent(listId, new ArrayList<>());
    }

    public synchronized Optional<Item> save(UUID listId, Item item) {
        List<Item> items = itemsByList.get(listId);
        if (items == null) {
            return Optional.empty();
        }
        items.add(item);
        return Optional.of(item);
    }

    public synchronized UpdateResult update(UUID listId, UUID id, Boolean done, Integer position, UUID targetListId) {
        List<Item> source = itemsByList.get(listId);
        if (source == null) {
            return UpdateResult.NOT_FOUND;
        }
        int index = indexOf(source, id);
        if (index < 0) {
            return UpdateResult.NOT_FOUND;
        }
        boolean sameList = targetListId == null || targetListId.equals(listId);
        List<Item> target = sameList ? source : itemsByList.get(targetListId);
        if (target == null) {
            return UpdateResult.TARGET_NOT_FOUND;
        }
        int max = sameList ? source.size() - 1 : target.size();
        if (position != null && (position < 0 || position > max)) {
            return UpdateResult.INVALID_POSITION;
        }
        Item current = source.remove(index);
        Item updated = done == null ? current : new Item(current.id(), current.name(), current.quantity(), done);
        int at = position != null ? position : sameList ? index : target.size();
        target.add(at, updated);
        return UpdateResult.OK;
    }

    public synchronized Optional<List<Item>> findAll(UUID listId) {
        List<Item> items = itemsByList.get(listId);
        if (items == null) {
            return Optional.empty();
        }
        return Optional.of(new ArrayList<>(items));
    }

    public synchronized void deleteAll(UUID listId) {
        itemsByList.remove(listId);
    }

    private static int indexOf(List<Item> items, UUID id) {
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).id().equals(id)) {
                return i;
            }
        }
        return -1;
    }
}
