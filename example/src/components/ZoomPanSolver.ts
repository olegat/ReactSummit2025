const N = 1;

interface MinMax {
  min: number;
  max: number;
}

interface ClientBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OriginTouch {
  identifier: number;
  normalX: number;
  normalY: number;
}

interface Touch {
  identifier: number;
  clientX: number;
  clientY: number;
}

// Interpolate `a` from client [Rx, Rw] to normal [min, max]
function toNormal({ min, max }: MinMax, a: number, Rx: number, Rw: number): number {
  if (Rw === 0) return 0; // don't divide by 0.
  return N * (((a - Rx) / Rw) * (max - min) + min);
}

// Interpolate `x` from normal [min, max] to client [Rx, Rw]
function toClient({ min, max }: MinMax, x: number, Rx: number, Rw: number): number {
  if (max === min) return Rx; // avoid div by 0
  return Rx + (Rw * (x / N - min)) / (max - min);
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

export class ZoomPanSolver {
  private zoom: { x: MinMax; y: MinMax } = { x: { min: 0, max: N, }, y: { min: 0, max: N } };
  private readonly origins1: OriginTouch = { identifier: NaN, normalX: NaN, normalY: NaN };
  private readonly origins2: OriginTouch = { identifier: NaN, normalX: NaN, normalY: NaN };

  handleTouchStart(bounds: ClientBounds, touch1: Touch, touch2: Touch): void {
    this.origins1.identifier = touch1.identifier;
    this.origins1.normalX = toNormal(this.zoom.x, touch1.clientX, bounds.x, bounds.width);
    this.origins1.normalY = toNormal(this.zoom.y, touch1.clientY, bounds.y, bounds.height);

    this.origins2.identifier = touch2.identifier;
    this.origins2.normalX = toNormal(this.zoom.x, touch2.clientX, bounds.x, bounds.width);
    this.origins2.normalY = toNormal(this.zoom.y, touch2.clientY, bounds.y, bounds.height);
  }

  handleTouchMove(bounds: ClientBounds, touch1: Touch, touch2: Touch): void {
    const { origins1, origins2 } = this;
    touch1 = origins1.identifier === touch1.identifier ? touch1 : touch2;
    touch2 = origins2.identifier === touch2.identifier ? touch2 : touch1;
    this.zoom.x = solveTwoUnknowns(origins1.normalX, origins2.normalX, touch1.clientX, touch2.clientX, bounds.x, bounds.width);
    this.zoom.y = solveTwoUnknowns(origins1.normalY, origins2.normalY, touch1.clientY, touch2.clientY, bounds.y, bounds.height);
  }

  toCSSTransform(bounds: ClientBounds): string {
    const { x: Rx, y: Ry, width: Rw, height: Rh } = bounds;
    const tX = toClient(this.zoom.x, 0, Rx, Rw) - Rx;
    const tY = toClient(this.zoom.y, 0, Ry, Rh) - Ry;
    const sX = N / (this.zoom.x.max - this.zoom.x.min);
    const sY = N / (this.zoom.y.max - this.zoom.y.min);
    return `translate(${tX}px, ${tY}px) scale(${sX}, ${sY})`;
  }
}
