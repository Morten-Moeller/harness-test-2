package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateShoppingListRequest(
        @NotBlank @Size(max = 100) String name) {

    public CreateShoppingListRequest {
        name = name == null ? null : name.trim();
    }
}
