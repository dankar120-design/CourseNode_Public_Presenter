import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This seed script is destructive and cannot be run in production.')
  }

  // Clear existing data (due to constraints, delete in order)
  await prisma.enrollment.deleteMany()
  await prisma.accessCode.deleteMany()
  await prisma.license.deleteMany()
  await prisma.course.deleteMany()

  console.log('Cleared existing data.')

  // Read generic course data from JSON
  const courseDataPath = path.join(process.cwd(), 'data', 'courses', 'enterprise_compliance.json')
  const courseContent = JSON.parse(fs.readFileSync(courseDataPath, 'utf8'))

  // Create Generic Course Mock Data
  const course = await prisma.course.create({
    data: {
      id: 'compliance_01',
      title: 'Enterprise Risk Management',
      type: 'ONLINE',
      content: courseContent
    }
  })

  console.log(`Created course: ${course.title}`)

  // Create License
  const license = await prisma.license.create({
    data: {
      companyName: 'Acme Enterprise',
      dashboardKey: 'demo-enterprise-dash',
      courseId: course.id,
      totalCodes: 1,
      usedCodes: 1,
    }
  })

  // Create AccessCode
  const accessCode = await prisma.accessCode.create({
    data: {
      code: 'DEMO-COMPLIANCE',
      licenseId: license.id
    }
  })

  // Create Enrollment tying the AccessCode to the Course
  await prisma.enrollment.create({
    data: {
      accessCodeId: accessCode.code,
      courseId: course.id,
      status: 'NOT_STARTED',
    }
  })

  console.log(`Created mock AccessCode: ${accessCode.code} and linked to Course via Enrollment.`)

  console.log('\n--- DEMO URLS ---')
  console.log(`Dashboard: http://localhost:3000/dashboard/${license.dashboardKey}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
