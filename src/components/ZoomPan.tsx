import { useRef, useState } from 'react';
import { ZoomPanSolver } from './ZoomPanSolver';

interface ZoomPanProps {
  src: string;
  width?: number | `${number}%`;
  height?: number | `${number}%`;
}

export default function ZoomPan({ src, width = 400, height = 300 }: ZoomPanProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { current: solver } = useRef<ZoomPanSolver>(new ZoomPanSolver());

  const [transform, setTransform] = useState(`translate(0px, 0px) scale(1, 1)`);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.targetTouches.length === 2 && containerRef.current != null) {
      e.preventDefault();

      // Initialise the math:
      const rect = containerRef.current.getBoundingClientRect();
      solver.handleTouchStart(rect, e.targetTouches[0], e.targetTouches[1]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (containerRef.current != null && e.targetTouches.length === 2) {
      e.preventDefault();

      // Solve the math
      const rect = containerRef.current.getBoundingClientRect();
      solver.handleTouchMove(rect, e.targetTouches[0], e.targetTouches[1]);

      // Update React state
      const { scaleX, scaleY, translationX, translationY } = solver.toCSSTransform(rect)
      setTransform(`translate(${translationX}px, ${translationY}px) scale(${scaleX}, ${scaleY})`);
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>) => {
    solver.handleTouchEnd();
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height, overflow: "hidden", border: "4px solid #ccc", touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <img
        src={src}
        alt="Zoomable"
        style={{ width: "100%", height: "100%", objectFit: "cover", transform, transformOrigin: "left top" }}
      />
    </div>
  );
}
