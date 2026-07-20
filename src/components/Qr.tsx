import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrProps {
  value: string;
  size?: number;
  /** module (dark) color */
  color?: string;
}

/** Renders a QR code for `value` as a data-URL <img>. Blue modules on a
 *  transparent background so it sits on the card like in the visual. */
export function Qr({ value, size = 215, color = '#8ad1eb' }: QrProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setDataUrl('');
      return;
    }
    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size * 2,
      color: { dark: color, light: '#00000000' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, color]);

  return (
    <div className="qr" style={{ width: size, height: size }}>
      {dataUrl ? <img src={dataUrl} alt="Invoice QR code" /> : null}
    </div>
  );
}
