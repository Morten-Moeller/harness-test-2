package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.constraints.PositiveOrZero;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record UpdateItemRequest(
        @Schema(nullable = true) Boolean done,
        @PositiveOrZero @Schema(nullable = true) Integer position,
        @Schema(nullable = true) UUID listId) {

    public boolean hasField() {
        return done != null || position != null || listId != null;
    }
}
