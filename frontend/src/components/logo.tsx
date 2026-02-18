export function Logo({ size = 100 }: { size?: number }) {
  let keyId = 0;
  const p = (x: number, y: number) => (
    <rect key={keyId++} x={x} y={y} width={1} height={1} />
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {/* === Drawing Compass — white (top section) === */}
      <g fill="white">
        {/* Thumbscrew / knob */}
        {p(11, 0)}{p(12, 0)}

        {/* Pivot/hinge */}
        {p(11, 1)}{p(12, 1)}
        {p(11, 2)}{p(12, 2)}

        {/* Left leg — needle leg */}
        {p(10, 3)}
        {p(10, 4)}
        {p(9, 5)}
        {p(9, 6)}
        {p(8, 7)}
        {p(8, 8)}
        {p(7, 9)}
        {p(7, 10)}
        {p(6, 11)}
        {p(6, 12)}
        {p(5, 13)}
        {p(5, 14)}

        {/* Needle point */}
        {p(4, 15)}
        {p(5, 15)}

        {/* Right leg — pencil leg */}
        {p(13, 3)}
        {p(13, 4)}
        {p(14, 5)}
        {p(14, 6)}
        {p(15, 7)}
        {p(15, 8)}
        {p(16, 9)}
        {p(16, 10)}
        {p(17, 11)}
        {p(17, 12)}
        {p(18, 13)}
        {p(18, 14)}

        {/* Pencil tip */}
        {p(18, 15)}
        {p(19, 15)}
        {p(19, 14)}

        {/* Cross-brace between legs */}
        {p(10, 7)}{p(11, 7)}{p(12, 7)}{p(13, 7)}
      </g>

      {/* === Compass shadow / depth === */}
      <g fill="#6B7280">
        {/* Left leg shadow */}
        {p(11, 3)}
        {p(10, 5)}
        {p(9, 7)}
        {p(8, 9)}
        {p(7, 11)}
        {p(6, 13)}

        {/* Right leg shadow */}
        {p(14, 4)}
        {p(15, 6)}
        {p(16, 8)}
        {p(17, 10)}
        {p(18, 12)}
        {p(19, 13)}

        {/* Brace shadow */}
        {p(10, 8)}{p(11, 8)}{p(12, 8)}{p(13, 8)}
      </g>

      {/* === Four Chicago six-pointed stars (red) — bottom row === */}
      <g fill="#EF4444">
        {/* Star 1 (x=2) */}
        {p(2, 18)}
        {p(1, 19)}{p(2, 19)}{p(3, 19)}
        {p(0, 20)}{p(1, 20)}{p(2, 20)}{p(3, 20)}{p(4, 20)}
        {p(1, 21)}{p(2, 21)}{p(3, 21)}
        {p(2, 22)}

        {/* Star 2 (x=8) */}
        {p(8, 18)}
        {p(7, 19)}{p(8, 19)}{p(9, 19)}
        {p(6, 20)}{p(7, 20)}{p(8, 20)}{p(9, 20)}{p(10, 20)}
        {p(7, 21)}{p(8, 21)}{p(9, 21)}
        {p(8, 22)}

        {/* Star 3 (x=14) */}
        {p(14, 18)}
        {p(13, 19)}{p(14, 19)}{p(15, 19)}
        {p(12, 20)}{p(13, 20)}{p(14, 20)}{p(15, 20)}{p(16, 20)}
        {p(13, 21)}{p(14, 21)}{p(15, 21)}
        {p(14, 22)}

        {/* Star 4 (x=20) */}
        {p(20, 18)}
        {p(19, 19)}{p(20, 19)}{p(21, 19)}
        {p(18, 20)}{p(19, 20)}{p(20, 20)}{p(21, 20)}{p(22, 20)}
        {p(19, 21)}{p(20, 21)}{p(21, 21)}
        {p(20, 22)}
      </g>
    </svg>
  );
}
