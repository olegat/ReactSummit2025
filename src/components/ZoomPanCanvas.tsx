import { useRef, useState } from "react";

interface ZoomPanCanvasProps {
  src: string;
  width?: number;
  height?: number;
}

interface Transform {
  translationX: number;
  translationY: number;
  scaleX: number;
  scaleY: number;
}

interface MinMax {
  min: number;
  max: number;
}

interface NormalZoom {
  x: MinMax;
  y: MinMax;
}

interface TouchOrigin {
  identifier: number;
  normalX: number;
  normalY: number;
}

const N = 1_000_000;

// Interpolate `a` from [Rx, Rw] to [min, max]
function toNormal({ min, max }: MinMax, a: number, Rx: number, Rw: number): number {
    if (Rw === 0) return 0; // don't divide by 0.
    return N * (((a - Rx) / Rw) * (max - min) + min);
}

// Solve the normalized min/max state for two give touch points
function solveTwoUnknowns(x1: number, x2: number, a1: number, a2: number, Rx: number, Rw: number): MinMax {
    // The math expects x1 <= x2 (and a1 <= a2).
    // If x1 > x2, then the gesture will be reversed (i.e. fingers moving closer would zoom in).
    [x1, x2] = [Math.min(x1, x2), Math.max(x1, x2)];
    [a1, a2] = [Math.min(a1, a2), Math.max(a1, a2)];

    const t1 = (N * (a1 - Rx)) / Rw;
    const t2 = (N * (a2 - Rx)) / Rw;
    const c = (a1 - Rx) / (a2 - Rx); // === (t1 / t2);

    const min = (x1 - c * x2) / (N - t1 + c * (t2 - N));
    const max = (x2 + (t2 - N) * min) / t2;
    return { min, max };
}

export default function ZoomPanCanvas({ src, width = 400, height = 300 }: ZoomPanCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<Transform>({ translationX: 0, translationY: 0, scaleX: 1, scaleY: 1 });

  const gestureRef = useRef({
    initialZoom: { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } },
    currentZoom: { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } },
    origins: [
      { identifier: NaN, normalX: NaN, normalY: NaN },
      { identifier: NaN, normalX: NaN, normalY: NaN },
    ] as [TouchOrigin, TouchOrigin], // TODO(olegat) remove `as`
  });

  function updateTransform(zoom: NormalZoom, Rw: number, Rh: number) {
    const scaleX = Rw / (zoom.x.max - zoom.x.min);
    const scaleY = Rh / (zoom.y.max - zoom.y.min);
    const translationX = -zoom.x.min * scaleX;
    const translationY = -zoom.y.min * scaleY;
    setTransform({ translationX, translationY, scaleX, scaleY });
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.targetTouches.length === 2 && containerRef.current != null) {
      e.preventDefault();
      const { origins, initialZoom } = gestureRef.current;
      const { x: Rx, y: Ry, width: Rw, height: Rh } = containerRef.current.getBoundingClientRect();
      for (const i of [0, 1]) {
        const a = e.targetTouches[i].clientX;
        const b = Ry + Rh - e.targetTouches[i].clientY;
        origins[i].identifier = e.targetTouches[i].identifier;
        origins[i].normalX = toNormal(initialZoom.x, a, Rx, Rw);
        origins[i].normalY = toNormal(initialZoom.y, b, Ry, Rh);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const { origins, currentZoom } = gestureRef.current;
    if (containerRef.current != null && e.targetTouches.length === 2) {
      e.preventDefault();
      const { x: Rx, y: Ry, width: Rw, height: Rh } = containerRef.current.getBoundingClientRect();

      // The ordering of the elements in TouchEvent.targetTouches is not guaranteed to be the same in 'touchstart'
      // and 'touchend', so cannot assume that the indices of `origins` and `targetTouches` line-up. The
      // `.map().find()` operations guarantees a result such that `touch[i].identifier === origins[i].identifier`.
      //
      // We can use the `!` operator here to remove the `undefined` type from the return-type of `.find()` because
      // we can assume that all the identifies in `origins` (set at 'touchstart') can be found in `targetTouches`
      // (set at 'touchmove').
      const targetTouches = Array.from(e.targetTouches);
      const touches = [0, 1].map((i) => targetTouches.find((t) => t.identifier === origins[i].identifier)!);
      const x1 = origins[0].normalX;
      const x2 = origins[1].normalX;
      const a1 = touches[0].clientX;
      const a2 = touches[1].clientX;
      const y1 = origins[0].normalY;
      const y2 = origins[1].normalY;
      const b1 = Ry + Rh - touches[0].clientY;
      const b2 = Ry + Rh - touches[1].clientY;

      currentZoom.x = solveTwoUnknowns(x1, x2, a1, a2, Rx, Rw);
      currentZoom.y = solveTwoUnknowns(y1, y2, b1, b2, Rx, Rw);
      updateTransform(currentZoom, Rw, Rh);
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent<HTMLDivElement>) => {
    gestureRef.current.initialZoom = gestureRef.current.currentZoom;
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
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `
            translate(${transform.translationX}px, ${transform.translationY}px)
            scale(${transform.scaleX}, ${transform.scaleY})
          `,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
