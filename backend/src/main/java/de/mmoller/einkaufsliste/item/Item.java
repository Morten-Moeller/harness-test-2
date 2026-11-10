package de.mmoller.einkaufsliste.item;

import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(requiredProperties = {"id", "name", "quantity", "done"})
public record Item(
        UUID id, String name, @Schema(nullable = true) String quantity, boolean done) {}
