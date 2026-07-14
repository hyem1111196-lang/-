import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface Props {
  text: string;
  size?: number;
}

/** 텍스트(URL)를 QR 코드 이미지로 렌더링. 현장에서 폰으로 스캔해 도구를 즉시 공유. */
export function QrImage({ text, size = 168 }: Props) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: "#0a1d38", light: "#ffffff" },
    })
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => setSrc(""));
    return () => {
      alive = false;
    };
  }, [text, size]);

  if (!src) return <div className="qr qr--loading" style={{ width: size, height: size }} />;
  return <img className="qr" src={src} width={size} height={size} alt="이 도구 접속 QR 코드" />;
}
