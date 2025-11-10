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
    if (e.targetTouches.length !== 2 || containerRef.current == null) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();

    solver.handleTouchStart(rect, e.targetTouches[0], e.targetTouches[1]);  // Initialise the math
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.targetTouches.length !== 2 || containerRef.current == null) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();

    solver.handleTouchMove(rect, e.targetTouches[0], e.targetTouches[1]);   // Solve the math
    setTransform(solver.toCSSTransform(rect));                              // Update React state
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height, overflow: 'hidden', background: 'lime', touchAction: 'none' }}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
    >
      <img
        src={src}
        alt='Zoomable'
        style={{ width: '100%', height: '100%', transform, transformOrigin: 'left top' }} />
    </div>
  );
}
