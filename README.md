<div align="center">

# 🛡️ BioShield MFA — Cyber Security Project

**A Privacy-Preserving, Multi-Factor Biometric Authentication System**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Authentication Flows](#authentication-flows)
- [Security Model](#security-model)

---

## Overview

BioShield MFA is a comprehensive, enterprise-grade Multi-Factor Authentication system that combines traditional credentials with privacy-preserving biometric verification and risk-adaptive access controls. It demonstrates advanced cyber security principles including cancellable biometric templates, envelope encryption via AWS KMS, and real-time behavioral analytics.

---

## Features

| Feature | Description |
|---|---|
| **Risk-Adaptive Login** | Dynamic risk scoring based on device fingerprints, behavioral analytics, and network context |
| **Biometric Enrollment & Verification** | Privacy-preserving face & voice biometric templates using SHE-256 homomorphic encryption |
| **Envelope Encryption (KMS)** | Per-record Data Encryption Keys (DEK) sealed by AWS KMS Master Keys (KEK) |
| **Cancellable Biometric Templates** | HMAC-based transforms ensure templates can be revoked and re-issued without re-enrollment |
| **QR Code Cross-Device Login** | Scan-to-login flow with session polling and one-time-use tokens |
| **Admin Dashboard** | Role-based user lifecycle management, security policy controls, and forensic deepfake analysis |
| **Behavioral Analytics** | Keystroke dynamics & typing cadence analysis for bot detection |
| **Cryptographic Audit Logs** | Append-only, digitally signed audit trail for tamper evidence |

---

## Tech Stack

### Backend
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Security**: Helmet, Express Rate Limit, Argon2, bcrypt, JWT
- **Encryption**: AES-256-GCM, HKDF-SHA512, AWS KMS SDK

### Frontend
- **Framework**: React 19
- **Bundler**: Vite
- **UI**: Lucide Icons, Recharts
- **Biometrics**: face-api.js, Meyda (audio analysis)
- **Routing**: React Router DOM

---

## Architecture

```
┌─────────────────┐      HTTPS/TLS 1.3      ┌──────────────────────┐
│   React Client  │ ◀──────────────────────▶ │   Express Backend    │
│   (Vite SPA)    │                          │   (TypeScript)       │
└─────────────────┘                          └──────────┬───────────┘
                                                        │
                                          ┌─────────────┼─────────────┐
                                          ▼             ▼             ▼
                                   ┌────────────┐ ┌──────────┐ ┌──────────┐
                                   │ PostgreSQL │ │ AWS KMS  │ │  Audit   │
                                   │  (Prisma)  │ │ (Envelope│ │  Logs    │
                                   │            │ │  Encrypt)│ │ (Signed) │
                                   └────────────┘ └──────────┘ └──────────┘
```

---

## Project Structure

```
BioShield-MFA CSP/
├── backend/
│   ├── prisma/              # Database schema & migrations
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── middleware.ts     # Auth & security middleware
│   │   ├── biometrics.ts     # Biometric processing
│   │   ├── kms.ts            # KMS envelope encryption
│   │   └── index.ts          # Server entry point
│   ├── scripts/             # DB init & utility scripts
│   ├── .env.example         # Environment variable template
│   └── package.json
├── frontend/
│   ├── components/          # React UI components
│   ├── pages/               # Page-level components
│   ├── services/            # API client services
│   ├── public/              # Static assets
│   ├── index.html           # SPA entry point
│   └── package.json
├── auth_flows.md            # Detailed authentication flow documentation
├── .gitignore
└── README.md
```

---

## Setup & Installation

### Prerequisites
- **Node.js** v18 or higher
- **PostgreSQL** 15+
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/RishvinReddy/BioShield-MFA.git
cd BioShield-MFA
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env    # Edit .env with your database & KMS credentials
npx prisma migrate dev  # Run database migrations
npm run dev             # Start backend on http://localhost:8080
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev             # Start frontend on http://localhost:5173
```

---

## Authentication Flows

Detailed documentation of all authentication flows is available in [`auth_flows.md`](auth_flows.md), covering:

1. **Risk-Adaptive Login** — Dynamic risk scoring with device trust, behavioral analysis, and auto-blocking
2. **Privacy-Preserving Biometric Enrollment** — SHE-256 template protection with envelope encryption
3. **Biometric Verification (1:N Match)** — Secure matching without template decryption
4. **QR Code Cross-Device Login** — Scan-to-approve session authentication
5. **System Administration & Audit** — Admin controls and forensic deepfake analysis

---

## Security Model

| Layer | Implementation |
|---|---|
| **Data at Rest** | AES-256-GCM with per-record DEKs, sealed by KMS Master Key |
| **Template Protection** | SHE-256 Cancellable Transforms (HKDF-SHA512 derived keys) |
| **Transport** | TLS 1.3 required, mTLS recommended for high-assurance |
| **Authentication** | Argon2/bcrypt password hashing, JWT with refresh tokens |
| **Authorization** | Role-based access control (Admin/User) with strict middleware |
| **Anti-Spoofing** | Liveness detection scores, deepfake forensic analysis |
| **Audit** | Append-only logs with cryptographic signatures |
| **Rate Limiting** | Express rate limiter on sensitive endpoints |

---

<div align="center">

**Built for Cyber Security Project — BioShield MFA**

</div>
