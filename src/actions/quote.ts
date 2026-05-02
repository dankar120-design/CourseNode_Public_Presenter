'use server'

import { Resend } from 'resend'
import { courses } from '@/data/coursesData'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function requestQuote(formData: FormData) {
  try {
    const companyName = formData.get('company_name') as string
    const licenses = formData.get('licenses') as string
    const selectedCourseId = formData.get('selected_course') as string
    const userEmail = formData.get('user_email') as string

    if (!companyName || !licenses || !selectedCourseId || !userEmail) {
      return { error: 'Alla fält måste fyllas i.' }
    }

    // Slå upp kursnamnet baserat på ID för ett snyggare mail
    const course = courses.find(c => c.id === selectedCourseId)
    const courseTitle = course ? course.title : selectedCourseId

    // OBS: För Resend Free Tier kan du bara skicka till din verifierade e-post.
    // Vi skickar till avsändaren som fallback för demo-syfte om ingen admin-mail är satt.
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com' // Placeholder för din verifierade mail

    await resend.emails.send({
      from: 'Acme Enterprise <noreply@acme-enterprise.com>',
      to: [adminEmail],
      subject: `Ny offertförfrågan: ${courseTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #003366;">Ny offertförfrågan mottagen</h2>
          <p style="color: #666;">En ny förfrågan har kommit in via webbplatsen.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #003366;">Företag:</td>
              <td style="padding: 8px 0;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #003366;">Kontakt:</td>
              <td style="padding: 8px 0;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #003366;">Kurs:</td>
              <td style="padding: 8px 0;">${courseTitle} (${selectedCourseId})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #003366;">Antal licenser:</td>
              <td style="padding: 8px 0;">${licenses} st</td>
            </tr>
          </table>
          <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; font-size: 12px; color: #999;">
            Detta är ett automatiskt meddelande från Acme Enterprise.
          </div>
        </div>
      `
    })

    return { success: true }
  } catch (error) {
    console.error('Quote request error:', error)
    return { error: 'Ett fel inträffade när offertförfrågan skulle skickas. Kontrollera Resend API-nyckel.' }
  }
}
