import type { QuestionVisual } from '@/lib/validation/question-visual';

const WIDTH = 640;
const HEIGHT = 360;
const PAD = 44;
const SERIES_COLORS = ['#1E2430', '#C1121F', '#2E7D5B', '#3A5A8C', '#A66A00'];

function ticks(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  const first = Math.ceil(min / step) * step;
  for (let value = first; value <= max + step / 100 && values.length < 50; value += step) {
    values.push(Number(value.toFixed(8)));
  }
  return values;
}

function Plot({ visual }: { visual: Extract<QuestionVisual, { format: 'plot' }> }) {
  const [xMin, xMax] = visual.x_range;
  const [yMin, yMax] = visual.y_range;
  const scale = Math.min(
    (WIDTH - PAD * 2) / (xMax - xMin),
    (HEIGHT - PAD * 2) / (yMax - yMin),
  );
  const plotWidth = (xMax - xMin) * scale;
  const plotHeight = (yMax - yMin) * scale;
  const left = (WIDTH - plotWidth) / 2;
  const right = left + plotWidth;
  const top = (HEIGHT - plotHeight) / 2;
  const bottom = top + plotHeight;
  const x = (value: number) => left + (value - xMin) * scale;
  const y = (value: number) => bottom - (value - yMin) * scale;
  const xTicks = ticks(xMin, xMax, visual.x_step);
  const yTicks = ticks(yMin, yMax, visual.y_step);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden="true">
      <defs>
        <marker id="question-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
        </marker>
      </defs>
      <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="#FFFDF6" stroke="#1E2430" />
      {xTicks.map((value) => (
        <g key={`x-${value}`}>
          <line x1={x(value)} y1={top} x2={x(value)} y2={bottom} stroke="#C9D6E8" strokeWidth="1" />
          <text x={x(value)} y={bottom + 18} textAnchor="middle" fontSize="11" fill="#5B6472">{value}</text>
        </g>
      ))}
      {yTicks.map((value) => (
        <g key={`y-${value}`}>
          <line x1={left} y1={y(value)} x2={right} y2={y(value)} stroke="#C9D6E8" strokeWidth="1" />
          <text x={left - 8} y={y(value) + 4} textAnchor="end" fontSize="11" fill="#5B6472">{value}</text>
        </g>
      ))}
      {xMin <= 0 && xMax >= 0 && <line x1={x(0)} y1={top} x2={x(0)} y2={bottom} stroke="#1E2430" strokeWidth="1.5" />}
      {yMin <= 0 && yMax >= 0 && <line x1={left} y1={y(0)} x2={right} y2={y(0)} stroke="#1E2430" strokeWidth="1.5" />}
      {visual.series.map((series, index) => {
        const color = SERIES_COLORS[index % SERIES_COLORS.length];
        const points = series.points.map((point) => `${x(point.x)},${y(point.y)}`).join(' ');
        return (
          <g key={`${series.kind}-${index}`} color={color}>
            {series.kind === 'polygon' && (
              <polygon points={points} fill={`${color}22`} stroke={color} strokeWidth="2" strokeDasharray={series.style === 'dashed' ? '7 5' : undefined} />
            )}
            {(series.kind === 'polyline' || series.kind === 'vector') && (
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeDasharray={series.style === 'dashed' ? '7 5' : undefined}
                markerEnd={series.kind === 'vector' ? 'url(#question-arrow)' : undefined}
              />
            )}
            {series.points.map((point, pointIndex) => (
              <g key={pointIndex}>
                {(series.kind === 'points' || series.kind === 'polygon') && (
                  <circle cx={x(point.x)} cy={y(point.y)} r="3.5" fill={color} />
                )}
                {point.label && (
                  <text x={x(point.x) + 6} y={y(point.y) - 7} fontSize="12" fill={color}>{point.label}</text>
                )}
              </g>
            ))}
            {series.label && <text x={right} y={Math.max(14, top - 12) + index * 14} textAnchor="end" fontSize="11" fill={color}>{series.label}</text>}
          </g>
        );
      })}
      {visual.x_label && <text x={right} y={Math.min(HEIGHT - 5, bottom + 34)} textAnchor="end" fontSize="12">{visual.x_label}</text>}
      {visual.y_label && <text x={Math.max(5, left - 35)} y={top} fontSize="12">{visual.y_label}</text>}
    </svg>
  );
}

