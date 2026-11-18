# Observability Shield

Comprehensive Express middleware pipeline implementation providing end-to-end request tracing, lifecycle logging, execution timing, and mutation auditing.

---

## 📚 Project Documentation
- [**Product Requirements Document (PRD)**](./PRD.md)
- [**High-Level Design (HLD)**](./HLD.md)
- [**Low-Level Design (LLD)**](./LLD.md)

---

## 🚀 Features
- **Correlation Tracking (`requestId`):** Cryptographic UUID assigned to every request and returned in `X-Request-Id` response header.
- **Access Logging (`logger`):** Non-blocking response lifecycle logger recording method, path, and HTTP status code.
- **Performance Profiling (`timing`):** High-precision millisecond latency measurement emitted upon response completion.
- **Security Audit Trail (`auditWrite`):** Dedicated audit middleware for state-mutating endpoints (`POST /posts`).
- **REST Endpoints:** Modular routes and controllers for `/posts` and `/users`.
- **Automated CI/CD:** Continuous Integration via GitHub Actions running tests on Node.js 18.

---

## 🛠️ Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Start Application
```bash
npm start
```
Server runs on `http://localhost:4000`.
