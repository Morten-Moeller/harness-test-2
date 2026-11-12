package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponseSchema;

@Path("/api/lists/{listId}/items")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ItemResource {

    private final ItemService service;

    public ItemResource(ItemService service) {
        this.service = service;
    }

    @GET
    @APIResponse(
            responseCode = "200",
            description = "OK",
            content = @Content(schema = @Schema(type = SchemaType.ARRAY, implementation = Item.class)))
    @APIResponse(responseCode = "404", description = "Not Found")
    public List<Item> list(@PathParam("listId") UUID listId) {
        return service.findAll(listId).orElseThrow(NotFoundException::new);
    }

    @POST
    @APIResponseSchema(value = Item.class, responseCode = "201")
    @APIResponse(responseCode = "404", description = "Not Found")
    public Response create(
            @PathParam("listId") UUID listId, @Valid CreateItemRequest request, @Context UriInfo uriInfo) {
        Item item = service.create(listId, request).orElseThrow(NotFoundException::new);
        return Response.created(uriInfo.getAbsolutePathBuilder()
                        .path(item.id().toString())
                        .build())
                .entity(item)
                .build();
    }

    @PATCH
    @Path("{id}")
    @APIResponse(responseCode = "204", description = "No Content")
    @APIResponse(responseCode = "400", description = "Bad Request")
    @APIResponse(responseCode = "404", description = "Not Found")
    public Response setDone(
            @PathParam("listId") UUID listId, @PathParam("id") UUID id, @NotNull @Valid UpdateItemRequest request) {
        if (!service.setDone(listId, id, request.done())) {
            throw new NotFoundException();
        }
        return Response.noContent().build();
    }
}
