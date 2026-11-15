import { useEffect, useId, useRef } from "react";

export interface InteractiveGridBackgroundProps {
  width?: number;
  height?: number;
  radius?: number;
  trailDuration?: number;
  strokeColor?: string;
  highlightColor?: string;
  className?: string;
}

interface TrailNode {
  x: number;
  y: number;
  timestamp: number;
}

export function InteractiveGridBackground({
  width = 40,
  height = 40,
  radius = 85,
  trailDuration = 900,
  strokeColor = "rgba(15, 23, 42, 0.035)",
  highlightColor = "rgba(15, 23, 42, 0.28)",
  className = "",
}: InteractiveGridBackgroundProps) {
  const uid = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const trailRef = useRef<TrailNode[]>([]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;

      pointerRef.current = { x, y, active: inside };

      if (inside) {
        const now = performance.now();
        const last = trailRef.current[trailRef.current.length - 1];
        if (!last || Math.hypot(x - last.x, y - last.y) > 4) {
          trailRef.current.push({ x, y, timestamp: now });
        }
      }
    };

    const handleLeave = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let logicalWidth = 0;
    let logicalHeight = 0;
    let gridPattern: CanvasPattern | null = null;

    const buildGridPattern = () => {
      const tile = document.createElement("canvas");
      tile.width = width;
      tile.height = height;
      const tileContext = tile.getContext("2d");
      if (tileContext) {
        tileContext.strokeStyle = highlightColor;
        tileContext.lineWidth = 1;
        tileContext.beginPath();
        tileContext.moveTo(width, 0);
        tileContext.lineTo(0, 0);
        tileContext.lineTo(0, height);
        tileContext.stroke();
      }
      gridPattern = context.createPattern(tile, "repeat");
    };

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      logicalWidth = rect.width;
      logicalHeight = rect.height;
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGridPattern();
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    let animationFrame = 0;
    const render = (now: number) => {
      context.clearRect(0, 0, logicalWidth, logicalHeight);
      trailRef.current = trailRef.current.filter(
        (node) => now - node.timestamp < trailDuration
      );

      const hasActiveGlow =
        pointerRef.current.active || trailRef.current.length > 0;

      if (hasActiveGlow && gridPattern) {
        context.globalCompositeOperation = "source-over";

        for (const node of trailRef.current) {
          const life = Math.max(0, 1 - (now - node.timestamp) / trailDuration);
          const alpha = life * life * 0.6;
          const trailRadius = radius * (0.65 + 0.35 * life);
          const gradient = context.createRadialGradient(
            node.x,
            node.y,
            0,
            node.x,
            node.y,
            trailRadius
          );
          gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(node.x, node.y, trailRadius, 0, Math.PI * 2);
          context.fill();
        }

        if (pointerRef.current.active) {
          const { x, y } = pointerRef.current;
          const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
          gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.45)");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }

        context.globalCompositeOperation = "source-in";
        context.fillStyle = gridPattern;
        context.fillRect(0, 0, logicalWidth, logicalHeight);
        context.globalCompositeOperation = "source-over";
      }

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [width, height, radius, trailDuration, highlightColor]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-white ${className}`}
    >
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern
            id={`rest-grid-${uid}`}
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${width} 0 L 0 0 0 ${height}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#rest-grid-${uid})`} />
      </svg>

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default InteractiveGridBackground;