function Diagram({ visual }: { visual: Extract<QuestionVisual, { format: 'diagram' }> }) {
  const points = new Map(visual.points.map((point) => [point.id, point]));
  const scale = (HEIGHT - PAD * 2) / 100;
  const left = (WIDTH - 100 * scale) / 2;
  const x = (value: number) => left + value * scale;
  const y = (value: number) => PAD + value * scale;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden="true">
      {visual.circles.map((circle, index) => {
        const center = points.get(circle.center)!;
        return (
          <g key={index}>
            <circle cx={x(center.x)} cy={y(center.y)} r={circle.radius * scale} fill="none" stroke="#1E2430" strokeWidth="2" />
            {circle.label && <text x={x(center.x)} y={y(center.y) - circle.radius * scale - 7} textAnchor="middle" fontSize="12">{circle.label}</text>}
          </g>
        );
      })}
      {visual.segments.map((segment, index) => {
        const from = points.get(segment.from)!;
        const to = points.get(segment.to)!;
        return (
          <g key={index}>
            <line
              x1={x(from.x)} y1={y(from.y)} x2={x(to.x)} y2={y(to.y)}
              stroke="#1E2430" strokeWidth="2.5"
              strokeDasharray={segment.style === 'dashed' ? '7 5' : undefined}
            />
            {segment.label && (
              <text x={(x(from.x) + x(to.x)) / 2 + 5} y={(y(from.y) + y(to.y)) / 2 - 6} fontSize="12" fill="#C1121F">
                {segment.label}
              </text>
            )}
          </g>
        );
      })}
      {visual.points.map((point) => (
        <g key={point.id}>
          <circle cx={x(point.x)} cy={y(point.y)} r="3.5" fill="#1E2430" />
          <text x={x(point.x) + 7} y={y(point.y) - 7} fontSize="13" fontWeight="600">
            {point.label ?? point.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Chart({ visual }: { visual: Extract<QuestionVisual, { format: 'chart' }> }) {
  if (visual.chart_type === 'pie') {
    const total = visual.values.reduce((sum, value) => sum + value, 0);
    let offset = 0;
    return (
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden="true">
        <circle cx="220" cy="180" r="110" fill="none" stroke="#E7E1D5" strokeWidth="80" />
        {visual.values.map((value, index) => {
          const share = value / total;
          const dash = `${share * 691.15} ${691.15 - share * 691.15}`;
          const element = (
            <circle
              key={visual.labels[index]}
              cx="220" cy="180" r="110" fill="none"
              stroke={SERIES_COLORS[index % SERIES_COLORS.length]} strokeWidth="80"
              strokeDasharray={dash} strokeDashoffset={-offset * 691.15}
              transform="rotate(-90 220 180)"
            />
          );
          offset += share;
          return element;
        })}
        {visual.labels.map((label, index) => (
          <g key={`${label}-${index}`}>
            <rect x="410" y={72 + index * 28} width="14" height="14" fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
            <text x="432" y={84 + index * 28} fontSize="12">{label}: {visual.values[index]}</text>
          </g>
        ))}
      </svg>
    );
  }
  const min = Math.min(0, ...visual.values);
  const max = Math.max(1, ...visual.values);
  const plotHeight = HEIGHT - PAD * 2;
  const y = (value: number) => HEIGHT - PAD - (value - min) * plotHeight / (max - min || 1);
  const slot = (WIDTH - PAD * 2) / visual.values.length;
  const linePoints = visual.values.map((value, index) => `${PAD + slot * (index + 0.5)},${y(value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden="true">
      <line x1={PAD} y1={y(0)} x2={WIDTH - PAD} y2={y(0)} stroke="#1E2430" strokeWidth="1.5" />
      {visual.chart_type === 'line' && <polyline points={linePoints} fill="none" stroke="#C1121F" strokeWidth="3" />}
      {visual.values.map((value, index) => {
        const center = PAD + slot * (index + 0.5);
        const top = Math.min(y(value), y(0));
        const height = Math.abs(y(value) - y(0));
        return (
          <g key={`${visual.labels[index]}-${index}`}>
            {visual.chart_type === 'line' ? (
              <circle cx={center} cy={y(value)} r="4" fill="#C1121F" />
            ) : (
              <rect x={center - slot * 0.35} y={top} width={slot * 0.7} height={Math.max(1, height)} fill="#3A5A8C" />
            )}
            <text x={center} y={HEIGHT - PAD + 18} textAnchor="middle" fontSize="10">{visual.labels[index]}</text>
            <text x={center} y={top - 7} textAnchor="middle" fontSize="11">{value}</text>
          </g>
        );
      })}
      {visual.y_label && <text x="10" y={PAD} fontSize="12">{visual.y_label}</text>}
      {visual.x_label && <text x={WIDTH / 2} y={HEIGHT - 5} textAnchor="middle" fontSize="12">{visual.x_label}</text>}
    </svg>
  );
}

function Table({ visual }: { visual: Extract<QuestionVisual, { format: 'table' }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto border-collapse text-center font-mono text-sm">
        <thead><tr>{visual.headers.map((header, index) => <th key={index} className="border border-ink bg-paper-deep px-3 py-2">{header}</th>)}</tr></thead>
        <tbody>{visual.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-ink px-3 py-2">{cell}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function NumberLine({ visual }: { visual: Extract<QuestionVisual, { format: 'number-line' }> }) {
  const x = (value: number) => PAD + (value - visual.min) * (WIDTH - PAD * 2) / (visual.max - visual.min);
  const tickValues = ticks(visual.min, visual.max, visual.step);
  return (
    <svg viewBox={`0 0 ${WIDTH} 150`} className="h-auto w-full" aria-hidden="true">
      <line x1={PAD} y1="70" x2={WIDTH - PAD} y2="70" stroke="#1E2430" strokeWidth="2" />
      {tickValues.map((value) => <g key={value}><line x1={x(value)} y1="62" x2={x(value)} y2="78" stroke="#1E2430" /><text x={x(value)} y="96" textAnchor="middle" fontSize="11">{value}</text></g>)}
      {visual.intervals.map((interval, index) => (
        <g key={index}>
          <line x1={x(interval.from)} y1="70" x2={x(interval.to)} y2="70" stroke="#C1121F" strokeWidth="7" />
          <circle cx={x(interval.from)} cy="70" r="6" fill={interval.from_closed ? '#C1121F' : 'white'} stroke="#C1121F" strokeWidth="2" />
          <circle cx={x(interval.to)} cy="70" r="6" fill={interval.to_closed ? '#C1121F' : 'white'} stroke="#C1121F" strokeWidth="2" />
        </g>
      ))}
      {visual.markers.map((marker, index) => <g key={index}><circle cx={x(marker.value)} cy="70" r="5" fill={marker.style === 'open' ? 'white' : '#2E7D5B'} stroke="#2E7D5B" strokeWidth="2" />{marker.label && <text x={x(marker.value)} y="45" textAnchor="middle" fontSize="12">{marker.label}</text>}</g>)}
    </svg>
  );
}

function SetDiagram({ visual }: { visual: Extract<QuestionVisual, { format: 'set-diagram' }> }) {
  const positions = [{ x: 240, y: 180 }, { x: 390, y: 180 }, { x: 315, y: 245 }];
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" aria-hidden="true">
      <rect x="35" y="25" width="570" height="310" fill="#FFFDF6" stroke="#1E2430" strokeWidth="2" />
      <text x="48" y="48" fontSize="14" fontWeight="600">{visual.universal_label}</text>
      {visual.sets.map((set, index) => {
        const position = positions[index];
        return <g key={set.id}><circle cx={position.x} cy={position.y} r="105" fill={`${SERIES_COLORS[index]}18`} stroke={SERIES_COLORS[index]} strokeWidth="2" /><text x={position.x} y={position.y - 78} textAnchor="middle" fontSize="14" fontWeight="600">{set.label}</text><text x={position.x} y={position.y} textAnchor="middle" fontSize="12">{set.values.join(', ')}</text></g>;
      })}
      {visual.outside_values.length > 0 && <text x="55" y="315" fontSize="12">Outside: {visual.outside_values.join(', ')}</text>}
    </svg>
  );
}

function Matrix({ visual }: { visual: Extract<QuestionVisual, { format: 'matrix' }> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 font-mono">
      {visual.matrices.map((matrix, matrixIndex) => (
        <div key={matrixIndex} className="flex items-center gap-2">
          {matrix.label && <span>{matrix.label} =</span>}
          <div className="border-x-2 border-ink px-2 py-1">
            {matrix.entries.map((row, rowIndex) => <div key={rowIndex} className="grid gap-x-4" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(1.5rem, auto))` }}>{row.map((entry, index) => <span key={index} className="text-center">{entry}</span>)}</div>)}
          </div>
          {visual.operators[matrixIndex] && <span className="text-lg font-bold">{visual.operators[matrixIndex]}</span>}
        </div>
      ))}
    </div>
  );
}

