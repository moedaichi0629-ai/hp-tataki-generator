"use client";

// サーバーから発行された署名付きアップロードURLへ、ブラウザから直接ファイルをPUTする。
// Supabase StorageのAPIゲートウェイはこのエンドポイントでもapikeyヘッダを要求するため、
// 公開可能（anon/publishable）キーを付与する。このキーはブラウザに公開されて問題ない設計のもの。
// XMLHttpRequestを使うことで、fetchでは取得できないアップロード進捗イベントを利用できる。
export function uploadFileToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_SUPABASE_ANON_KEYが設定されていません。.env.localを確認してください。")
    );
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("cacheControl", "3600");
    formData.append("", file);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`アップロードに失敗しました（ステータス: ${xhr.status}）。`));
      }
    };
    xhr.onerror = () => reject(new Error("アップロード中にネットワークエラーが発生しました。"));
    xhr.onabort = () => reject(new Error("アップロードが中断されました。"));

    xhr.send(formData);
  });
}
