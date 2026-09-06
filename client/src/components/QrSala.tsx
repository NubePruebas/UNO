export function QrSala({ url }: { url: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=8&data=${encodeURIComponent(url)}`;
  return (
    <img
      className="qr"
      src={src}
      width={168}
      height={168}
      alt="Código QR para unirse a la sala"
    />
  );
}
