import { lookup } from "dns/promises";
import { isIPv4, isIPv6 } from "net";

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 5000;

export class UnsafeUrlError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local / cloud metadata (169.254.169.254含む)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (carrier-grade NAT)
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true; // loopback
  if (normalized.startsWith("fe80:")) return true; // link-local
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local
  if (normalized.startsWith("::ffff:")) {
    // IPv4-mapped address
    return isPrivateIPv4(normalized.replace("::ffff:", ""));
  }
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (isIPv4(ip)) return isPrivateIPv4(ip);
  if (isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // 判定できない場合は安全側に倒して拒否
}

async function assertSafeHostname(hostname: string): Promise<void> {
  // IPリテラルが直接指定された場合はそのまま検証
  if (isIPv4(hostname) || isIPv6(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new UnsafeUrlError("プライベートIPアドレスへのアクセスは許可されていません。");
    }
    return;
  }

  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new UnsafeUrlError("ローカルホストへのアクセスは許可されていません。");
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError("URLのホスト名を解決できませんでした。");
  }

  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new UnsafeUrlError("このURLへはアクセスできません（プライベートアドレスに解決されました）。");
  }
}

function assertHttpsUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("URLの形式が正しくありません。");
  }
  if (url.protocol !== "https:") {
    throw new UnsafeUrlError("HTTPS形式のURLのみ登録できます。");
  }
  return url;
}

export interface SafeFetchResult {
  finalUrl: string;
  status: number;
  contentType: string | null;
  contentLength: number | null;
}

// 外部画像URLの安全性を検証したうえで、HEAD（不可の場合はRangeつきGET）で到達性とContent-Typeのみ確認する。
// 画像の実体はダウンロード・保存しない。
export async function checkExternalImageUrl(rawUrl: string): Promise<SafeFetchResult> {
  let current = assertHttpsUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeHostname(current.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(current.toString(), {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; hp-tataki-generator/1.0)" },
      });
      // HEADに対応していないサーバー向けのフォールバック（本文はRange指定で先頭1バイトのみ取得）
      if (res.status === 405 || res.status === 501) {
        res = await fetch(current.toString(), {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; hp-tataki-generator/1.0)",
            Range: "bytes=0-0",
          },
        });
      }
    } catch {
      throw new UnsafeUrlError("画像URLへの接続に失敗しました。URLを確認してください。");
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new UnsafeUrlError("リダイレクト先が取得できませんでした。");
      current = new URL(location, current);
      if (current.protocol !== "https:") {
        throw new UnsafeUrlError("リダイレクト先がHTTPSではありません。");
      }
      continue;
    }

    if (!res.ok) {
      throw new UnsafeUrlError(`画像URLの取得に失敗しました（ステータス: ${res.status}）。`);
    }

    const contentType = res.headers.get("content-type");
    await res.body?.cancel().catch(() => undefined);

    if (!contentType || !contentType.startsWith("image/")) {
      throw new UnsafeUrlError("このURLは画像として認識できませんでした（Content-Typeが画像ではありません）。");
    }

    const contentLength = res.headers.get("content-length");
    return {
      finalUrl: current.toString(),
      status: res.status,
      contentType,
      contentLength: contentLength ? Number(contentLength) : null,
    };
  }

  throw new UnsafeUrlError("リダイレクトの回数が上限を超えました。URLを確認してください。");
}
