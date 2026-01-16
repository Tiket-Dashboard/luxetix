import { QRCodeSVG } from "qrcode.react";

interface TicketQRCodeProps {
  ticketCode: string;
  orderId: string;
  size?: number;
}

const TicketQRCode = ({ ticketCode, orderId, size = 150 }: TicketQRCodeProps) => {
  // QR code contains ticket verification data
  const qrData = JSON.stringify({
    ticketCode,
    orderId,
    timestamp: Date.now(),
  });

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl">
      <QRCodeSVG
        value={qrData}
        size={size}
        level="H"
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#000000"
      />
      <p className="text-xs text-gray-600 font-mono text-center break-all max-w-[180px]">
        {ticketCode.slice(0, 8)}...{ticketCode.slice(-4)}
      </p>
    </div>
  );
};

export default TicketQRCode;
