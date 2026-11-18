# High-Level Design (HLD)

## Project: Observability Shield
- **Repository:** [observability-shield](https://github.com/pravindiranms140-lgtm/observability-shield)
- **Architecture Pattern:** Layered Middleware Pipeline Architecture for Express.js APIs

---

## 1. System Overview & Architecture Goals
**Observability Shield** implements a modular, non-invasive observability pipeline positioned between incoming HTTP requests and application domain controllers. The system is designed to provide full-lifecycle request transparency, performance telemetry, and security auditing without altering core business logic.

### Key Architectural Objectives:
1. **Decoupled Telemetry Pipeline:** Observability logic (ID generation, access logging, latency calculation, and audit logging) operates as isolated middleware units.
2. **Correlation Context Propagation:** A unified 8-character truncated request ID prefix (`[reqId]`) links all disparate log entries produced by a single transaction.
3. **Non-Blocking Lifecycle Hooks:** Asynchronous event listeners (`res.on('finish')`) guarantee that metric logging occurs after the response is dispatched to the client, preventing latency inflation.
4. **Targeted Route Interception:** Differentiated middleware stacks allow read routes (`GET`) to run lightweight while mutating routes (`POST`) execute audit controls.

---

## 2. High-Level Architecture Diagram

```
+─────────────────────────────────────────────────────────────────────────────+
|                                Client Tier                                  |
|         [ Web Browser / Mobile App / API Client (Curl, Postman) ]           |
|                                     │                                       |
|                                     │ HTTP Request (e.g. POST /posts)       |
|                                     ▼                                       |
+─────────────────────────────────────────────────────────────────────────────+
|                     Express.js HTTP Server (Port 4000)                      |
|                                                                             |
|  +───────────────────────────────────────────────────────────────────────+  |
|  |                     Global Middleware Pipeline                        |  |
|  |                                                                       |  |
|  |  1. requestId Middleware                                              |  |
|  |     • Generates UUID via crypto.randomUUID()                          |  |
|  |     • Attaches req.id & sets X-Request-Id response header             |  |
|  |                                                                       |  |
|  |  2. logger Middleware                                                 |  |
|  |     • Registers res.on('finish') listener                             |  |
|  |     • Output format: [reqId] <METHOD> <PATH> <STATUS_CODE>            |  |
|  |                                                                       |  |
|  |  3. timing Middleware                                                 |  |
|  |     • Captures Date.now() on ingress                                  |  |
|  |     • Registers res.on('finish') listener to compute total duration   |  |
|  |     • Output format: [reqId] <METHOD> <PATH> took <MS>ms              |  |
|  |                                                                       |  |
|  |  4. express.json() Body Parser                                        |  |
|  |     • Parses incoming application/json body into req.body             |  |
|  +───────────────────────────────────┬───────────────────────────────────+  |
|                                      │                                      |
|                                      ▼                                      |
|  +───────────────────────────────────────────────────────────────────────+  |
|  |                           Router Layer                                |  |
|  |                                                                       |  |
|  |     /posts Router                   /users Router                     |  |
|  |     ├── GET  /  ──► listPosts       └── GET / ──► listUsers           |  |
|  |     └── POST /  ──► [auditWrite] ──► createPost                       |  |
|  +───────────────────────────────────┬───────────────────────────────────+  |
|                                      │                                      |
|                                      ▼                                      |
|  +───────────────────────────────────────────────────────────────────────+  |
|  |                     Controllers / Business Logic                      |  |
|  |     • postsController.js  (listPosts, createPost)                     |  |
|  |     • usersController.js  (listUsers)                                 |  |
|  +───────────────────────────────────┬───────────────────────────────────+  |
|                                      │                                      |
|                                      ▼ (Response Handled / Sent)             |
|  +───────────────────────────────────────────────────────────────────────+  |
|  |                     Response & Lifecycle Emission                     |  |
|  |     1. Client receives HTTP Response with X-Request-Id header         |  |
|  |     2. res 'finish' event triggers:                                   |  |
|  |        ├── logger output: [reqId] POST /posts 201                     |  |
|  |        └── timing output: [reqId] POST /posts took 3ms                |  |
|  +───────────────────────────────────────────────────────────────────────+  |
+─────────────────────────────────────────────────────────────────────────────+
```

---

## 3. Technology Stack & Component Justification

| Layer | Component | Version / Spec | Role & Justification |
|---|---|---|---|
| **Runtime Engine** | Node.js | >= 18.x | High-throughput asynchronous event-loop runtime with native `crypto.randomUUID()` support. |
| **Web Framework** | Express.js | ^4.18.2 | Industry-standard minimalist web framework providing flexible middleware composition. |
| **Identity Engine** | Node.js `crypto` | Standard Library | Cryptographically secure UUIDv4 generation without external runtime dependencies. |
| **Testing Suite** | Node.js `assert` | Standard Library | Zero-overhead assertion library for verifying controller interfaces and contracts. |
| **Continuous Integration**| GitHub Actions | v4 | Automated workflow ensuring clean dependency installation and passing tests on every PR and commit. |

---

## 4. Middleware Execution Lifecycle & Pipeline Flow

The execution model follows an onion-style cascading flow where global middleware handles cross-cutting concerns before routing:

```
[Inbound Request]
       │
       ▼
[1. requestId]   ──► Assigns req.id & adds header 'X-Request-Id'
       │
       ▼
[2. logger]      ──► Attaches response 'finish' listener for status logging
       │
       ▼
[3. timing]      ──► Records performance timestamp (Date.now())
       │
       ▼
[4. express.json]──► Decodes incoming JSON payload
       │
       ▼
[5. Route Matching]
       ├─────────────────────────────────┐
       ▼ (GET /posts or GET /users)      ▼ (POST /posts)
[Controller Action]               [auditWrite Middleware]
       │                          Logs "[reqId] AUDIT: POST /posts"
       │                                 │
       │                          [Controller Action]
       │                                 │
       └────────────────► ◄──────────────┘
                          │
                          ▼
                  [res.send() / res.json()]
                          │
                          ▼
            [HTTP Response Sent to Client]
                          │
                          ▼
              (Event: res emits 'finish')
              ├── [logger] Emits access log
              └── [timing] Emits duration log
```

---

## 5. Security, Auditing & Observability Guarantees
- **Audit Immutability:** Write operations are logged before controller execution, ensuring an audit entry exists even if downstream business logic encounters an unhandled exception.
- **Trace Continuity:** The `X-Request-Id` response header enables clients and frontend web apps to trace request status across logs.
- **Information Leak Prevention:** The `logger` and `timing` modules log method, path, status, and latency while deliberately excluding sensitive body payloads or query tokens.
- **Header Standardization:** Adheres to common cloud standards by exposing `X-Request-Id` in the response headers.

---

## 6. Deployment & CI/CD Pipeline
- **Continuous Integration:** `.github/workflows/ci.yml` runs on every push and pull request against `ubuntu-latest` with Node.js 18.
- **Automated Verification:** Executes `npm ci` followed by `npm test` to validate module exports and controller signatures.
