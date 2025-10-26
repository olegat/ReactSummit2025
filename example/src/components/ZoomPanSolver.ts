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

interface TargetTouch {
  identifier: number;
  clientX: number;
  clientY: number;
}

interface Transform {
  translationX: number;
  translationY: number;
  scaleX: number;
  scaleY: number;
}

const N = 1;

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
  private initialZoomX: MinMax = { min: 0, max: N };
  private initialZoomY: MinMax = { min: 0, max: N };
  private currentZoomX: MinMax = { min: 0, max: N };
  private currentZoomY: MinMax = { min: 0, max: N };
  private readonly origins1: OriginTouch = { identifier: NaN, normalX: NaN, normalY: NaN };
  private readonly origins2: OriginTouch = { identifier: NaN, normalX: NaN, normalY: NaN };

  handleTouchStart(clientRect: ClientBounds, targetTouch1: TargetTouch, targetTouch2: TargetTouch): void {
    const { x: Rx, y: Ry, width: Rw, height: Rh } = clientRect;
    let a: number, b: number;

    a = targetTouch1.clientX;
    b = targetTouch1.clientY;
    this.origins1.identifier = targetTouch1.identifier;
    this.origins1.normalX = toNormal(this.initialZoomX, a, Rx, Rw);
    this.origins1.normalY = toNormal(this.initialZoomY, b, Ry, Rh);

    a = targetTouch2.clientX;
    b = targetTouch2.clientY;
    this.origins2.identifier = targetTouch2.identifier;
    this.origins2.normalX = toNormal(this.initialZoomX, a, Rx, Rw);
    this.origins2.normalY = toNormal(this.initialZoomY, b, Ry, Rh);
  }

  handleTouchMove(clientRect: ClientBounds, targetTouch1: TargetTouch, targetTouch2: TargetTouch): void {
    const { x: Rx, y: Ry, width: Rw, height: Rh } = clientRect;
    const { origins1, origins2 } = this;

    // The ordering of the elements in TouchEvent.targetTouches is not guaranteed to be the same in 'touchstart'
    // and 'touchend', so cannot assume that the indices of `origins` and `targetTouches` line-up.
    const touches1 = origins1.identifier === targetTouch1.identifier ? targetTouch1 : targetTouch2;
    const touches2 = origins2.identifier === targetTouch2.identifier ? targetTouch2 : targetTouch1;

    const x1 = origins1.normalX;
    const x2 = origins2.normalX;
    const a1 = touches1.clientX;
    const a2 = touches2.clientX;
    const y1 = origins1.normalY;
    const y2 = origins2.normalY;
    const b1 = touches1.clientY;
    const b2 = touches2.clientY;

    this.currentZoomX = solveTwoUnknowns(x1, x2, a1, a2, Rx, Rw);
    this.currentZoomY = solveTwoUnknowns(y1, y2, b1, b2, Ry, Rh);
  }

  handleTouchEnd(): void {
    this.initialZoomX = this.currentZoomX;
    this.initialZoomY = this.currentZoomY;
  }

  toCSSTransform(clientRect: ClientBounds): Transform {
    const { x: Rx, y: Ry, width: Rw, height: Rh } = clientRect;
    const { currentZoomX: zoomX, currentZoomY: zoomY } = this;

    return {
      scaleX: N / (zoomX.max - zoomX.min),
      scaleY: N / (zoomY.max - zoomY.min),
      translationX: toClient(zoomX, zoomX.min, Rx, Rw),
      translationY: toClient(zoomY, zoomY.min, Ry, Rh),
    };
  }
}
