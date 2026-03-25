import { NextRequest, NextResponse } from 'next/server'
import { analyzeSearchResults } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { results, product, purpose, budget, country } = await req.json()

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'No results to analyze' },
        { status: 400 }
      )
    }

    const analysis = await analyzeSearchResults(
      results,
      product,
      purpose || '',
      budget,
      country
    )

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('[analyze] Error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}
