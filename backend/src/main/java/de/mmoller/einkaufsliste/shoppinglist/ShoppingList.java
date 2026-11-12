package de.mmoller.einkaufsliste.shoppinglist;

import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(requiredProperties = {"id", "name"})
public record ShoppingList(UUID id, String name) {}
