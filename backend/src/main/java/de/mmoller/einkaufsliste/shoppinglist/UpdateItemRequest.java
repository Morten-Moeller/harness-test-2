package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.constraints.NotNull;

public record UpdateItemRequest(@NotNull Boolean done) {}
