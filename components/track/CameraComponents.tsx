"use client";
export function ScanningFrame() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 300px 220px at center, transparent 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <div className="relative w-80 h-52 rounded-3xl">
        {/* Animated corner indicators */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-2xl opacity-90 animate-pulse" />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-2xl opacity-90 animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-2xl opacity-90 animate-pulse" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-2xl opacity-90 animate-pulse" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-full opacity-60 animate-ping" />
          <div className="absolute w-2 h-2 bg-white rounded-full opacity-80" />
        </div>
      </div>
    </div>
  );
}

export function VoiceAnimation() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 300px 220px at center, transparent 35%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <div className="relative flex items-center justify-center">
        {/* Voice wave animation */}
        <div className="flex items-center gap-1">
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: "20px",
              animationDelay: "0ms",
              animationDuration: "1s",
            }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: "35px",
              animationDelay: "150ms",
              animationDuration: "1s",
            }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: "25px",
              animationDelay: "300ms",
              animationDuration: "1s",
            }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: "40px",
              animationDelay: "450ms",
              animationDuration: "1s",
            }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: "30px",
              animationDelay: "600ms",
              animationDuration: "1s",
            }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: "45px",
              animationDelay: "750ms",
              animationDuration: "1s",
            }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{
              height: "25px",
              animationDelay: "900ms",
              animationDuration: "1s",
            }}
          />
        </div>
      </div>
    </div>
  );
}
