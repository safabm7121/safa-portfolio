/**
 * Faint design grid: 12 column gridlines + small crosshair registration marks,
 * aligned to the content container (px-14). Fixed, behind content, desktop only.
 */
const LINE = "var(--color-line)";

function Cross({ x, y }: { x: number; y: number }) {
  return (
    <span style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width: 8, height: 8, transform: "translate(-50%,-50%)" }}>
      <span style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: LINE, transform: "translateX(-50%)" }} />
      <span style={{ position: "absolute", top: "50%", left: 0, height: 1, width: "100%", background: LINE, transform: "translateY(-50%)" }} />
    </span>
  );
}

export function GridOverlay() {
  const xs = Array.from({ length: 13 }, (_, i) => i / 12); // 0..1 at each gridline
  const rows = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="z-0 fixed inset-0 hidden lg:block pointer-events-none" aria-hidden="true">
      <div className="absolute inset-y-0 left-14 right-14">
        {xs.slice(1, -1).map((x, i) => (
          <span key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${x * 100}%`, width: 1, background: LINE }} />
        ))}
        {rows.map((y) => xs.map((x, i) => <Cross key={`${y}-${i}`} x={x} y={y} />))}
      </div>
    </div>
  );
}
