package de.mmoller.einkaufsliste.requestlog;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;

import io.quarkus.test.junit.QuarkusTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;

@QuarkusTest
class RequestIdFilterTest {

    @Test
    void setsRequestIdOnEveryResponse() {
        String id = given().when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .extract()
                .header(RequestIdFilter.HEADER);

        assertThat(UUID.fromString(id).version(), is(7));
    }

    @Test
    void keepsValidRequestIdFromRequest() {
        given().header(RequestIdFilter.HEADER, "abc-123")
                .when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .header(RequestIdFilter.HEADER, equalTo("abc-123"));
    }

    @Test
    void replacesInvalidRequestId() {
        String tooLong = "a".repeat(65);
        String idForTooLong = given().header(RequestIdFilter.HEADER, tooLong)
                .when()
                .get("/api/items")
                .then()
                .header(RequestIdFilter.HEADER, not(equalTo(tooLong)))
                .extract()
                .header(RequestIdFilter.HEADER);
        String idForBadChars = given().header(RequestIdFilter.HEADER, "with space")
                .when()
                .get("/api/items")
                .then()
                .header(RequestIdFilter.HEADER, not(equalTo("with space")))
                .extract()
                .header(RequestIdFilter.HEADER);

        assertThat(UUID.fromString(idForTooLong).version(), is(7));
        assertThat(UUID.fromString(idForBadChars).version(), is(7));
    }
}
