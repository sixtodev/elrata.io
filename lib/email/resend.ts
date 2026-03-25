import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

interface PriceAlertEmailData {
  to: string
  productName: string
  targetPrice: number
  currentPrice: number
  currency: string
  store: string
  url: string
}

export async function sendPriceAlert(data: PriceAlertEmailData) {
  const resend = getResend()
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'alertas@elrata.io',
    to: data.to,
    subject: `🐀 ¡Alerta! ${data.productName} bajó a ${data.currency} ${data.currentPrice}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 8px;">
        <h1 style="color: #b0d614;">🐀 ¡Tu alerta se activó!</h1>
        <p>El precio de <strong>${data.productName}</strong> bajó a <strong>${data.currency} ${data.currentPrice}</strong> en ${data.store}.</p>
        <p>Tu precio objetivo era: <strong>${data.currency} ${data.targetPrice}</strong></p>
        <a href="${data.url}" style="display: inline-block; background: #b0d614; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ver oferta →</a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #999;">Esta alerta fue configurada en elrata.io.</p>
      </div>
    `,
  })
}
