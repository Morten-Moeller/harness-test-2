package de.mmoller.einkaufsliste.item;

import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponseSchema;

@Path("/api/items")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ItemResource {

    private final ItemService service;

    public ItemResource(ItemService service) {
        this.service = service;
    }

    @GET
    public List<Item> list() {
        return service.findAll();
    }

    @POST
    @APIResponseSchema(value = Item.class, responseCode = "201")
    public Response create(@Valid CreateItemRequest request, @Context UriInfo uriInfo) {
        Item item = service.create(request);
        return Response.created(uriInfo.getAbsolutePathBuilder()
                        .path(item.id().toString())
                        .build())
                .entity(item)
                .build();
    }
}
