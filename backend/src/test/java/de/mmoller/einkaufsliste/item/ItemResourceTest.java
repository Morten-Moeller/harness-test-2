package de.mmoller.einkaufsliste.item;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.response.ValidatableResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@QuarkusTest
class ItemResourceTest {

    private static final String SUFFIX = UUID.randomUUID().toString();

    private static Map<String, Object> anItem() {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Artikel-" + SUFFIX);
        body.put("quantity", null);
        return body;
    }

    private static Map<String, Object> anItem(String name) {
        Map<String, Object> body = anItem();
        body.put("name", name);
        return body;
    }

    private static ValidatableResponse post(Map<String, Object> body) {
        return given().contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/api/items")
                .then();
    }

    private static ValidatableResponse patch(String id, Object body) {
        var request = given().contentType(ContentType.JSON);
        if (body != null) {
            request = request.body(body);
        }
        return request.when().patch("/api/items/" + id).then();
    }

    private static Map<String, Object> stored(String id) {
        List<Map<String, Object>> all = given().when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList("");
        return all.stream()
                .filter(item -> id.equals(item.get("id")))
                .findFirst()
                .orElseThrow();
    }

    private static List<String> storedNames() {
        return given().when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList("name");
    }

    @Test
    void createsItemWithQuantity() {
        Map<String, Object> body = anItem("Milch-" + SUFFIX);
        body.put("quantity", "1 l");

        var response = post(body)
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Milch-" + SUFFIX))
                .body("quantity", equalTo("1 l"))
                .body("done", is(false))
                .extract();

        String id = response.path("id");
        assertThat(response.header("Location"), endsWith("/api/items/" + id));
    }

    @Test
    void createsItemWithoutQuantity() {
        post(anItem("Brot-" + SUFFIX))
                .statusCode(201)
                .body("name", equalTo("Brot-" + SUFFIX))
                .body("quantity", nullValue())
                .body("done", is(false));
    }

    @Test
    void createsTimeOrderedIds() {
        String first = post(anItem()).statusCode(201).extract().path("id");
        String second = post(anItem()).statusCode(201).extract().path("id");

        assertThat(UUID.fromString(first).version(), is(7));
        assertThat(UUID.fromString(second).version(), is(7));
        assertThat(second.compareTo(first), greaterThan(0));
    }

    @Test
    void listsItemsInCreationOrder() {
        post(anItem("Eier-" + SUFFIX)).statusCode(201);
        post(anItem("Butter-" + SUFFIX)).statusCode(201);

        List<String> own = storedNames().stream()
                .filter(name -> name.equals("Eier-" + SUFFIX) || name.equals("Butter-" + SUFFIX))
                .toList();

        assertThat(own, equalTo(List.of("Eier-" + SUFFIX, "Butter-" + SUFFIX)));
    }

    @Test
    void marksItemAsDone() {
        String first =
                post(anItem("Eier-done-" + SUFFIX)).statusCode(201).extract().path("id");
        String second =
                post(anItem("Butter-done-" + SUFFIX)).statusCode(201).extract().path("id");

        patch(first, Map.of("done", true)).statusCode(204).body(equalTo(""));

        Map<String, Object> item = stored(first);
        assertThat(item.get("done"), is(true));
        assertThat(item.get("name"), equalTo("Eier-done-" + SUFFIX));
        assertThat(item.get("quantity"), nullValue());
        List<String> own = storedNames().stream()
                .filter(name -> name.endsWith("-done-" + SUFFIX))
                .toList();
        assertThat(own, equalTo(List.of("Eier-done-" + SUFFIX, "Butter-done-" + SUFFIX)));
        assertThat(stored(second).get("done"), is(false));
    }

    @Test
    void reopensItem() {
        String id = post(anItem()).statusCode(201).extract().path("id");
        patch(id, Map.of("done", true)).statusCode(204);

        patch(id, Map.of("done", false)).statusCode(204);

        assertThat(stored(id).get("done"), is(false));
    }

    @Test
    void answers404ForUnknownItem() {
        patch(UUID.randomUUID().toString(), Map.of("done", true)).statusCode(404);
    }

    static Stream<Arguments> invalidUpdates() {
        Map<String, Object> doneNull = new HashMap<>();
        doneNull.put("done", null);
        return Stream.of(
                Arguments.of("body without done", Map.of()),
                Arguments.of("done null", doneNull),
                Arguments.of("no body", null));
    }

    @ParameterizedTest(name = "rejects update with {0}")
    @MethodSource("invalidUpdates")
    void rejectsUpdateWithoutDone(String label, Map<String, Object> body) {
        String id = post(anItem()).statusCode(201).extract().path("id");

        patch(id, body).statusCode(400);

        assertThat(stored(id).get("done"), is(false));
    }

    static Stream<Arguments> invalidBodies() {
        Map<String, Object> missingName = anItem();
        missingName.remove("name");
        Map<String, Object> tooLongQuantity = anItem("Kaese-" + SUFFIX);
        tooLongQuantity.put("quantity", "b".repeat(51));
        return Stream.of(
                Arguments.of("blank name", anItem("   ")),
                Arguments.of("empty name", anItem("")),
                Arguments.of("missing name", missingName),
                Arguments.of("name too long", anItem("a".repeat(101))),
                Arguments.of("quantity too long", tooLongQuantity));
    }

    @ParameterizedTest(name = "rejects {0}")
    @MethodSource("invalidBodies")
    void rejectsInvalidInputAndStoresNothing(String label, Map<String, Object> body) {
        post(body).statusCode(400);

        String name = (String) body.get("name");
        List<String> stored = storedNames();
        if (name == null || name.isBlank()) {
            assertThat(stored.stream().anyMatch(String::isBlank), is(false));
        } else {
            assertThat(stored.contains(name.trim()), is(false));
        }
    }

    @Test
    void acceptsBoundaryLengthsAfterTrim() {
        String name = "a".repeat(100);
        String quantity = "b".repeat(50);
        Map<String, Object> body = anItem("  " + name + "  ");
        body.put("quantity", "  " + quantity + "  ");

        post(body).statusCode(201).body("name", equalTo(name)).body("quantity", equalTo(quantity));
    }
}
