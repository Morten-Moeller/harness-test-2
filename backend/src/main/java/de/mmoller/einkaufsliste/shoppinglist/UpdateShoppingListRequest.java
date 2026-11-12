package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateShoppingListRequest(
        @NotBlank @Size(max = 100) String name) {

    public UpdateShoppingListRequest {
        name = name == null ? null : name.trim();
    }
}
