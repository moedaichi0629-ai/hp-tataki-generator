// サーバーレス環境ではインスタンスが複数存在しうるため完全なレート制限にはならないが、
// 同一インスタンスへの短時間の連続リクエスト・二重送信を抑止するベストエフォート実装。
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true };
}

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
