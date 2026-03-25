import { NextRequest, NextResponse } from 'next/server'

/**
 * MercadoLibre webhook notifications receiver.
 *
 * ML sends POST notifications when subscribed topics change
 * (items, catalog, etc). We log them for now and can process later.
 *
 * Docs: https://developers.mercadolibre.com.ar/es_ar/product-manage-notifications
 */

interface MLNotification {
  _id: string
  resource: string
  user_id: number
  topic: string
  application_id: number
  attempts: number
  sent: string
  received: string
}

export async function POST(request: NextRequest) {
  try {
    const notification: MLNotification = await request.json()

    console.log(`[ml-webhook] ${notification.topic}: ${notification.resource}`)

    // Process based on topic
    switch (notification.topic) {
      case 'items':
        // Product was updated — could refresh cached data
        console.log(`[ml-webhook] Item changed: ${notification.resource}`)
        break

      case 'questions':
        console.log(`[ml-webhook] Question on: ${notification.resource}`)
        break

      default:
        console.log(`[ml-webhook] Unhandled topic: ${notification.topic}`)
    }

    // ML expects 200 OK, otherwise it retries
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[ml-webhook] Error processing notification:', error)
    // Still return 200 to prevent ML from retrying bad payloads
    return NextResponse.json({ received: true })
  }
}

// ML may send a GET to verify the endpoint exists
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
