import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function StrokeText({
  text = 'NextRole',
  strokeColor = '#888888',
  fillColor = '#FFFFFF',
  strokeWidth = 1.4,
  drawDuration = 1.2,
  fillDelay = 0.1,
  stagger = 0.04,
  ease = 'power2.out',
  fillMode = 'wipe',
  fontSize = 26,
  fontWeight = 800,
  letterSpacing = -0.8,
  className = '',
  style = {}
}) {
  const rootRef = useRef(null);
  const strokeTextRef = useRef(null);
  const wipeRectRef = useRef(null);
  const [box, setBox] = useState(null);
  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const characters = useMemo(() => Array.from(String(text ?? '')), [text]);
  const dash = Math.max(fontSize * 7, 200);

  const fontStyle = useMemo(
    () => ({
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`
    }),
    [fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const node = strokeTextRef.current;
    if (!node) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;
      let bbox;
      try {
        bbox = strokeTextRef.current.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const pad = Math.max(Number(strokeWidth) || 1, fontSize * 0.12);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };

      setBox(prev =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5
          ? prev
          : next
      );
    };

    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [characters, fontSize, fontWeight, letterSpacing, strokeWidth]);

  const playAnimation = () => {
    const root = rootRef.current;
    if (!root || !box) return;

    const strokes = gsap.utils.toArray(root.querySelectorAll('[data-stroke-char]'));
    const fills = gsap.utils.toArray(root.querySelectorAll('[data-fill-char]'));
    const wipe = wipeRectRef.current;
    if (!strokes.length) return;

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const targets = [...strokes, ...fills, wipe].filter(Boolean);

    gsap.killTweensOf(targets);
    gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
    gsap.set(fills, { opacity: useWipe ? 1 : 0 });
    if (wipe) gsap.set(wipe, { attr: { width: 0 } });

    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger }, 0);

    if (useWipe && wipe) {
      tl.to(
        wipe,
        { attr: { width: box.width }, duration: fillDuration, ease: 'power2.inOut' },
        drawDuration + fillDelay
      );
    } else if (fillEnabled) {
      tl.to(
        fills,
        { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger },
        drawDuration + fillDelay
      );
    }
  };

  useEffect(() => {
    if (box) playAnimation();
  }, [box]);

  return (
    <span
      ref={rootRef}
      onMouseEnter={playAnimation}
      className={`inline-flex items-center cursor-pointer select-none ${className}`.trim()}
      style={style}
      role="img"
      aria-label={String(text ?? '')}
    >
      <svg
        className="block h-8 w-auto overflow-visible"
        viewBox={box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 ${-fontSize} 180 ${fontSize * 1.2}`}
        preserveAspectRatio="xMinYMid meet"
      >
        {fillMode === 'wipe' && box && (
          <defs>
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect ref={wipeRectRef} x={box.x} y={box.y} width="0" height={box.height} />
            </clipPath>
          </defs>
        )}
        <text
          ref={strokeTextRef}
          x="0"
          y="0"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {characters.map((char, index) => (
            <tspan data-stroke-char key={`s-${index}`}>{char}</tspan>
          ))}
        </text>
        <text
          x="0"
          y="0"
          fill={fillColor}
          stroke="none"
          style={fontStyle}
          clipPath={fillMode === 'wipe' && box ? `url(#${wipeId})` : undefined}
        >
          {characters.map((char, index) => (
            <tspan data-fill-char key={`f-${index}`}>{char}</tspan>
          ))}
        </text>
      </svg>
    </span>
  );
}

