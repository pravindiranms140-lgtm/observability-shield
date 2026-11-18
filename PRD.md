# Product Requirements Document (PRD)

## Project: Observability Shield
- **Repository:** [observability-shield](https://github.com/pravindiranms140-lgtm/observability-shield)
- **Version:** 1.0.0
- **Status:** Approved / In Production
- **Target Platform:** Node.js / Express.js REST API Pipeline

---

## 1. Executive Summary & Problem Statement
Modern microservices and backend API architectures handle hundreds of concurrent HTTP requests per second. When system degradations, latent database calls, unexpected errors, or security anomalies occur, engineering and operations teams face a critical challenge: standard web logs often lack unified correlation identifiers, make timing bottlenecks difficult to diagnose, and fail to distinguish routine read traffic from critical write mutations.

**Observability Shield** is an enterprise-ready observability and audit logging middleware pipeline for Express.js applications. It introduces structured correlation tagging, automatic lifecycle timing, response status logging, and dedicated write-operation audit tracking across every HTTP transaction. By decoupling telemetry capture from business domain controllers, Observability Shield ensures 100% operational visibility with minimal runtime performance overhead.

---

## 2. Product Objectives & Success Metrics

### 2.1 Objectives
1. **End-to-End Request Traceability:** Inject a unique cryptographic UUID (`X-Request-Id`) into every inbound request to trace the transaction lifecycle across distributed components and client responses.
2. **Deterministic Lifecycle Logging:** Log incoming HTTP requests alongside their resolved status codes upon response completion using non-blocking event-driven hooks.
3. **High-Precision Latency Measurement:** Capture execution duration in milliseconds for every request to identify performance regressions and high-latency bottlenecks.
4. **Targeted Write-Operation Auditing:** Enforce a specialized security audit middleware (`auditWrite`) on state-mutating endpoints (e.g., `POST`, `PUT`, `DELETE`) to record audit trails for data integrity and compliance.
5. **Clean Controller Decoupling:** Keep route controllers (`postsController`, `usersController`) strictly focused on business logic while telemetry is cleanly orchestrated via the middleware pipeline.

### 2.2 Success Metrics (KPIs)
- **Correlation Integrity:** 100% of incoming HTTP requests receive an `X-Request-Id` header in the response and an attached `req.id` context.
- **Latency Overhead:** The entire telemetry middleware pipeline adds less than 1ms of processing overhead per request.
- **Log Completeness:** 100% of finished HTTP requests emit a status log and execution timing log via the `res.on('finish')` event listener.
- **Audit Accuracy:** 100% of mutation routes trigger explicit audit log entries with the active request ID prefix.

---

## 3. Target Audience & Personas
- **Backend Software Engineers:** Require clean, modular middleware patterns that do not pollute business logic with logging boilerplate.
- **Site Reliability Engineers (SREs) / DevOps:** Require consistent correlation IDs and execution latencies in console output to ingest into central log aggregators (e.g., Datadog, ELK, CloudWatch).
- **Security & Compliance Officers:** Require verifiable audit logs for any mutation action that creates or alters state within the application.

---

## 4. User Stories & Use Cases

### US-01: Unique Request Identification
- **As a** client application or API consumer,  
- **I want** every API response to include an `X-Request-Id` HTTP header,  
- **So that** I can reference this ID when reporting errors or tracking request progress.

### US-02: Request Lifecycle & Status Logging
- **As an** SRE / DevOps engineer,  
- **I want** the server to log the HTTP method, path, and resolved status code after every request completes,  
- **So that** I have full visibility into the health and traffic patterns of the API.

### US-03: Performance & Latency Measurement
- **As a** backend developer,  
- **I want** the execution duration (in milliseconds) logged for each completed request,  
- **So that** I can detect slow endpoints and performance regressions before they affect users.

### US-04: Mutation Audit Logging
- **As a** security administrator,  
- **I want** any write or create operation (such as `POST /posts`) to produce a distinct `AUDIT:` log entry containing the request ID, method, and endpoint,  
- **So that** administrative actions and data modifications are auditable.

### US-05: Standardized Resources & Controllers
- **As an** API consumer,  
- **I want** structured REST endpoints for managing posts (`GET /posts`, `POST /posts`) and users (`GET /users`),  
- **So that** I can consume application resources through standard JSON interfaces.

---

## 5. Functional Requirements

| ID | Requirement | Description | Priority |
|---|---|---|---|
| **FR-01** | Cryptographic Request ID Generation | Generate a cryptographically secure UUID using Node.js `crypto.randomUUID()` and set on `req.id` and `X-Request-Id` response header. | P0 |
| **FR-02** | Global Logger Middleware | Listen for the response `finish` event and log the formatted string: `[reqId] <METHOD> <PATH> <STATUS_CODE>`. | P0 |
| **FR-03** | Execution Timing Middleware | Record start timestamp on request ingress and compute elapsed milliseconds on `res.on('finish')`, logging `[reqId] <METHOD> <PATH> took <MS>ms`. | P0 |
| **FR-04** | Route-Level Audit Logging | Intercept state-mutating requests (`POST /posts`) and log `[reqId] AUDIT: <METHOD> <PATH>` before calling `next()`. | P0 |
| **FR-05** | JSON Body Parsing | Configure `express.json()` middleware to parse incoming JSON payloads into `req.body`. | P0 |
| **FR-06** | Posts Resource Endpoints | Support `GET /posts` (list posts) and `POST /posts` (create post with `201 Created` status). | P0 |
| **FR-07** | Users Resource Endpoints | Support `GET /users` (list users with `200 OK` status). | P1 |
| **FR-08** | Automated Testing & CI | Provide automated assertions for controller function exports and a GitHub Actions CI pipeline executing on push/PR. | P0 |

---

## 6. Non-Functional Requirements
- **Performance & Scalability:** Asynchronous event listeners (`res.on("finish")`) ensure zero blocking of the Node.js event loop during request execution.
- **Portability:** Built strictly using native Node.js standard libraries (`crypto`, `assert`) and Express.js, minimizing dependency vulnerabilities.
- **Maintainability:** Clear separation of concerns following MVC/middleware design patterns across `middleware/`, `routes/`, `controllers/`, and `tests/`.
- **Reliability:** CI validation verifies all controller exports and test passes prior to branch integration.

---

## 7. Assumptions, Dependencies & Constraints
- Runtime requires **Node.js 18.x or higher** for native `crypto.randomUUID()` support.
- Express.js 4.x is the primary web application framework.
- The service defaults to port `4000` unless overridden in configuration.
- Storage in this version is managed in-memory as a demonstration pipeline for observability instrumentation.

---

## 8. Future Scope & Roadmap (v2.0)
- **OpenTelemetry Integration:** Export metrics and spans directly to OpenTelemetry collectors (OTLP/gRPC).
- **Structured JSON Logging:** Support structured log envelopes (compatible with Winston, Pino, or Fluentd) with log level configuration (`INFO`, `WARN`, `ERROR`).
- **Distributed Context Propagation:** Parse incoming `traceparent` headers according to the W3C Trace Context specification.
- **Database Persistence:** Connect routes to PostgreSQL / Prisma ORM with automated query latency tracking.
