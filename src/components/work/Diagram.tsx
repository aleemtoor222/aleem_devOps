import type { Project } from '@/content/profile';

// Architecture flow as inline SVG, built only from the project's own diagram columns.
// Horizontal on wider screens, vertical on phones (CSS picks one).

function wrap(label: string, max: number) {
  const lines: string[] = [];
  let cur = '';
  for (const word of label.split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

const LINE = 15;
const NODE_PAD = 14;
const GAP = 8;
const LABEL = 22;
const PAD = 8;

type Node = { x: number; y: number; w: number; h: number; lines: string[] };

function Flow({ project, dir, idPrefix }: { project: Project; dir: 'h' | 'v'; idPrefix: string }) {
  const cols = project.diagram;
  const id = `${idPrefix}-${project.slug}-${dir}`;
  const nodes: Node[] = [];
  const labels: { x: number; y: number; text: string; anchor: 'middle' | 'start' }[] = [];
  const arrows: [number, number, number, number][] = [];
  let W: number;
  let H: number;

  if (dir === 'h') {
    const colW = 124;
    const gap = 34;
    const laid = cols.map((c) => c.nodes.map((n) => wrap(n, 14)));
    const heights = laid.map((ns) => ns.reduce((a, l) => a + NODE_PAD + l.length * LINE, 0) + (ns.length - 1) * GAP);
    const inner = Math.max(...heights);
    W = PAD * 2 + cols.length * colW + (cols.length - 1) * gap;
    H = PAD * 2 + LABEL + inner;
    const cy = PAD + LABEL + inner / 2;
    laid.forEach((ns, i) => {
      const x = PAD + i * (colW + gap);
      labels.push({ x: x + colW / 2, y: PAD + 12, text: cols[i].label, anchor: 'middle' });
      let y = PAD + LABEL + (inner - heights[i]) / 2;
      ns.forEach((lines) => {
        const h = NODE_PAD + lines.length * LINE;
        nodes.push({ x, y, w: colW, h, lines });
        y += h + GAP;
      });
      if (i < cols.length - 1) arrows.push([x + colW + 3, cy, x + colW + gap - 3, cy]);
    });
  } else {
    const nodeW = 104;
    const rowGap = 30;
    W = PAD * 2 + 3 * nodeW + 2 * GAP;
    let y = PAD;
    cols.forEach((c, i) => {
      const ls = c.nodes.map((n) => wrap(n, 12));
      const h = Math.max(...ls.map((l) => NODE_PAD + l.length * LINE));
      const rowW = c.nodes.length * nodeW + (c.nodes.length - 1) * GAP;
      labels.push({ x: W / 2, y: y + 12, text: c.label, anchor: 'middle' });
      let x = (W - rowW) / 2;
      ls.forEach((lines) => {
        nodes.push({ x, y: y + LABEL, w: nodeW, h, lines });
        x += nodeW + GAP;
      });
      y += LABEL + h;
      if (i < cols.length - 1) arrows.push([W / 2, y + 3, W / 2, y + rowGap - 3]);
      y += rowGap;
    });
    H = y - rowGap + PAD;
  }

  return (
    <svg className={`dg dg-${dir}`} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-labelledby={`${id}-t`}>
      <title id={`${id}-t`}>{`Architecture: ${cols.map((c) => `${c.label} (${c.nodes.join(', ')})`).join(' → ')}`}</title>
      <defs>
        <marker id={`${id}-ah`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" className="dg-head" />
        </marker>
      </defs>
      {labels.map((l, i) => (
        <text key={`l${i}`} x={l.x} y={l.y} textAnchor={l.anchor} className="dg-label" fontSize="11">
          {l.text}
        </text>
      ))}
      {arrows.map(([x1, y1, x2, y2], i) => (
        <line key={`a${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className="dg-arrow" markerEnd={`url(#${id}-ah)`} />
      ))}
      {nodes.map((n, i) => (
        <g key={`n${i}`}>
          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8" className="dg-node" />
          <text x={n.x + n.w / 2} y={n.y + NODE_PAD / 2 + 11} textAnchor="middle" className="dg-text" fontSize="12">
            {n.lines.map((t, j) => (
              <tspan key={j} x={n.x + n.w / 2} dy={j === 0 ? 0 : LINE}>
                {t}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Diagram({ project, idPrefix = 'dg', only }: { project: Project; idPrefix?: string; only?: 'h' }) {
  return (
    <div className="diagram">
      <Flow project={project} dir="h" idPrefix={idPrefix} />
      {only !== 'h' && <Flow project={project} dir="v" idPrefix={idPrefix} />}
    </div>
  );
}
