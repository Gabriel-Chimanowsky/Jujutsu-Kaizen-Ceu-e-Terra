import React from 'react';

export default function AttributesRadarChart({ attributes, color = '#8a2be2' }) {
  // Safe parsing of attribute values
  const FOR = attributes?.forca ?? 10;
  const DES = attributes?.destreza ?? 10;
  const CON = attributes?.constituicao ?? 10;
  const INT = attributes?.inteligencia ?? 10;
  const SAB = attributes?.sabedoria ?? 10;
  const PRE = attributes?.presenca ?? 10;

  const data = [
    { name: 'FOR', value: FOR, label: `FOR: ${FOR}` },
    { name: 'DES', value: DES, label: `DES: ${DES}` },
    { name: 'CON', value: CON, label: `CON: ${CON}` },
    { name: 'INT', value: INT, label: `INT: ${INT}` },
    { name: 'SAB', value: SAB, label: `SAB: ${SAB}` },
    { name: 'PRE', value: PRE, label: `PRE: ${PRE}` }
  ];

  const maxVal = Math.max(20, FOR, DES, CON, INT, SAB, PRE);
  
  const cx = 140;
  const cy = 100;
  const rOuter = 65;

  // Calculate coordinates for a given value fraction at specific index
  const getCoordinates = (index, value) => {
    const angle = (index * 2 * Math.PI) / 6 - Math.PI / 2;
    const r = (value / maxVal) * rOuter;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  // Generate string of points for a given value level (e.g. for grid or data)
  const getPointsString = (valuesArray) => {
    return valuesArray
      .map((val, i) => {
        const { x, y } = getCoordinates(i, val);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Grid levels: 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPoints = gridLevels.map(level => {
    const values = Array(6).fill(maxVal * level);
    return getPointsString(values);
  });

  // Main data points
  const charValues = data.map(d => d.value);
  const dataPointsString = getPointsString(charValues);

  // Label coordinate offset (push labels outside the grid a bit)
  const getLabelCoordinates = (index) => {
    const angle = (index * 2 * Math.PI) / 6 - Math.PI / 2;
    const r = rOuter + 14;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  return (
    <div className="w-full flex items-center justify-center py-2 relative select-none">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 280 200" 
        className="max-w-[270px] filter drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Radial gradient background */}
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`${color}10`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base circle background */}
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#radarBg)" />

        {/* Radial grid lines (axes from center to outer points) */}
        {Array(6).fill(null).map((_, i) => {
          const outerPt = getCoordinates(i, maxVal);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke="rgba(255, 255, 255, 0.25)"
              className="stroke-neutral-400/30 dark:stroke-white/20"
              strokeWidth="1.2"
              strokeDasharray="2,3"
            />
          );
        })}

        {/* Concentric grid polygons */}
        {gridPoints.map((points, idx) => (
          <polygon
            key={`grid-lvl-${idx}`}
            points={points}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.35)"
            className="stroke-neutral-400/40 dark:stroke-white/30"
            strokeWidth="1.2"
            strokeDasharray={idx === gridPoints.length - 1 ? 'none' : '3,3'}
          />
        ))}

        {/* Cursed Area Polygon */}
        <polygon
          points={dataPointsString}
          fill={`${color}40`}
          stroke={color}
          strokeWidth="3.5"
          filter="url(#glow)"
          className="transition-all duration-500 ease-out"
        />

        {/* Anchor point dots for values */}
        {charValues.map((val, i) => {
          const { x, y } = getCoordinates(i, val);
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={y}
              r="4.5"
              fill="#fff"
              stroke={color}
              strokeWidth="2.5"
              className="transition-all duration-500 ease-out"
            />
          );
        })}

        {/* Outer labels */}
        {data.map((d, i) => {
          const { x, y } = getLabelCoordinates(i);
          // Adjust text alignment based on position
          let textAnchor = 'middle';
          let dy = '0.35em';
          
          const angleDeg = (i * 60);
          if (angleDeg === 0) {
            dy = '-0.5em';
          } else if (angleDeg === 180) {
            dy = '1.1em';
          } else if (angleDeg > 0 && angleDeg < 180) {
            textAnchor = 'start';
          } else {
            textAnchor = 'end';
          }

          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dy={dy}
              fontSize="14.5"
              fontWeight="900"
              fontFamily="sans-serif"
              className="fill-neutral-900 dark:fill-gray-100 font-extrabold tracking-wider transition-all duration-300"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
