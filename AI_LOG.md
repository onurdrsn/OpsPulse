# AI_LOG — Engineering Decisions & AI Verification Audit

This log documents the interactive collaboration between human engineering judgment and AI tool assistance during the architectural scoping, development, and validation of the OpsPulse platform.

---

## 1. Strategy & Task Delegation

| Component | AI Role | Human Validation & Decision Oversight |
| :--- | :--- | :--- |
| **System Architecture** | Proposed single monolithic Next.js repository. | **Overridden by Engineer:** Pivoted to Cloudflare Monorepo (`apps/web` + `apps/worker`) utilizing edge compute and Neon serverless driver to simulate realistic production latency and separation of concerns. |
| **Database Integration** | Proposed Prisma Client with SQLite / generic Postgres adapter. | **Overridden by Engineer:** Replaced Prisma with Drizzle ORM (`drizzle-orm/neon-http`) to prevent Node.js engine compatibility issues and high cold-start binary footprint within Cloudflare V8 isolates. |
| **Styling & Tooling** | Recommended Tailwind CSS v3 with manual PostCSS configs. | **Overridden by Engineer:** Enforced Tailwind CSS v4 using Vite native plugin `@tailwindcss/vite` for faster compilation and zero boilerplate. |
| **Form UX & Accessibility** | Drafted basic HTML forms with standard state variables. | **Audited & Expanded:** Human identified missing WAI-ARIA accessibility requirements (`aria-invalid`, `aria-describedby`, `role="alert"`) and injected a defensive honeypot bot trap. |

---

## 2. Chronological Prompt & Decision History

### Phase 1: Architectural Scoping & Edge Migration
- **User Directive:** Shift from traditional Next.js fullstack single-app layout to a clean monorepo structure: `apps/web` (Cloudflare Pages) + `apps/worker` (Cloudflare Worker).
- **AI Action:** Scaffolded project structure, configured root `workspaces`, and integrated Hono edge router for backend API.
- **Verification Step:** Validated Hono routes using local Wrangler runtime (`npx wrangler dev`) ensuring standard web Request/Response handling without Node runtime leaks.

### Phase 2: Resolving TypeScript Enum Overload Conflict in Zod
- **Issue Discovered:** When defining enum validations in Zod for `serviceTypes`, TypeScript threw overload mismatches:
  ```text
  No overload matches this call. Object literal may only specify known properties, and 'errorMap' does not exist in type...
  ```
- **Root-Cause Analysis:** Modern Zod versions enforce strict types on enum tuples requiring `as const` assertions, while deprecated `errorMap` syntax triggers signature conflicts.
- **Resolution:**
  ```typescript
  // Before (AI initial suggestion - failed compilation):
  serviceType: z.enum(['incident-triage', 'workflow-automation'], { errorMap: () => (...) });

  // Corrected (Human verified & enforced):
  const serviceTypes = ['incident-triage', 'workflow-automation', ...] as const;
  serviceType: z.enum(serviceTypes, { message: 'Lütfen geçerli bir hizmet türü seçiniz.' });
  ```

### Phase 3: Tailwind CSS v4 vs. v3 Tooling Conflict
- **Issue Discovered:** Terminal command `npx tailwindcss init -p` threw `npm error could not determine executable to run` within the workspace directory.
- **Root-Cause Analysis:** The npm package installed was `tailwindcss@4.x`. In Tailwind v4, the legacy CLI initialization script and `postcss.config.js` / `tailwind.config.js` files are obsolete.
- **AI Stance:** Suggested rolling back to Tailwind v3.
- **Engineering Rejection:** Engineer strictly rejected downgrading to v3. Configured modern v4 native pipeline via `@tailwindcss/vite` plugin in `vite.config.ts` and `@import "tailwindcss";` in `index.css`.
- **Verification Step:** Confirmed that Vite styles reloaded in <50ms without generating configuration artifacts.

### Phase 4: Database Driver & Migration Verification (Neon + Drizzle)
- **Challenge:** Initial push prompted interactive terminal ambiguity:
  ```text
  Is leads table created or renamed from another table?
  + leads create table
  ~ playing_with_neon › leads rename table
  ```
- **Human Decision:** Selected `+ leads create table` to avoid schema contamination with pre-existing Neon sandbox tables.
- **Verification Step:** Executed `drizzle-kit push` followed by direct query validation through Drizzle Studio.

### Phase 5: Accessibility (A11y) & Defensive Security Audit
- **Review Criteria:** Evaluation mandates usable, accessible, verified form submission handling.
- **Human Addition:**
  1. Wrapped field-level validation errors with `role="alert"` and tied them to inputs via `aria-describedby` and `aria-invalid`.
  2. Implemented honeypot spam protection: `<input type="text" name="website" tabIndex={-1} autoComplete="off" />` to capture spam bots without imposing captcha frictions on valid users.
  3. Ensured success message only renders if HTTP status is strictly `201 Created` with a non-null database `recordId`.

---

## 3. Operational Integrity & Verification Summary

All code committed has undergone multi-step local and production verification:
- [x] TypeScript compilation: `tsc --noEmit` executed in both workspaces with zero warnings.
- [x] Production bundle test: `make build-web` generated optimized static assets in `apps/web/dist`.
- [x] Serverless execution test: Cloudflare Worker confirmed responding to live `GET /health` with HTTP 200.
- [x] Real-world database insertion: Submitted test inquiry verified inside Neon Postgres with persistent UUID generation.