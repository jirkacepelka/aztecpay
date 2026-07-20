// Lightweight inline SVG icons. The Aztec mark is a geometric placeholder that
// mirrors the segmented "pinwheel" look in the visual — swap for the official
// brand asset once Figma asset export is available (MCP was rate-limited).

export function AztecMark({ size = 30 }: { size?: number }) {
  const cx = 20;
  const cy = 20;
  const r = 19;
  const segs = 8;
  const wedges = Array.from({ length: segs }, (_, i) => {
    const a0 = (i / segs) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return {
      d: `M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0,1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`,
      fill: i % 2 === 0 ? '#f1f1ec' : '#111114',
    };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="icon-badge" aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="#f1f1ec" />
      {wedges.map((w, i) => (
        <path key={i} d={w.d} fill={w.fill} />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#000" strokeOpacity="0.15" />
    </svg>
  );
}

export function EthMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#627eea" />
      <g fill="#fff">
        <polygon points="20,6.5 12,20.5 20,16.5" opacity="0.55" />
        <polygon points="20,6.5 28,20.5 20,16.5" opacity="0.85" />
        <polygon points="20,33.5 12,22 20,26" opacity="0.55" />
        <polygon points="20,33.5 28,22 20,26" opacity="0.85" />
      </g>
    </svg>
  );
}

export function ChevronDown({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="chev" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
