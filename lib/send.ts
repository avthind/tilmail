export interface SendOptions {
  cardId: string
  recipient: string
  type: 'email'
  message?: string
}

export async function sendCard(options: SendOptions): Promise<boolean> {
  const { cardId, recipient, type, message } = options
  const shareUrl = `${window.location.origin}/card/${cardId}`

  // Only email is supported now (SMS removed in favor of native sharing)
  if (type === 'email') {
    console.log('Sending email to:', recipient, 'with link:', shareUrl)
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: 'You received a TILMail postcard!',
          text: message || `Check out your postcard: ${shareUrl}`,
          html: `<p>${message || 'You received a postcard!'}</p><p><a href="${shareUrl}">View your postcard</a></p>`,
        }),
      })
      return response.ok
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  return false
}

