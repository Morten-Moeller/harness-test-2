# Backend rules

## Stack

- Quarkus 3.40 in `backend/`, Java 21, Maven wrapper (`backend/mvnw`).
- REST with Jakarta REST annotations and Jackson (`quarkus-rest-jackson`), validation with
  Jakarta Bean Validation (`quarkus-hibernate-validator`), OpenAPI (`quarkus-smallrye-openapi`),
  health (`quarkus-smallrye-health`).
- `make dev-backend` starts dev mode on http://localhost:8080; OpenAPI at `/q/openapi`, Swagger UI
  at `/q/swagger-ui`, health at `/q/health`.

## Structure

- Package root `de.mmoller.einkaufsliste`, one package per feature (for example `...shoppinglist`).
- Per feature: a resource (REST), a service (rules), a repository (storage). The resource holds no
  rules; the service knows nothing about HTTP.
- Every endpoint lives under `/api`.

## Data

- Storage starts in memory. A database comes with its own spec and ADR (high risk: migrations).
- Personal data: none planned. If a spec adds some, it names where it is stored and how it is
  deleted.

## Errors, logging, configuration

- Input is validated with Bean Validation annotations on the request types. A validation error is
  HTTP 400 with the Quarkus default body.
- Not found is HTTP 404, raised as `jakarta.ws.rs.NotFoundException` in the service.
- Logging through `io.quarkus.logging.Log`; no request bodies in the log.
- Configuration in `application.properties`; no secret in the repository.

## APIs

- Contract first: the endpoint is in the spec before the code. The OpenAPI document is generated
  by Quarkus; how it lands in `contracts/` is decided with the first API spec.

## Quality

- `make backend-typecheck`: compile main and test code. `make backend-lint`: Spotless with
  palantir-java-format (`make format` fixes it).
