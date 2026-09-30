interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Worker izole örneğinde bellek içi IP tablosu
const ipStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function checkRateLimit(
  ip: string, 
  options: RateLimitOptions = { limit: 5, windowMs: 60_000 }
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = ipStore.get(ip);

  // Bellek temizliği (1000'den fazla IP birikirse süresi geçenleri temizle)
  if (ipStore.size > 1000) {
    for (const [key, value] of ipStore.entries()) {
      if (now > value.resetTime) ipStore.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    ipStore.set(ip, { count: 1, resetTime: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetInSec: Math.ceil(options.windowMs / 1000),
    };
  }

  if (record.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.max(0, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: options.limit - record.count,
    resetInSec: Math.ceil((record.resetTime - now) / 1000),
  };
}
