import React from 'react';

export default function UnifiedRadarChart({ characters = [], selectedIds = [] }) {
  const comparedChars = characters.filter(c => selectedIds.includes(c.id));

  // Determine global max attribute value among all compared characters to set relative scale
  let maxVal = 20; // Base default scale
  comparedChars.forEach(char => {
    const FOR = char.attributes?.forca ?? 10;
    const DES = char.attributes?.destreza ?? 10;
    const CON = char.attributes?.constituicao ?? 10;
    const INT = char.attributes?.inteligencia ?? 10;
    const SAB = char.attributes?.sabedoria ?? 10;
    const PRE = char.attributes?.presenca ?? 10;
    maxVal = Math.max(maxVal, FOR, DES, CON, INT, SAB, PRE);
  });

  const cx = 140;
  const cy = 100;
  const rOuter = 65;

  // Coordinate calculation relative to global maxVal
  const getCoordinates = (index, value) => {
    const angle = (index * 2 * Math.PI) / 6 - Math.PI / 2;
    const r = (value / maxVal) * rOuter;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  const getPointsString = (char) => {
    const FOR = char.attributes?.forca ?? 10;
    const DES = char.attributes?.destreza ?? 10;
    const CON = char.attributes?.constituicao ?? 10;
    const INT = char.attributes?.inteligencia ?? 10;
    const SAB = char.attributes?.sabedoria ?? 10;
    const PRE = char.attributes?.presenca ?? 10;
    const valuesArray = [FOR, DES, CON, INT, SAB, PRE];

    return valuesArray
      .map((val, i) => {
        const { x, y } = getCoordinates(i, val);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Outer labels (FOR, DES, CON, INT, SAB, PRE)
  const labels = [
    { name: 'FOR', label: 'FOR' },
    { name: 'DES', label: 'DES' },
    { name: 'CON', label: 'CON' },
    { name: 'INT', label: 'INT' },
    { name: 'SAB', label: 'SAB' },
    { name: 'PRE', label: 'PRE' }
  ];

  const getLabelCoordinates = (index) => {
    const angle = (index * 2 * Math.PI) / 6 - Math.PI / 2;
    const r = rOuter + 14;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    };
  };

  // Concentric grid levels
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPoints = gridLevels.map(level => {
    const values = Array(6).fill(maxVal * level);
    return values
      .map((val, i) => {
        const { x, y } = getCoordinates(i, val);
        return `${x},${y}`;
      })
      .join(' ');
  });

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 relative select-none">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 280 200" 
        className="max-w-[270px] filter drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="unifiedRadarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(138, 43, 226, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          
          <filter id="unifiedGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base circle background */}
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#unifiedRadarBg)" />

        {/* Radial grid lines */}
        {Array(6).fill(null).map((_, i) => {
          const outerPt = getCoordinates(i, maxVal);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              strokeDasharray="1,2"
            />
          );
        })}

        {/* Concentric grid polygons */}
        {gridPoints.map((points, idx) => (
          <polygon
            key={`grid-lvl-${idx}`}
            points={points}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
            strokeDasharray={idx === gridPoints.length - 1 ? 'none' : '3,3'}
          />
        ))}

        {/* Render polygon for each active character */}
        {comparedChars.map((char) => {
          const color = char.cor_energia || '#8a2be2';
          const pointsStr = getPointsString(char);
          return (
            <g key={`poly-g-${char.id}`}>
              <polygon
                points={pointsStr}
                fill={`${color}12`}
                stroke={color}
                strokeWidth="2"
                filter="url(#unifiedGlow)"
                className="transition-all duration-500 ease-out"
              />
              {/* Dots on vertices */}
              { [
                char.attributes?.forca ?? 10,
                char.attributes?.destreza ?? 10,
                char.attributes?.constituicao ?? 10,
                char.attributes?.inteligencia ?? 10,
                char.attributes?.sabedoria ?? 10,
                char.attributes?.presenca ?? 10
              ].map((val, i) => {
                const { x, y } = getCoordinates(i, val);
                return (
                  <circle
                    key={`dot-${char.id}-${i}`}
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="#fff"
                    stroke={color}
                    strokeWidth="1.5"
                    className="transition-all duration-500 ease-out"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Outer labels */}
        {labels.map((d, i) => {
          const { x, y } = getLabelCoordinates(i);
          let textAnchor = 'middle';
          let dy = '0.35em';
          
          const angleDeg = (i * 60);
          if (angleDeg === 0) {
            dy = '-0.4em';
          } else if (angleDeg === 180) {
            dy = '1em';
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
              fill="#e2e8f0"
              fontSize="9"
              fontWeight="900"
              fontFamily="sans-serif"
              className="fill-gray-300 tracking-wider transition-all duration-300"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
