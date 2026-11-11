package de.mmoller.einkaufsliste.ids;

import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedEpochGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.UUID;

@ApplicationScoped
public class IdGenerator {

    private final TimeBasedEpochGenerator generator = Generators.timeBasedEpochGenerator();

    public UUID next() {
        return generator.generate();
    }
}
