import type { ZodError } from 'zod'
import { NextResponse } from 'next/server'

export function zodValidationError(error: ZodError) {
  const message = error.issues
    .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
    .join(', ')
  return NextResponse.json(
    { error: message, code: 'VALIDATION_ERROR' },
    { status: 400 }
  )
}
