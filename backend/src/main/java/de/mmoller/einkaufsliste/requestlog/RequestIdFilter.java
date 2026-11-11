package de.mmoller.einkaufsliste.requestlog;

import de.mmoller.einkaufsliste.ids.IdGenerator;
import io.quarkus.logging.Log;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.ext.Provider;
import java.util.regex.Pattern;
import org.jboss.logging.MDC;

@Provider
@PreMatching
public class RequestIdFilter implements ContainerRequestFilter, ContainerResponseFilter {

    public static final String HEADER = "X-Request-Id";
    private static final String MDC_KEY = "requestId";
    private static final Pattern VALID = Pattern.compile("[A-Za-z0-9-]{1,64}");

    private final IdGenerator ids;

    public RequestIdFilter(IdGenerator ids) {
        this.ids = ids;
    }

    @Override
    public void filter(ContainerRequestContext request) {
        String given = request.getHeaderString(HEADER);
        String id = given != null && VALID.matcher(given).matches()
                ? given
                : ids.next().toString();
        request.setProperty(HEADER, id);
        MDC.put(MDC_KEY, id);
    }

    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        String id = (String) request.getProperty(HEADER);
        if (id == null) {
            id = ids.next().toString();
            MDC.put(MDC_KEY, id);
        }
        response.getHeaders().putSingle(HEADER, id);
        Log.infof("%s %s -> %d", request.getMethod(), request.getUriInfo().getPath(), response.getStatus());
        MDC.remove(MDC_KEY);
    }
}
