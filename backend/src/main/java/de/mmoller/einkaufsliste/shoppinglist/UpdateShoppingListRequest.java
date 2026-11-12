package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record UpdateShoppingListRequest(
        @Size(max = 100) @Schema(nullable = true) String name,
        @PositiveOrZero @Schema(nullable = true) Integer position) {

    public UpdateShoppingListRequest {
        name = name == null ? null : name.trim();
    }

    public boolean hasField() {
        return name != null || position != null;
    }
}
