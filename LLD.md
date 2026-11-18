# Low-Level Design (LLD)

## Project: Observability Shield
- **Repository:** [observability-shield](https://github.com/pravindiranms140-lgtm/observability-shield)
- **Module Breakdown:** Middleware Pipeline, Route Handlers, Controllers, Test Specs, and Server Initialization

---

## 1. Directory Structure & File Hierarchy

```text
observability-shield/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Continuous integration workflow manifest
├── .gitignore                     # Git ignore definitions (node_modules, logs)
├── HLD.md                         # High-Level Design document
├── LLD.md                         # Low-Level Design document
├── PRD.md                         # Product Requirements Document
├── README.md                      # Project documentation and getting started guide
├── app.js                         # Application entrypoint & middleware orchestrator
├── package.json                   # Project metadata and test scripts
├── package-lock.json              # Pinned dependency lockfile
├── controllers/
│   ├── postsController.js         # Business logic for posts resource
│   └── usersController.js         # Business logic for users resource
├── middleware/
│   ├── auditWrite.js              # Route-level write audit logging
│   ├── logger.js                  # Request completion and status code logger
│   ├── requestId.js               # UUID generator & header injection
│   └── timing.js                  # Execution duration latency tracker
├── routes/
│   ├── posts.js                   # Express router for /posts endpoints
│   └── users.js                   # Express router for /users endpoints
└── tests/
    └── runTests.js                # Assertion test runner for controllers
```

---

## 2. Component & Middleware Specifications

### 2.1 `app.js` (Server & Pipeline Orchestrator)
- **File:** `app.js`
- **Role:** Configures Express application instance, registers global middleware in strict execution order, mounts modular routes, and starts HTTP listener on port `4000`.
- **Pipeline Registration Sequence:**
  1. `requestId` (Must be first to establish correlation ID)
  2. `logger` (Registers completion listener)
  3. `timing` (Captures start time and completion listener)
  4. `express.json()` (Parses JSON request bodies)
  5. Mount `/posts` router
  6. Mount `/users` router
- **Implementation:**
  ```javascript
  const express = require("express");
  const app = express();
  const requestId = require("./middleware/requestId");
  const logger = require("./middleware/logger");
  const timing = require("./middleware/timing");

  app.use(requestId);
  app.use(logger);
  app.use(timing);
  app.use(express.json());

  const postsRouter = require("./routes/posts");
  const usersRouter = require("./routes/users");

  app.use("/posts", postsRouter);
  app.use("/users", usersRouter);

  app.listen(4000, () => console.log("Server running on port 4000"));
  ```

---

### 2.2 `middleware/requestId.js` (Correlation Identifier)
- **File:** `middleware/requestId.js`
- **Responsibilities:**
  - Uses native Node.js `crypto.randomUUID()` to produce standard RFC 4122 v4 UUIDs.
  - Attaches UUID to `req.id` for downstream middleware and controller consumption.
  - Sets HTTP header `X-Request-Id` on the outgoing response.
  - Calls `next()` to proceed along the middleware chain.
- **Implementation:**
  ```javascript
  const { randomUUID } = require("crypto");

  function requestId(req, res, next) {
    req.id = randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
  }

  module.exports = requestId;
  ```

---

### 2.3 `middleware/logger.js` (Access Logging)
- **File:** `middleware/logger.js`
- **Responsibilities:**
  - Subscribes to the `res.on("finish")` event.
  - Formats log prefix using the first 8 characters of `req.id` (`[reqId]`).
  - Outputs standard access log: `<prefix> <METHOD> <PATH> <STATUS_CODE>` (e.g., `[8f38dd0d] GET /posts 200`).
  - Delegates execution immediately via `next()`.
- **Implementation:**
  ```javascript
  function logger(req, res, next) {
    res.on("finish", () => {
      const prefix = req.id ? "[" + req.id.slice(0, 8) + "]" : "";
      console.log(prefix + " " + req.method + " " + req.path + " " + res.statusCode);
    });
    next();
  }

  module.exports = logger;
  ```

---

### 2.4 `middleware/timing.js` (Execution Latency Tracker)
- **File:** `middleware/timing.js`
- **Responsibilities:**
  - Captures start epoch using `Date.now()` during ingress.
  - Registers a listener on `res.on("finish")` to calculate `Date.now() - start`.
  - Formats and outputs duration in milliseconds: `<prefix> <METHOD> <PATH> took <MS>ms` (e.g., `[8f38dd0d] GET /posts took 2ms`).
  - Calls `next()`.
- **Implementation:**
  ```javascript
  function timing(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      const prefix = req.id ? "[" + req.id.slice(0, 8) + "]" : "";
      console.log(prefix + " " + req.method + " " + req.path + " took " + ms + "ms");
    });
    next();
  }

  module.exports = timing;
  ```

---

### 2.5 `middleware/auditWrite.js` (State Mutation Auditor)
- **File:** `middleware/auditWrite.js`
- **Responsibilities:**
  - Intercepts state-modifying endpoints as a route-level middleware.
  - Formats prefix using `req.id` slice(0, 8).
  - Synchronously writes audit trail to stdout: `<prefix> AUDIT: <METHOD> <PATH>` (e.g., `[8f38dd0d] AUDIT: POST /posts`).
  - Calls `next()` to hand off control to the resource controller.
- **Implementation:**
  ```javascript
  function auditWrite(req, res, next) {
    const prefix = req.id ? "[" + req.id.slice(0, 8) + "]" : "";
    console.log(prefix + " AUDIT: " + req.method + " " + req.path);
    next();
  }

  module.exports = auditWrite;
  ```

---

### 2.6 Route Handlers & Controllers

#### A. Posts (`routes/posts.js` & `controllers/postsController.js`)
- `GET /posts`: Handled by `postsController.listPosts` (Returns JSON array of posts, HTTP 200).
- `POST /posts`: Protected by `auditWrite` middleware, followed by `postsController.createPost` (Returns newly created post object with HTTP 201).
```javascript
// routes/posts.js
const express = require("express");
const router = express.Router();
const auditWrite = require("../middleware/auditWrite");
const { listPosts, createPost } = require("../controllers/postsController");

router.get("/", listPosts);
router.post("/", auditWrite, createPost);

module.exports = router;
```

#### B. Users (`routes/users.js` & `controllers/usersController.js`)
- `GET /users`: Handled by `usersController.listUsers` (Returns JSON array of users, HTTP 200).
```javascript
// routes/users.js
const express = require("express");
const router = express.Router();
const { listUsers } = require("../controllers/usersController");

router.get("/", listUsers);

module.exports = router;
```

---

## 3. Data Contracts & API Schema

### 3.1 `GET /posts`
- **Request Headers:** None required
- **Response Headers:** `X-Request-Id: <UUID>`
- **Response Body:**
  ```json
  [
    {
      "id": 1,
      "title": "Hello World"
    }
  ]
  ```
- **Status:** `200 OK`

### 3.2 `POST /posts`
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "title": "Observability in Express"
  }
  ```
- **Response Headers:** `X-Request-Id: <UUID>`
- **Response Body:**
  ```json
  {
    "id": 2,
    "title": "Observability in Express"
  }
  ```
- **Status:** `201 Created`

### 3.3 `GET /users`
- **Response Headers:** `X-Request-Id: <UUID>`
- **Response Body:**
  ```json
  [
    {
      "id": 1,
      "name": "Sanjay"
    }
  ]
  ```
- **Status:** `200 OK`

---

## 4. Test Suite Specification (`tests/runTests.js`)
The test script verifies export contracts and function signatures across all controllers using native `assert`:
```javascript
const assert = require('assert');
const posts = require('../controllers/postsController');
const users = require('../controllers/usersController');

assert.strictEqual(typeof posts.listPosts, 'function');
assert.strictEqual(typeof posts.createPost, 'function');
assert.strictEqual(typeof users.listUsers, 'function');

console.log('All tests passed');
```
Execution is run via `npm test` and integrated into GitHub Actions CI (`.github/workflows/ci.yml`).
