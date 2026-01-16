import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  onScanningChange: (scanning: boolean) => void;
}

const QRScanner = ({ onScan, isScanning, onScanningChange }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  const startScanner = async () => {
    try {
      setError(null);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        setHasCamera(true);
        
        // Prefer back camera on mobile
        const backCamera = cameras.find(
          (c) => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("rear")
        );
        const cameraId = backCamera?.id || cameras[0].id;

        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {} // Ignore errors during scanning
        );
        
        onScanningChange(true);
      } else {
        setHasCamera(false);
        setError("Tidak ada kamera yang tersedia");
      }
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(err.message || "Gagal memulai kamera");
      onScanningChange(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      onScanningChange(false);
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        className={`w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-secondary ${
          !isScanning ? "hidden" : ""
        }`}
      />

      {!isScanning && (
        <div className="w-full aspect-square max-w-sm mx-auto rounded-xl bg-secondary flex flex-col items-center justify-center gap-4">
          {hasCamera ? (
            <>
              <Camera className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center px-4">
                Klik tombol di bawah untuk memulai scan
              </p>
            </>
          ) : (
            <>
              <CameraOff className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center px-4">
                Tidak ada kamera tersedia
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-center text-destructive text-sm bg-destructive/10 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-3">
        {!isScanning ? (
          <Button onClick={startScanner} variant="gold" className="gap-2">
            <Camera className="w-4 h-4" />
            Mulai Scan
          </Button>
        ) : (
          <>
            <Button onClick={stopScanner} variant="outline" className="gap-2">
              <CameraOff className="w-4 h-4" />
              Stop
            </Button>
            <Button
              onClick={async () => {
                await stopScanner();
                setTimeout(startScanner, 100);
              }}
              variant="secondary"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
