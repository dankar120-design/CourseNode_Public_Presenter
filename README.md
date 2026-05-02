# Acme Enterprise Compliance Portal

A Zero-Trust B2B compliance training platform built for high-security environments.

This repository serves as a proof-of-concept for a modern, serverless learning management system (LMS) that prioritizes operational security (OpSec), data minimization, and deterministic behavior.

> **Live Demo:** [Deploy to Vercel to get your link]  
> **Demo Access Code:** `DEMO-COMPLIANCE`

---

## Architecture & Core Concepts

The architecture is built around four technical pillars, designed specifically to solve compliance and privacy challenges in sensitive supply chains:

### 1. Data Minimization (Privacy by Design)
Traditional training platforms require end-users to register with emails and passwords, creating an unnecessary repository of Personally Identifiable Information (PII). 
This platform utilizes a **Zero-Knowledge** authentication model. The `schema.prisma` relies entirely on cryptographically secure, single-use `AccessCode` entities as Foreign Keys. There is no `User` table. The platform knows *a code* passed an exam, but never *who* used it.

### 2. Supply Chain Privacy (TPRM)
In high-security sectors (infrastructure, defense), contractors cannot risk leaking their personnel rosters to third-party SaaS vendors. By utilizing pseudonymized access codes, this platform acts as a secure buffer for **Third-Party Risk Management (TPRM)**. The mapping between an employee's real identity and their access code exists only on the purchasing client's internal HR network, entirely air-gapped from this platform. 

### 3. Content Decoupling (Deterministic Validation)
To guarantee 100% deterministic behavior and prevent runtime hallucinations, this platform is intentionally decoupled from live AI dependencies.
Course content is generated offline via LLMs into strict JSON schemas. At runtime, the React engine parses the `data/courses/*.json` payloads, validating them via **Zod** before rendering. This ensures type safety and predictable operational behavior in sensitive environments.

### 4. End-to-End Compliance Lifecycle
A compliance platform is only as good as its audit trail. This architecture includes a server-side Certificate Engine built with `pdf-lib`. Upon successful exam completion, the server dynamically generates a tamper-evident PDF certificate bound to the pseudonymous ID, complete with dynamic validity periods and strict download rate-limiting.

---

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Database:** Prisma ORM + Neon (Serverless PostgreSQL)
*   **Styling:** Tailwind CSS + Radix UI Primitives
*   **Validation:** Zod
*   **PDF Generation:** pdf-lib
*   **Email:** Resend

---

## Getting Started

To run this project locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   Configure your `.env` with a PostgreSQL connection string and run:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Author's Note & Philosophy

This architecture reflects my professional background in crisis operations, police staff work, and operational security. When building systems for high-stakes environments, the primary risk is rarely a lack of features; it is an over-extension of trust and data sprawl. 

This platform was built to demonstrate that "Privacy by Design" and "Operational Security" are not just policies—they are architectural primitives that must be embedded in the code from day one.

[Connect with me on LinkedIn](https://www.linkedin.com/)
