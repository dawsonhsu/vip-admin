'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AUTO_HAND_LIMIT,
  AUTO_LIMITS,
  BaccaratResult,
  BeadCell,
  BigRoadCell,
  ColorRoadCell,
  ROAD_ROWS,
  buildRoads,
  isAutoResetDue,
  parseSequence,
  weightedRandomResult,
} from './roads';

type OverlayOptions = {
  auto: boolean;
  speed: number;
  checker: boolean;
  controls: boolean;
};

type GridVars = React.CSSProperties & {
  '--cols': number;
  '--cell': string;
};

const DEFAULT_SPEED = 1500;
const MIN_SPEED = 100;
const MAX_SPEED = 30000;

const INITIAL_OPTIONS: OverlayOptions = {
  auto: true,
  speed: DEFAULT_SPEED,
  checker: false,
  controls: false,
};

function readOptions(): OverlayOptions & { sequence: BaccaratResult[] } {
  const params = new URLSearchParams(window.location.search);
  const requestedSpeed = Number(params.get('speed'));
  const speed =
    Number.isFinite(requestedSpeed) && requestedSpeed >= MIN_SPEED
      ? Math.min(requestedSpeed, MAX_SPEED)
      : DEFAULT_SPEED;

  return {
    auto: params.get('auto') !== '0',
    speed,
    checker: params.get('bg') === 'checker',
    controls: params.get('controls') === '1',
    sequence: parseSequence(params.get('seq')),
  };
}

function cellKey(col: number, row: number): string {
  return `${col}:${row}`;
}

function gridSlots(cols: number): Array<{ col: number; row: number }> {
  const slots: Array<{ col: number; row: number }> = [];

  for (let row = 0; row < ROAD_ROWS; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      slots.push({ col, row });
    }
  }

  return slots;
}

function mapCells<T extends { col: number; row: number }>(cells: T[]): Map<string, T> {
  const map = new Map<string, T>();
  cells.forEach((cell) => {
    map.set(cellKey(cell.col, cell.row), cell);
  });
  return map;
}

function resultGlyph(result: BaccaratResult): string {
  if (result === 'B') {
    return '莊';
  }

  if (result === 'P') {
    return '閒';
  }

  return '和';
}

function appendWithAutoBounds(
  previous: BaccaratResult[],
  result: BaccaratResult,
): BaccaratResult[] {
  const roads = buildRoads(previous);
  if (isAutoResetDue(previous, roads)) {
    return [result];
  }

  return [...previous, result];
}

function RoadPanel({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`baccaratPanel${compact ? ' baccaratPanelCompact' : ''}`}>
      <div className="baccaratPanelTitle">{title}</div>
      {children}
    </section>
  );
}

