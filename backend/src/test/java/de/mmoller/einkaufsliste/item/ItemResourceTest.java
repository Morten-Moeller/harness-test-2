package de.mmoller.einkaufsliste.item;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ItemResourceTest {

    @Test
    @Order(1)
    void listsNothingAtStart() {
        given().when().get("/api/items").then().statusCode(200).body("", hasSize(0));
    }

    @Test
    @Order(2)
    void createsItemWithQuantity() {
        var response = given().contentType(ContentType.JSON)
                .body("{\"name\":\"Milch\",\"quantity\":\"1 l\"}")
                .when()
                .post("/api/items")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Milch"))
                .body("quantity", equalTo("1 l"))
                .body("done", is(false))
                .extract();

        String id = response.path("id");
        org.hamcrest.MatcherAssert.assertThat(response.header("Location"), endsWith("/api/items/" + id));
    }

    @Test
    @Order(3)
    void createsItemWithoutQuantity() {
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"Brot\"}")
                .when()
                .post("/api/items")
                .then()
                .statusCode(201)
                .body("name", equalTo("Brot"))
                .body("quantity", nullValue())
                .body("done", is(false));
    }

    @Test
    @Order(4)
    void listsItemsInCreationOrder() {
        given().when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .body("", hasSize(2))
                .body("[0].name", equalTo("Milch"))
                .body("[1].name", equalTo("Brot"));
    }

    @Test
    @Order(5)
    void rejectsBlankName() {
        rejects("{\"name\":\"   \"}");
        rejects("{\"name\":\"\"}");
        rejects("{\"quantity\":\"1 l\"}");
    }

    @Test
    @Order(6)
    void rejectsTooLongName() {
        rejects("{\"name\":\"" + "a".repeat(101) + "\"}");
    }

    @Test
    @Order(7)
    void rejectsTooLongQuantity() {
        rejects("{\"name\":\"Käse\",\"quantity\":\"" + "b".repeat(51) + "\"}");
    }

    @Test
    @Order(8)
    void acceptsBoundaryLengthsAfterTrim() {
        String name = "a".repeat(100);
        String quantity = "b".repeat(50);
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"  " + name + "  \",\"quantity\":\"  " + quantity + "  \"}")
                .when()
                .post("/api/items")
                .then()
                .statusCode(201)
                .body("name", equalTo(name))
                .body("quantity", equalTo(quantity));
    }

    private static void rejects(String body) {
        int before = countItems();
        given().contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/api/items")
                .then()
                .statusCode(400);
        given().when().get("/api/items").then().body("", hasSize(before));
    }

    private static int countItems() {
        return given().when()
                .get("/api/items")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList("")
                .size();
    }
}
