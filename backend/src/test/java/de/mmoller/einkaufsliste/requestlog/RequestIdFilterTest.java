package de.mmoller.einkaufsliste.requestlog;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;

import io.quarkus.test.junit.QuarkusTest;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.jboss.logmanager.ExtHandler;
import org.jboss.logmanager.ExtLogRecord;
import org.jboss.logmanager.LogContext;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

@QuarkusTest
class RequestIdFilterTest {

    private static final List<ExtLogRecord> RECORDS = new CopyOnWriteArrayList<>();
    private static final ExtHandler HANDLER = new ExtHandler() {
        @Override
        protected void doPublish(ExtLogRecord record) {
            record.copyAll();
            RECORDS.add(record);
        }
    };

    @BeforeAll
    static void collectFilterLog() {
        LogContext.getLogContext().getLogger(RequestIdFilter.class.getName()).addHandler(HANDLER);
    }

    @AfterAll
    static void stopCollecting() {
        LogContext.getLogContext().getLogger(RequestIdFilter.class.getName()).removeHandler(HANDLER);
    }

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

    @Test
    void logsOneLinePerRequestWithRequestIdAndWithoutQuery() {
        String id = "log-" + UUID.randomUUID();

        given().header(RequestIdFilter.HEADER, id)
                .when()
                .get("/api/items?secret=1")
                .then()
                .statusCode(200);

        List<ExtLogRecord> lines = RECORDS.stream()
                .filter(record -> id.equals(record.getMdc("requestId")))
                .toList();
        assertThat(lines.size(), is(1));
        assertThat(lines.get(0).getFormattedMessage(), equalTo("GET /api/items -> 200"));
    }
}
