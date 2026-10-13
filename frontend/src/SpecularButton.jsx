import { useEffect, useRef } from 'react';

const SIZES = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm'
};

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uCenter; uniform vec2 uHalf; uniform float uRadius; uniform float uPx;
uniform float uSpot; uniform vec2 uEntry; uniform vec3 uLineColor; uniform vec3 uBaseColor;
uniform float uIntensity; uniform vec2 uWindow; uniform float uThickness; uniform float uGlow;
out vec4 outColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float loopPosition(vec2 p, vec2 b, float r) {
  vec2 inner = b - r;
  float arc = 1.5707963 * r;
  float quarter = inner.x + inner.y + arc;
  vec2 a = abs(p); vec2 q = a - inner;
  float s = q.x > 0.0 && q.y > 0.0
    ? inner.y + atan(q.y, q.x) * r
    : (q.x > q.y ? min(a.y, inner.y) : inner.y + arc + inner.x - min(a.x, inner.x));
  if (p.x < 0.0) s = p.y >= 0.0 ? 2.0 * quarter - s : 2.0 * quarter + s;
  else if (p.y < 0.0) s = 4.0 * quarter - s;
  return s / max(4.0 * quarter, 0.0001);
}

float lobe(float position, float center) {
  float gap = abs(fract(position - center + 0.5) - 0.5);
  return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedBox(p, uHalf, uRadius);
  float position = loopPosition(p, uHalf, uRadius);
  float key = lobe(position, uSpot);
  float back = lobe(position, uSpot + 0.5);
  float streak = key + back * 0.45;
  float width = max(uThickness * uPx * mix(1.0, max(key, back), 0.6), 0.35);
  float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float inside = 1.0 - smoothstep(-0.6, 0.6, d);
  vec2 pool = (p - uEntry) / (uHalf.y * vec2(1.6, 1.1));
  float glow = streak * 0.2 * exp(-abs(d + width * 0.5) / (5.0 * uPx)) + inside * 0.08 * exp(-dot(pool, pool));
  float light = clamp((band * streak + glow * uGlow) * uIntensity, 0.0, 1.0);
  vec4 base = vec4(uBaseColor, 1.0) * hair * 0.6;
  outColor = vec4(uLineColor, 1.0) * light + base * (1.0 - light);
}`;

const UNIFORMS = ['uCenter', 'uHalf', 'uRadius', 'uPx', 'uSpot', 'uEntry', 'uLineColor', 'uBaseColor', 'uIntensity', 'uWindow', 'uThickness', 'uGlow'];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const wrap = v => v - Math.floor(v);

const loopPositionJS = (x, y, halfX, halfY, r) => {
  const innerX = halfX - r; const innerY = halfY - r;
  const arc = (Math.PI / 2) * r; const quarter = innerX + innerY + arc;
  const ax = Math.abs(x); const ay = Math.abs(y);
  const qx = ax - innerX; const qy = ay - innerY;
  let s = (qx > 0 && qy > 0) ? innerY + Math.atan2(qy, qx) * r : (qx > qy ? Math.min(ay, innerY) : innerY + arc + innerX - Math.min(ax, innerX));
  if (x < 0) s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
  else if (y < 0) s = 4 * quarter - s;
  return wrap(s / Math.max(4 * quarter, 0.0001));
};

export default function SpecularButton({
  children,
  size = 'md',
  radius = 10,
  tint = '#ffffff',
  tintOpacity = 0.98,
  textColor = '#000000',
  lineColor = '#ffffff',
  baseColor = '#404040',
  onClick,
  className = ''
}) {
  const buttonRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: true });
    if (!button || !canvas || !gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);

    const uniforms = {};
    UNIFORMS.forEach(u => (uniforms[u] = gl.getUniformLocation(program, u)));

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    let spot = 0;
    const draw = () => {
      const w = button.offsetWidth;
      const h = button.offsetHeight;
      canvas.width = w * 2; canvas.height = h * 2;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(uniforms.uCenter, canvas.width / 2, canvas.height / 2);
      gl.uniform2f(uniforms.uHalf, w, h);
      gl.uniform1f(uniforms.uRadius, radius * 2);
      gl.uniform1f(uniforms.uPx, 2);
      gl.uniform1f(uniforms.uSpot, spot);
      gl.uniform2f(uniforms.uEntry, 0, 0);
      gl.uniform3f(uniforms.uLineColor, 1, 1, 1);
      gl.uniform3f(uniforms.uBaseColor, 0.2, 0.2, 0.2);
      gl.uniform1f(uniforms.uIntensity, 0.8);
      gl.uniform2f(uniforms.uWindow, 0.1, 0.1);
      gl.uniform1f(uniforms.uThickness, 1.2);
      gl.uniform1f(uniforms.uGlow, 0.5);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    draw();
  }, [radius]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`relative isolate inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-95 ${SIZES[size]} ${className}`}
      style={{
        borderRadius: `${radius}px`,
        backgroundColor: tint,
        color: textColor
      }}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute -inset-2 z-[1] h-[calc(100%+16px)] w-[calc(100%+16px)]" />
      <span className="relative z-[2] flex items-center gap-2">{children}</span>
    </button>
  );
}