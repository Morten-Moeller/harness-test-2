package de.mmoller.einkaufsliste.item;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateItemRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 50) String quantity) {}
