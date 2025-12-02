import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body

    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !phoneNumber) {
      console.warn('Twilio credentials not configured, SMS not sent')
      return NextResponse.json({ 
        success: false, 
        error: 'Twilio not configured' 
      }, { status: 500 })
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken)

    // Send SMS
    const result = await client.messages.create({
      body: message,
      to,
      from: phoneNumber,
    })

    console.log('SMS sent successfully:', result.sid)

    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error: any) {
    console.error('Error sending SMS:', error)
    return NextResponse.json({ 
      error: 'Failed to send SMS',
      details: error.message 
    }, { status: 500 })
  }
}