function BeadPlate({ cells, cols }: { cells: BeadCell[]; cols: number }) {
  const cellMap = useMemo(() => mapCells(cells), [cells]);
  const slots = useMemo(() => gridSlots(cols), [cols]);
  const style: GridVars = { '--cols': cols, '--cell': '24px' };

  return (
    <div className="baccaratGrid baccaratBeadGrid" style={style}>
      {slots.map((slot) => {
        const cell = cellMap.get(cellKey(slot.col, slot.row));
        return (
          <div
            className="baccaratGridCell"
            key={cellKey(slot.col, slot.row)}
            style={{ gridColumn: slot.col + 1, gridRow: slot.row + 1 }}
          >
            {cell ? (
              <span className={`baccaratBead baccaratBead${cell.result}`}>
                {resultGlyph(cell.result)}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function BigRoad({ cells, cols }: { cells: BigRoadCell[]; cols: number }) {
  const cellMap = useMemo(() => mapCells(cells), [cells]);
  const slots = useMemo(() => gridSlots(cols), [cols]);
  const style: GridVars = { '--cols': cols, '--cell': '24px' };

  return (
    <div className="baccaratGrid baccaratBigGrid" style={style}>
      {slots.map((slot) => {
        const cell = cellMap.get(cellKey(slot.col, slot.row));
        return (
          <div
            className="baccaratGridCell"
            key={cellKey(slot.col, slot.row)}
            style={{ gridColumn: slot.col + 1, gridRow: slot.row + 1 }}
          >
            {cell ? (
              <>
                <span className={`baccaratHollow baccarat${cell.color}`} />
                {cell.tieCount > 0 ? <span className="baccaratTieSlash" /> : null}
                {cell.tieCount > 1 ? (
                  <span className="baccaratTieCount">{cell.tieCount}</span>
                ) : null}
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DerivedRoad({
  cells,
  cols,
  variant,
}: {
  cells: ColorRoadCell[];
  cols: number;
  variant: 'hollow' | 'dot' | 'slash';
}) {
  const cellMap = useMemo(() => mapCells(cells), [cells]);
  const slots = useMemo(() => gridSlots(cols), [cols]);
  const style: GridVars = { '--cols': cols, '--cell': '12px' };

  return (
    <div className={`baccaratGrid baccaratDerivedGrid baccaratDerived${variant}`} style={style}>
      {slots.map((slot) => {
        const cell = cellMap.get(cellKey(slot.col, slot.row));
        return (
          <div
            className="baccaratGridCell"
            key={cellKey(slot.col, slot.row)}
            style={{ gridColumn: slot.col + 1, gridRow: slot.row + 1 }}
          >
            {cell ? <span className={`baccaratDerivedMark baccarat${cell.color}`} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function BaccaratOverlayPage() {
  const [results, setResults] = useState<BaccaratResult[]>([]);
  const [options, setOptions] = useState<OverlayOptions>(INITIAL_OPTIONS);
  const [mounted, setMounted] = useState(false);
  const roads = useMemo(() => buildRoads(results), [results]);

  useEffect(() => {
    const nextOptions = readOptions();
    setOptions(nextOptions);
    setResults(nextOptions.sequence);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !options.auto) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setResults((previous) => {
        const previousRoads = buildRoads(previous);
        if (isAutoResetDue(previous, previousRoads)) {
          return [];
        }

        return [...previous, weightedRandomResult()];
      });
    }, options.speed);

    return () => window.clearInterval(interval);
  }, [mounted, options.auto, options.speed]);

  if (!mounted) {
    return null;
  }

  const beadCols = Math.max(
    AUTO_LIMITS.beadColumns,
    Math.ceil(Math.max(results.length, 1) / ROAD_ROWS),
  );
  const bigCols = Math.max(AUTO_LIMITS.bigColumns, roads.big.maxCol + 1);
  const derivedCols = Math.max(
    AUTO_LIMITS.derivedColumns,
    roads.bigEye.maxCol + 1,
    roads.small.maxCol + 1,
    roads.cockroach.maxCol + 1,
  );

  const addResult = (result: BaccaratResult) => {
    setResults((previous) => appendWithAutoBounds(previous, result));
  };

  return (
    <main className={`baccaratOverlay${options.checker ? ' baccaratChecker' : ''}`}>
      <div className="baccaratStrip" aria-label="Baccarat roadmap overlay demo">
        <RoadPanel title="珠盤路">
          <BeadPlate cells={roads.bead} cols={beadCols} />
        </RoadPanel>

        <RoadPanel title="大路">
          <BigRoad cells={roads.big.cells} cols={bigCols} />
        </RoadPanel>

        <div className="baccaratDerivedStack">
          <RoadPanel title="大眼仔" compact>
            <DerivedRoad cells={roads.bigEye.cells} cols={derivedCols} variant="hollow" />
          </RoadPanel>

          <RoadPanel title="小路" compact>
            <DerivedRoad cells={roads.small.cells} cols={derivedCols} variant="dot" />
          </RoadPanel>

          <RoadPanel title="曱甴路" compact>
            <DerivedRoad cells={roads.cockroach.cells} cols={derivedCols} variant="slash" />
          </RoadPanel>
        </div>
      </div>

      {options.controls ? (
        <div className="baccaratControls">
          <span className="baccaratHandCount">{results.length}/{AUTO_HAND_LIMIT}</span>
          <button type="button" onClick={() => addResult('P')}>
            閒
          </button>
          <button type="button" onClick={() => addResult('B')}>
            莊
          </button>
          <button type="button" onClick={() => addResult('T')}>
            和
          </button>
          <button type="button" onClick={() => setResults((previous) => previous.slice(0, -1))}>
            Undo
          </button>
          <button type="button" onClick={() => setResults([])}>
            New Shoe
          </button>
        </div>
      ) : null}

      <style>{`
        .baccaratOverlay {
          min-height: 100vh;
          width: 100vw;
          overflow: hidden;
          box-sizing: border-box;
          background: transparent;
          color: #162033;
          font-family: Arial, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
        }

        .baccaratChecker {
          background-color: #ffffff;
          background-image:
            linear-gradient(45deg, #cfd6df 25%, transparent 25%),
            linear-gradient(-45deg, #cfd6df 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #cfd6df 75%),
            linear-gradient(-45deg, transparent 75%, #cfd6df 75%);
          background-position: 0 0, 0 8px, 8px -8px, -8px 0;
          background-size: 16px 16px;
        }

        .baccaratStrip {
          display: grid;
          grid-template-columns: auto auto auto;
          align-items: start;
          gap: 8px;
          width: max-content;
          max-width: 100vw;
          box-sizing: border-box;
          padding: 8px;
        }

        .baccaratPanel {
          overflow: hidden;
          border: 1px solid rgba(114, 128, 147, 0.45);
          border-radius: 6px;
          background: #f8fbff;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.14);
        }

        .baccaratPanelTitle {
          height: 20px;
          display: flex;
          align-items: center;
          padding: 0 7px;
          border-bottom: 1px solid rgba(114, 128, 147, 0.28);
          background: linear-gradient(#ffffff, #edf3f9);
          color: #26364d;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
        }

        .baccaratPanelCompact .baccaratPanelTitle {
          height: 16px;
          font-size: 10px;
          padding: 0 5px;
        }

        .baccaratDerivedStack {
          display: grid;
          gap: 6px;
        }

        .baccaratGrid {
          display: grid;
          grid-template-columns: repeat(var(--cols), var(--cell));
          grid-template-rows: repeat(6, var(--cell));
          width: max-content;
          background:
            linear-gradient(#d6dee8, #d6dee8) left top / 1px 100% no-repeat,
            linear-gradient(#d6dee8, #d6dee8) left top / 100% 1px no-repeat,
            #fbfdff;
        }

        .baccaratGridCell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: var(--cell);
          height: var(--cell);
          border-right: 1px solid #d6dee8;
          border-bottom: 1px solid #d6dee8;
        }

        .baccaratBead {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          box-shadow:
            inset 0 -1px 2px rgba(0, 0, 0, 0.22),
            0 1px 1px rgba(15, 23, 42, 0.18);
        }

        .baccaratBeadB {
          background: #d9212a;
        }

        .baccaratBeadP {
          background: #1769d8;
        }

        .baccaratBeadT {
          background: #119b53;
        }

        .baccaratHollow {
          width: 17px;
          height: 17px;
          border-radius: 999px;
          border: 3px solid currentColor;
          box-sizing: border-box;
          background: #fbfdff;
        }

        .baccaratred {
          color: #d9212a;
        }

        .baccaratblue {
          color: #1769d8;
        }

        .baccaratTieSlash {
          position: absolute;
          width: 22px;
          height: 3px;
          border-radius: 999px;
          background: #119b53;
          transform: rotate(-45deg);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
        }

        .baccaratTieCount {
          position: absolute;
          right: 2px;
          bottom: 0;
          min-width: 9px;
          height: 10px;
          border-radius: 999px;
          background: #ffffff;
          color: #0b7c41;
          font-size: 8px;
          font-weight: 800;
          line-height: 10px;
          text-align: center;
        }

        .baccaratDerivedGrid .baccaratGridCell {
          border-right-color: #dbe2ea;
          border-bottom-color: #dbe2ea;
        }

        .baccaratDerivedMark {
          display: block;
          box-sizing: border-box;
        }

        .baccaratDerivedhollow .baccaratDerivedMark {
          width: 8px;
          height: 8px;
          border: 2px solid currentColor;
          border-radius: 999px;
          background: #fbfdff;
        }

        .baccaratDeriveddot .baccaratDerivedMark {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: currentColor;
        }

        .baccaratDerivedslash .baccaratDerivedMark {
          width: 10px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          transform: rotate(-45deg);
        }

        .baccaratControls {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin: 0 8px 8px;
          padding: 6px;
          border: 1px solid rgba(114, 128, 147, 0.5);
          border-radius: 6px;
          background: rgba(248, 251, 255, 0.94);
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.12);
        }

        .baccaratHandCount {
          min-width: 42px;
          color: #42526b;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }

        .baccaratControls button {
          min-width: 34px;
          height: 26px;
          border: 1px solid #aab7c7;
          border-radius: 4px;
          background: #ffffff;
          color: #1f2d42;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .baccaratControls button:hover {
          background: #eef4fb;
        }

        @media (max-width: 1100px) {
          .baccaratOverlay {
            overflow: auto;
          }

          .baccaratStrip {
            grid-template-columns: auto;
          }
        }

        @media (max-width: 560px) {
          .baccaratStrip {
            padding: 6px;
            gap: 6px;
          }

          .baccaratBeadGrid,
          .baccaratBigGrid {
            --cell: 20px !important;
          }

          .baccaratDerivedGrid {
            --cell: 10px !important;
          }

          .baccaratBead {
            width: 15px;
            height: 15px;
            font-size: 9px;
          }

          .baccaratHollow {
            width: 14px;
            height: 14px;
            border-width: 2px;
          }

          .baccaratTieSlash {
            width: 18px;
            height: 2px;
          }
        }
      `}</style>
    </main>
  );
}
