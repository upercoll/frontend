import { useEffect, useRef } from "react";

const IMAGES = [
  "/grid1.jpeg.jpeg", "/grid2.jpeg.jpeg", "/grid3.jpeg.jpeg", "/grid4.jpeg.jpeg", "/grid5.jpeg.jpeg",
  "/grid6.jpeg.jpeg", "/grid7.jpeg.jpeg", "/grid8.jpeg.jpeg", "/grid9.jpeg.jpeg", "/grid10.jpeg.jpeg",
  "/grid11.jpeg.jpeg",
];

const COL_COUNT = 24;
const ITEMS_TOTAL = COL_COUNT * 5;
const ITEMS = Array.from({ length: ITEMS_TOTAL }, (_, i) => ({ src: IMAGES[i % IMAGES.length] }));

function buildColumns(items: typeof ITEMS, colCount = COL_COUNT) {
  const cols: (typeof ITEMS)[] = Array.from({ length: colCount }, () => []);
  items.forEach((item, i) => cols[i % colCount].push(item));
  return cols.map(col => [...col, ...col, ...col]);
}

const COLS = buildColumns(ITEMS, COL_COUNT);
const TILE_SIZE = 160;
const GAP = 12;
const STEP = TILE_SIZE + GAP;
const SPEED = 0.4;

export default function AnimatedGrid() {
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offsets = useRef(COLS.map(() => 0));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const colHeights = COLS.map(col => (col.length / 3) * STEP);

    function tick() {
      COLS.forEach((col, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        offsets.current[i] += SPEED * dir;

        const h = colHeights[i];
        if (offsets.current[i] <= -h) offsets.current[i] += h;
        if (offsets.current[i] >= h)  offsets.current[i] -= h;

        const el = colRefs.current[i];
        if (el) el.style.transform = `translateY(${offsets.current[i]}px)`;
      });
      raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#0d0020",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          display: "flex",
          gap: GAP,
          transform: "rotate(-15deg)",
          transformOrigin: "center center",
        }}
      >
        {COLS.map((col, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: GAP,
              flexShrink: 0,
            }}
          >
            <div
              ref={el => { colRefs.current[i] = el; }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: GAP,
                willChange: "transform",
              }}
            >
              {col.map((item, j) => (
                <Tile key={j} item={item} size={TILE_SIZE} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 30%, #0d0020 80%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function Tile({ item, size }: { item: { src?: string }; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        background: item.src ? `url(${item.src}) center/cover` : "#1a1035",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}
    />
  );
}