function Mapping({ visual }: { visual: Extract<QuestionVisual, { format: 'mapping' }> }) {
  return (
    <div className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] gap-5 font-mono text-sm">
      <div><div className="mb-2 text-center font-bold">{visual.left_label}</div>{visual.left_values.map((value, index) => <div key={index} className="my-1 rounded-full border border-ink px-3 py-1 text-center">{value}</div>)}</div>
      <div className="pt-8 text-xs text-dim">{visual.arrows.map((arrow, index) => <div key={index} className="my-1">{visual.left_values[arrow.from]} → {visual.right_values[arrow.to]}</div>)}</div>
      <div><div className="mb-2 text-center font-bold">{visual.right_label}</div>{visual.right_values.map((value, index) => <div key={index} className="my-1 rounded-full border border-ink px-3 py-1 text-center">{value}</div>)}</div>
    </div>
  );
}

export default function QuestionVisualFigure({ visual }: { visual: QuestionVisual }) {
  return (
    <figure className="my-4 rounded border border-paper-deep bg-white p-3" role="img" aria-label={visual.alt_text}>
      {visual.format === 'plot' && <Plot visual={visual} />}
      {visual.format === 'diagram' && <Diagram visual={visual} />}
      {visual.format === 'chart' && <Chart visual={visual} />}
      {visual.format === 'table' && <Table visual={visual} />}
      {visual.format === 'number-line' && <NumberLine visual={visual} />}
      {visual.format === 'set-diagram' && <SetDiagram visual={visual} />}
      {visual.format === 'matrix' && <Matrix visual={visual} />}
      {visual.format === 'mapping' && <Mapping visual={visual} />}
      <figcaption className="sr-only">{visual.alt_text}</figcaption>
    </figure>
  );
}
