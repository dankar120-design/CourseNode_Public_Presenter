# Architecture Map: Acme Enterprise (Compliance Portal)

## 1. Trädstruktur (Kärnkomponenter)
```text
/workspace/Acme_Enterprise_Portal
│   .env
│   prisma.config.ts         # DB konfiguration (utan hårdkodade url:er)
│
├───data
│   └───courses
│           enterprise_compliance.json  # Kurs-payload (Compliance)
│
├───prisma
│       schema.prisma        # Databasmodeller (Course, License, AccessCode, Enrollment)
│       seed.ts              # Utvecklingsscript för DEMO-COMPLIANCE
│
├───scripts
│       generate-codes.ts    # CLI-script för att sälja licenser/generera accesskoder
│
├───public
│   └───images
│       └───course           # Kod-genererade SVG/PNG hero-bilder (Asset Pipeline)
│
└───src
    ├───actions              # Next.js Server Actions (Backend-logik)
    │       auth.ts          # Inloggning, JWT-generering och Demo-reset
    │
    ├───app
    │   ├───api              # Route Handlers
    │   ├───course           # Själva LMS-motorn (progress, examination, moduler)
    │   ├───dashboard
    │   │   └───[key]        # Zero-Knowledge B2B Dashboard (page.tsx visar kurs & statistik)
    │   └───login            # Portal med DEMO-ingångar
    │
    └───lib
            prisma.ts        # Prisma Client singleton
```

## 2. Komponent-index & Ansvar

| Fil / Mapp | Ansvar | Beroenden |
| :--- | :--- | :--- |
| `prisma/schema.prisma` | **Kärnarkitektur**. `License` 1:1 `Course`. `AccessCode` 1:N `License`. | PostgreSQL |
| `data/courses/*.json` | **DNA**. Utgör hela plattformens innehåll. Renderas iterativt av LMS-motorn. | JSON/Markdown |
| `src/actions/auth.ts` | **Auth & Progress**. Skapar JWT-cookies, nollställer test-konton via `NEXT_PUBLIC_DEMO_MODE`. | Jose, Prisma |
| `src/app/course/` | **LMS**. Läser json-data, spårar moduler, blockerar framsteg vid fail. | Next.js, React |
| `src/app/dashboard/[key]` | **B2B Uppföljning**. Klientunik vy som listar kursens aktiverade/slutförda koder. | Prisma `findUnique` |
| `scripts/generate-codes.ts` | **Försäljning**. Skapar nya licenser knutna till `courseId` och exporterar CSV-filer till kunden. | Node (tsx) |
| `public/images/course/` | **Asset Pipeline**. Genererade B2B-plattor (hero-bilder) för kursmoduler. | Sharp / SVG |

## 3. Logiska Flöden (Data Pipeline)

- **B2B Försäljning**: Systemadministratör kör `generate-codes.ts`. Företag (License) köper X platser av `compliance_01`. Systemet genererar X st unika `AccessCodes` och en gemensam `dashboardKey`.
- **Slutanvändare Autentisering**: Anställd anger `AccessCode` på `/login`. `auth.ts` verifierar koden. Om det är en DEMO-kod + dev-läge, återställs kursen. Annars skapas en JWT och användaren skickas till `/course`.
- **Inlärningsflödet**: `course/page.tsx` pusslar ihop användarens JWT-data med JSON-strukturen från databasen (`course.content`). Systemet loggar progress i Prisma under `Enrollment`.
- **Klient-Dashboard**: HR/Chefen får länk `/dashboard/<dashboardKey>`. Kan se kursnamn (`license.course.title`) och antal koder som är in_progress/completed. Pseudonymiserat (Zero-Knowledge) för GDPR.
- **Arkitektoniskt Skyddsvall (Data/App Separation)**: Kursinnehållet är helt frikopplat från Next.js kodbasen. Kurser lever i `data/courses/` som JSON och migreras till databasens `content`-fält. Möjliggör autonom AI-generering.

## 4. Produktionsmiljö & Infrastruktur (Vercel + Supabase)

- **Hosting (Vercel)**: Next.js App Router (version 15/16). Kräver `"postinstall": "prisma generate"` i `package.json` för att säkerställa att PrismaClient finns tillgänglig innan TypeScript gör sin Typecheck under build-fasen.
- **Databas (Supabase)**: Cloud PostgreSQL.
- **Connection Pooling**: Vercel-appen ansluter via Pooler URL (`?pgbouncer=true`) med variabeln `DATABASE_URL`.
- **Migrationer (Prisma 7)**: Eftersom schema.prisma i Prisma 7 inte stödjer hårdkodade directUrl:er längre, styr vi migreringar (t.ex. `npx prisma db push`) via `prisma.config.ts` som explicit prioriterar `DIRECT_URL` lokalt för att undvika pgbouncer-restriktioner.
- **Preview-Skydd**: Staging-miljön skyddas av Vercel Edge Middleware via variablerna `ENABLE_PREVIEW_LOCK` och `PREVIEW_PASSWORD`, vilket agerar som en Zero-Maintenance "under konstruktion"-vägg fram till go-live.
