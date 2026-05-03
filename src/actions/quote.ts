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
      return { error: 'All fields must be filled.' }
    }

    // Lookup the course name based on ID for a nicer email
    const course = courses.find(c => c.id === selectedCourseId)
    const courseTitle = course ? course.title : selectedCourseId

    // OBS: För Resend Free Tier kan du bara skicka till din verifierade e-post.
    // Vi skickar till avsändaren som fallback för demo-syfte om ingen admin-mail är satt.
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com' // Placeholder för din verifierade mail

    await resend.emails.send({
      from: 'Acme Enterprise <noreply@acme-enterprise.com>',
      to: [adminEmail],
      subject: `New quote request: ${courseTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #171717;">New quote request received</h2>
          <p style="color: #666;">A new request has been submitted via the website.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #171717;">Company:</td>
              <td style="padding: 8px 0;">${companyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #171717;">Contact:</td>
              <td style="padding: 8px 0;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #171717;">Course:</td>
              <td style="padding: 8px 0;">${courseTitle} (${selectedCourseId})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #171717;">Licenses:</td>
              <td style="padding: 8px 0;">${licenses}</td>
            </tr>
          </table>
          <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; font-size: 12px; color: #999;">
            This is an automated message from Acme Enterprise.
          </div>
        </div>
      `
    })

    return { success: true }
  } catch (error) {
    console.error('Quote request error:', error)
    return { error: 'An error occurred while sending the quote request. Please check your Resend API key.' }
  }
}
