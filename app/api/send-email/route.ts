import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, text, html } = body

    // Check if SendGrid is configured
    const sendGridApiKey = process.env.SENDGRID_API_KEY
    if (!sendGridApiKey) {
      console.warn('SendGrid API key not configured, email not sent')
      return NextResponse.json({ 
        success: false, 
        error: 'SendGrid not configured' 
      }, { status: 500 })
    }

    // Configure SendGrid
    sgMail.setApiKey(sendGridApiKey)

    // Send email
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@tilmail.com',
      subject,
      text,
      html: html || text,
    }

    await sgMail.send(msg)
    console.log('Email sent successfully to:', to)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 })
  }
}
