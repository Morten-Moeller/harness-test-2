package de.mmoller.einkaufsliste.shoppinglist;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

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
class ShoppingListResourceTest {

    private static final String SUFFIX = UUID.randomUUID().toString();

    private static Map<String, Object> aList(String name) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        return body;
    }

    private static ValidatableResponse post(Map<String, Object> body) {
        return given().contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/api/lists")
                .then();
    }

    private static String createList(String name) {
        return post(aList(name)).statusCode(201).extract().path("id");
    }

    private static ValidatableResponse patch(String id, Object body) {
        var request = given().contentType(ContentType.JSON);
        if (body != null) {
            request = request.body(body);
        }
        return request.when().patch("/api/lists/" + id).then();
    }

    private static ValidatableResponse delete(String id) {
        return given().when().delete("/api/lists/" + id).then();
    }

    private static List<Map<String, Object>> storedLists() {
        return given().when()
                .get("/api/lists")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList("");
    }

    private static List<String> storedNames() {
        return storedLists().stream().map(list -> (String) list.get("name")).toList();
    }

    private static String storedName(String id) {
        return storedLists().stream()
                .filter(list -> id.equals(list.get("id")))
                .map(list -> (String) list.get("name"))
                .findFirst()
                .orElseThrow();
    }

    @Test
    void createsListWithTrimmedName() {
        var response = post(aList("  Rewe-" + SUFFIX + "  "))
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Rewe-" + SUFFIX))
                .extract();

        String id = response.path("id");
        assertThat(response.header("Location"), endsWith("/api/lists/" + id));
        assertThat(UUID.fromString(id).version(), is(7));
    }

    @Test
    void listsListsInCreationOrder() {
        createList("Erste-" + SUFFIX);
        createList("Zweite-" + SUFFIX);

        List<String> own = storedNames().stream()
                .filter(name -> name.equals("Erste-" + SUFFIX) || name.equals("Zweite-" + SUFFIX))
                .toList();

        assertThat(own, equalTo(List.of("Erste-" + SUFFIX, "Zweite-" + SUFFIX)));
    }

    static Stream<Arguments> invalidListNames() {
        return Stream.of(
                Arguments.of("empty name", aList("")),
                Arguments.of("blank name", aList("   ")),
                Arguments.of("missing name", new HashMap<String, Object>()),
                Arguments.of("name too long", aList("a".repeat(101))));
    }

    @ParameterizedTest(name = "rejects list with {0}")
    @MethodSource("invalidListNames")
    void rejectsInvalidListName(String label, Map<String, Object> body) {
        post(body).statusCode(400);

        String name = (String) body.get("name");
        if (name != null && !name.isBlank()) {
            assertThat(storedNames(), not(hasItem(name)));
        } else {
            assertThat(storedNames().stream().anyMatch(String::isBlank), is(false));
        }
    }

    @Test
    void renamesList() {
        String before = createList("Vorher-" + SUFFIX);
        String id = createList("Alt-" + SUFFIX);
        String after = createList("Nachher-" + SUFFIX);

        patch(id, aList("  Neu-" + SUFFIX + " ")).statusCode(204).body(equalTo(""));

        List<String> own = storedNames().stream()
                .filter(name -> name.endsWith("-" + SUFFIX))
                .filter(name -> name.startsWith("Vorher-") || name.startsWith("Neu-") || name.startsWith("Nachher-"))
                .toList();
        assertThat(own, equalTo(List.of("Vorher-" + SUFFIX, "Neu-" + SUFFIX, "Nachher-" + SUFFIX)));
        assertThat(storedName(id), equalTo("Neu-" + SUFFIX));
        assertThat(storedName(before), equalTo("Vorher-" + SUFFIX));
        assertThat(storedName(after), equalTo("Nachher-" + SUFFIX));
    }

    @Test
    void answers404WhenRenamingUnknownList() {
        patch(UUID.randomUUID().toString(), aList("Egal")).statusCode(404);
    }

    static Stream<Arguments> invalidRenames() {
        Map<String, Object> nameNull = new HashMap<>();
        nameNull.put("name", null);
        return Stream.of(
                Arguments.of("body without name", new HashMap<String, Object>()),
                Arguments.of("blank name", aList("  ")),
                Arguments.of("name null", nameNull),
                Arguments.of("no body", null));
    }

    @ParameterizedTest(name = "rejects rename with {0}")
    @MethodSource("invalidRenames")
    void rejectsRenameWithoutName(String label, Map<String, Object> body) {
        String id = createList("Bleibt-" + SUFFIX);

        patch(id, body).statusCode(400);

        assertThat(storedName(id), equalTo("Bleibt-" + SUFFIX));
    }

    @Test
    void deletesListWithItems() {
        String id = createList("Weg-" + SUFFIX);
        given().contentType(ContentType.JSON)
                .body(Map.of("name", "Milch"))
                .when()
                .post("/api/lists/" + id + "/items")
                .then()
                .statusCode(201);

        delete(id).statusCode(204).body(equalTo(""));

        assertThat(storedLists().stream().anyMatch(list -> id.equals(list.get("id"))), is(false));
        given().when().get("/api/lists/" + id + "/items").then().statusCode(404);
    }

    @Test
    void answers404WhenDeletingUnknownList() {
        delete(UUID.randomUUID().toString()).statusCode(404);
    }

    @Test
    void keepsOtherListsOnDelete() {
        String kept = createList("Bleibt-" + SUFFIX);
        String keptItem = given().contentType(ContentType.JSON)
                .body(Map.of("name", "Brot"))
                .when()
                .post("/api/lists/" + kept + "/items")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
        String removed = createList("Weg-" + SUFFIX);

        delete(removed).statusCode(204);

        assertThat(storedName(kept), equalTo("Bleibt-" + SUFFIX));
        given().when()
                .get("/api/lists/" + kept + "/items")
                .then()
                .statusCode(200)
                .body("id", hasItem(keptItem));
    }
}
