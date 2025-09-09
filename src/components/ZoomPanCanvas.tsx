import { useRef, useState } from "react";

interface ZoomPanCanvasProps {
  src: string;
  width?: number;
  height?: number;
}

export default function ZoomPanCanvas({
  src,
  width = 400,
  height = 300,
}: ZoomPanCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Placeholder states
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Event handlers (logging for now)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    console.log("Pointer down:", e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    console.log("Pointer move:", e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    console.log("Pointer up:", e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        overflow: "hidden",
        border: "1px solid #ccc",
        touchAction: "none",
        margin: "1rem auto",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={src}
        alt="Zoomable"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
