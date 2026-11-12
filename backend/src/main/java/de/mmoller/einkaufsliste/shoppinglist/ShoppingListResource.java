package de.mmoller.einkaufsliste.shoppinglist;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
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
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponseSchema;

@Path("/api/lists")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ShoppingListResource {

    private final ShoppingListService service;

    public ShoppingListResource(ShoppingListService service) {
        this.service = service;
    }

    @GET
    public List<ShoppingList> list() {
        return service.findAll();
    }

    @POST
    @APIResponseSchema(value = ShoppingList.class, responseCode = "201")
    public Response create(@Valid CreateShoppingListRequest request, @Context UriInfo uriInfo) {
        ShoppingList list = service.create(request);
        return Response.created(uriInfo.getAbsolutePathBuilder()
                        .path(list.id().toString())
                        .build())
                .entity(list)
                .build();
    }

    @PATCH
    @Path("{id}")
    @APIResponse(responseCode = "204", description = "No Content")
    @APIResponse(responseCode = "400", description = "Bad Request")
    @APIResponse(responseCode = "404", description = "Not Found")
    public Response rename(@PathParam("id") UUID id, @NotNull @Valid UpdateShoppingListRequest request) {
        if (!service.rename(id, request.name())) {
            throw new NotFoundException();
        }
        return Response.noContent().build();
    }

    @DELETE
    @Path("{id}")
    @APIResponse(responseCode = "204", description = "No Content")
    @APIResponse(responseCode = "404", description = "Not Found")
    public Response delete(@PathParam("id") UUID id) {
        if (!service.delete(id)) {
            throw new NotFoundException();
        }
        return Response.noContent().build();
    }
}
