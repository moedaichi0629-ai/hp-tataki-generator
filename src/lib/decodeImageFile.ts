"use client";

export interface DecodedImageInfo {
  width: number;
  height: number;
}

// ブラウザのImageデコードを利用して寸法取得と破損チェックを兼ねる（デコードに失敗する=壊れたファイルとみなす）
export function decodeImageFile(file: File): Promise<DecodedImageInfo> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像ファイルが破損しているか、対応していない形式です。"));
    };
    img.src = url;
  });
}
