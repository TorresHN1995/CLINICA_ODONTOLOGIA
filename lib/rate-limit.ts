/**
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, use Redis instead.
 */
const requests = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requests.entries()) {
    if (now > value.resetTime) {
      requests.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = requests.get(identifier)

  if (!record || now > record.resetTime) {
    requests.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: limit - record.count }
}

export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return ip
}
