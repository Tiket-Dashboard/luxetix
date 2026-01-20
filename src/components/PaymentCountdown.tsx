import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface PaymentCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const PaymentCountdown = ({ expiresAt, onExpired }: PaymentCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        onExpired?.();
        return;
      }

      setTimeLeft({
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.total > 0 && timeLeft.hours === 0 && timeLeft.minutes < 30;

  if (isExpired) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">Waktu pembayaran telah habis</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isUrgent 
        ? "bg-orange-500/10 border-orange-500/30" 
        : "bg-primary/5 border-primary/20"
    }`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Clock className={`w-5 h-5 ${isUrgent ? "text-orange-500 animate-pulse" : "text-primary"}`} />
        <span className={`text-sm font-medium ${isUrgent ? "text-orange-500" : "text-foreground"}`}>
          Sisa Waktu Pembayaran
        </span>
      </div>
      
      <div className="flex items-center justify-center gap-2">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
            isUrgent ? "bg-orange-500/20" : "bg-primary/10"
          }`}>
            <span className={`text-2xl font-bold font-mono ${
              isUrgent ? "text-orange-500" : "text-primary"
            }`}>
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Jam</span>
        </div>

        <span className={`text-2xl font-bold ${isUrgent ? "text-orange-500" : "text-primary"}`}>:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
            isUrgent ? "bg-orange-500/20" : "bg-primary/10"
          }`}>
            <span className={`text-2xl font-bold font-mono ${
              isUrgent ? "text-orange-500" : "text-primary"
            }`}>
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Menit</span>
        </div>

        <span className={`text-2xl font-bold ${isUrgent ? "text-orange-500" : "text-primary"}`}>:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
            isUrgent ? "bg-orange-500/20" : "bg-primary/10"
          }`}>
            <span className={`text-2xl font-bold font-mono ${
              isUrgent ? "text-orange-500 animate-pulse" : "text-primary"
            }`}>
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Detik</span>
        </div>
      </div>

      {isUrgent && (
        <p className="text-center text-xs text-orange-500 mt-3 animate-pulse">
          Segera selesaikan pembayaran Anda!
        </p>
      )}
    </div>
  );
};

export default PaymentCountdown;
