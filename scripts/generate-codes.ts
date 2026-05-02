import { PrismaClient } from '@prisma/client';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool as PgPool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import ws from 'ws';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

neonConfig.webSocketConstructor = ws;

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
const isNeon = connectionString.includes('neon.tech');

let adapter;
if (isNeon) {
  const pool = new NeonPool({ connectionString });
  adapter = new PrismaNeon(pool as any);
} else {
  const pool = new PgPool({ connectionString });
  adapter = new PrismaPg(pool);
}
const prisma = new PrismaClient({ adapter });
const BASE_URL = process.env.BASE_URL || 'https://demo.example.com';

// Säkert alfabet: Undviker O/0, I/1 och svårlästa tecken
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRandomCode(length: number): string {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}

async function main() {
  const companyName = process.argv[2];
  const courseId = process.argv[3];
  const countStr = process.argv[4];

  if (!companyName || !courseId || !countStr) {
    console.error('❌ Användning: npx tsx scripts/generate-codes.ts "Företagsnamn" "kurs_id" "antal"');
    console.error('Exempel: npx tsx scripts/generate-codes.ts "Acme Corp" compliance_01 50');
    process.exit(1);
  }

  const count = parseInt(countStr, 10);
  if (isNaN(count) || count <= 0) {
    console.error('❌ Ogiltigt antal.');
    process.exit(1);
  }

  try {
    // 1. Validera att kursen existerar
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      console.error(`❌ Kursen med ID "${courseId}" hittades inte i databasen.`);
      process.exit(1);
    }

    // 2. Skapa License
    console.log(`⏳ Skapar licens för ${companyName}...`);
    const license = await prisma.license.create({
      data: {
        companyName,
        courseId: course.id,
        totalCodes: count,
        usedCodes: 0,
      },
    });

    // 3. Generera unika koder
    console.log(`⏳ Genererar ${count} unika koder...`);
    const newAccessCodes = [];
    const newEnrollments = [];
    const csvRows = [
      ['Kod', 'Länk', 'Kurs', 'Företag']
    ];

    const coursePrefix = courseId.split('_')[0].toUpperCase();

    // Kontrollera mot befintliga för att undvika kollision
    const existingCodesRaw = await prisma.accessCode.findMany({ select: { code: true } });
    const existingCodes = new Set(existingCodesRaw.map(c => c.code));

    for (let i = 0; i < count; i++) {
      let code;
      let collisionAttempts = 0;
      
      // Retry-loop för kollisionsskydd
      do {
        code = `${coursePrefix}-${generateRandomCode(4)}-${generateRandomCode(4)}`;
        collisionAttempts++;
        if (collisionAttempts > 10) {
          throw new Error('För många kollisioner vid kodgenerering.');
        }
      } while (existingCodes.has(code));

      existingCodes.add(code); // Markera som upptagen i lokalt minne
      
      newAccessCodes.push({
        code,
        licenseId: license.id,
      });

      newEnrollments.push({
        accessCodeId: code,
        courseId: course.id,
      });

      const magicLink = `${BASE_URL}/login?code=${code}`;
      csvRows.push([code, magicLink, course.title, companyName]);
    }

    // 4. Prisma Transaction (ACID)
    console.log(`⏳ Skriver koder och registreringar till databasen...`);
    await prisma.$transaction([
      prisma.accessCode.createMany({ data: newAccessCodes }),
      prisma.enrollment.createMany({ data: newEnrollments }),
    ]);

    // 5. Exportera till CSV
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedCompanyName = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedCompanyName}_${courseId}_${count}_koder_${dateStr}.csv`;
    const filePath = path.join(exportsDir, fileName);

    // Formatera CSV: separera med semikolon för svensk Excel-kompatibilitet
    // Skydda mot CSV Injection (formler som börjar på =, +, -, @)
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        let safeCell = cell;
        if (/^[=+\-@]/.test(safeCell)) {
          safeCell = `'${safeCell}`;
        }
        return `"${safeCell.replace(/"/g, '""')}"`;
      }).join(';')
    ).join('\n');
    fs.writeFileSync(filePath, '\uFEFF' + csvContent, 'utf-8'); // \uFEFF = UTF-8 BOM för Excel

    console.log(`✅ Succé! ${count} koder skapades för ${companyName}.`);
    console.log(`📄 Fil exporterad till: ${filePath}`);
    console.log(`🔗 Dashboard-länk att maila till kunden: ${BASE_URL}/dashboard/${license.dashboardKey}`);

  } catch (error) {
    console.error('❌ Ett fel uppstod:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
