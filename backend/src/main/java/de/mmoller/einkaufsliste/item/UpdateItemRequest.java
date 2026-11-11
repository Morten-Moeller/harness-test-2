package de.mmoller.einkaufsliste.item;

import jakarta.validation.constraints.NotNull;

public record UpdateItemRequest(@NotNull Boolean done) {}
