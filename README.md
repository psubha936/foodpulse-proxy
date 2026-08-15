# foodpulse-proxy
Public entry point for backend APIs

## Runtime

- Node.js 20 or newer
- TypeScript in strict mode
- Express 5
- Default local port: `8080`
- Health endpoints: `GET /health` and `GET /ready`
- Role administration proxy: `POST /api/v1/identity/roles`

The shared workspace port registry is stored at
`implementation/SERVICE_PORTS.md` from the FoodPulse workspace root.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm test
npm start
```

Copy `.env.example` to the ignored `.env` file only when overriding local
configuration. The committed default already uses port `8080`.

`IDENTITY_SERVICE_URL` defaults to `http://127.0.0.1:8081`, and
`UPSTREAM_TIMEOUT_MS` defaults to 10000.

`X_API_KEYS` is required and accepts a comma-separated allow-list. Clients such as
Postman must send one configured value in the `x-api-key` header. Do not embed these
keys in a browser application because browser code cannot keep a shared key secret.

## Source layout

```text
src/
├── config/       # validated service configuration
├── enums/        # HTTP statuses and stable application error codes
├── errors/       # typed operational errors
├── middleware/   # request IDs, 404 handling, and centralized errors
├── routes/       # health/readiness and future service routes
├── types/        # API response contracts
├── app.ts        # Express composition without opening a port
├── bootstrap.ts  # HTTP server startup and graceful shutdown
└── index.ts      # executable entry point and .env loading
```

Build output is written to `dist/`. Error responses have one common shape and
include the `x-request-id` value for tracing. Domain routes and external client
connections are intentionally left for the corresponding service implementation.
