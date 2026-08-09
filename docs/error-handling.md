# Error Handling

Errors should help real users recover without revealing internal structure.

## Patterns

- Proxy denied access redirects instead of returning `401` or `403`.
- API failures surface backend-safe messages from the response envelope.
- Loading states use skeletons where layout would otherwise jump.
- Empty states explain the next useful action.
- Unexpected errors avoid stack traces and include a retry path.
- Backend request IDs should be shown only where support needs them and where
  they do not reveal private data.
