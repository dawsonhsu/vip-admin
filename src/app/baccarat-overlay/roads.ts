export type BaccaratResult = 'P' | 'B' | 'T';
export type BaccaratSide = 'P' | 'B';
export type RoadColor = 'red' | 'blue';

export interface BeadCell {
  col: number;
  row: number;
  result: BaccaratResult;
}

export interface BigRoadCell {
  col: number;
  row: number;
  logicalCol: number;
  logicalRow: number;
  side: BaccaratSide;
  color: RoadColor;
  tieCount: number;
}

export interface ColorRoadCell {
  col: number;
  row: number;
  color: RoadColor;
}

export interface BigRoadModel {
  cells: BigRoadCell[];
  maxCol: number;
  logicalColumns: BigRoadCell[][];
}

export interface ColorRoadModel {
  cells: ColorRoadCell[];
  maxCol: number;
}

export interface RoadBundle {
  bead: BeadCell[];
  big: BigRoadModel;
  bigEye: ColorRoadModel;
  small: ColorRoadModel;
  cockroach: ColorRoadModel;
}

export const ROAD_ROWS = 6;
export const AUTO_HAND_LIMIT = 70;
export const AUTO_LIMITS = {
  beadColumns: 12,
  bigColumns: 34,
  derivedColumns: 34,
};

const RESULT_CHARS = new Set(['P', 'B', 'T']);

function keyOf(col: number, row: number): string {
  return `${col}:${row}`;
}

function colorForSide(side: BaccaratSide): RoadColor {
  return side === 'B' ? 'red' : 'blue';
}

function firstFreeColumnAtRow(
  occupied: Set<string>,
  startCol: number,
  row: number,
): number {
  let col = startCol;
  while (occupied.has(keyOf(col, row))) {
    col += 1;
  }
  return col;
}

export function parseSequence(raw: string | null): BaccaratResult[] {
  if (!raw) {
    return [];
  }

  return raw
    .toUpperCase()
    .split('')
    .filter((char): char is BaccaratResult => RESULT_CHARS.has(char));
}

export function buildBeadPlate(results: BaccaratResult[]): BeadCell[] {
  return results.map((result, index) => ({
    result,
    row: index % ROAD_ROWS,
    col: Math.floor(index / ROAD_ROWS),
  }));
}

export function buildBigRoad(results: BaccaratResult[]): BigRoadModel {
  const cells: BigRoadCell[] = [];
  const logicalColumns: BigRoadCell[][] = [];
  const occupied = new Set<string>();

  let lastCell: BigRoadCell | null = null;
  let lastSide: BaccaratSide | null = null;
  let logicalCol = -1;
  let logicalRow = -1;
  let isDragging = false;
  let maxCol = -1;

  results.forEach((result) => {
    if (result === 'T') {
      if (lastCell) {
        lastCell.tieCount += 1;
      }
      return;
    }

    const side = result;
    let col = 0;
    let row = 0;

    if (!lastCell || side !== lastSide) {
      logicalCol += 1;
      logicalRow = 0;
      isDragging = false;

      if (lastCell) {
        col = firstFreeColumnAtRow(occupied, lastCell.col + 1, 0);
      }

      logicalColumns[logicalCol] = [];
    } else {
      logicalRow += 1;

      if (isDragging) {
        col = firstFreeColumnAtRow(occupied, lastCell.col + 1, lastCell.row);
        row = lastCell.row;
      } else {
        const downRow = lastCell.row + 1;
        if (downRow < ROAD_ROWS && !occupied.has(keyOf(lastCell.col, downRow))) {
          col = lastCell.col;
          row = downRow;
        } else {
          col = firstFreeColumnAtRow(occupied, lastCell.col + 1, lastCell.row);
          row = lastCell.row;
          isDragging = true;
        }
      }
    }

    const cell: BigRoadCell = {
      col,
      row,
      logicalCol,
      logicalRow,
      side,
      color: colorForSide(side),
      tieCount: 0,
    };

    cells.push(cell);
    logicalColumns[logicalCol].push(cell);
    occupied.add(keyOf(col, row));
    maxCol = Math.max(maxCol, col);
    lastCell = cell;
    lastSide = side;
  });

  return {
    cells,
    maxCol,
    logicalColumns,
  };
}

function hasLogicalCell(columns: BigRoadCell[][], col: number, row: number): boolean {
  return Boolean(columns[col] && columns[col][row]);
}

function getDerivedColor(
  cell: BigRoadCell,
  columns: BigRoadCell[][],
  offset: number,
): RoadColor | null {
  const compareCol = cell.logicalCol - offset;

  if (cell.logicalRow === 0) {
    const previousCompareCol = compareCol - 1;
    if (previousCompareCol < 0) {
      return null;
    }

    return columns[compareCol].length === columns[previousCompareCol].length
      ? 'red'
      : 'blue';
  }

  if (compareCol < 0) {
    return null;
  }

  const sameRowExists = hasLogicalCell(columns, compareCol, cell.logicalRow);
  const rowAboveExists = hasLogicalCell(columns, compareCol, cell.logicalRow - 1);

  return sameRowExists === rowAboveExists ? 'red' : 'blue';
}

function buildColorRoad(colors: RoadColor[]): ColorRoadModel {
  const cells: ColorRoadCell[] = [];
  const occupied = new Set<string>();

  let lastCell: ColorRoadCell | null = null;
  let lastColor: RoadColor | null = null;
  let isDragging = false;
  let maxCol = -1;

  colors.forEach((color) => {
    let col = 0;
    let row = 0;

    if (!lastCell || color !== lastColor) {
      isDragging = false;
      if (lastCell) {
        col = firstFreeColumnAtRow(occupied, lastCell.col + 1, 0);
      }
    } else if (isDragging) {
      col = firstFreeColumnAtRow(occupied, lastCell.col + 1, lastCell.row);
      row = lastCell.row;
    } else {
      const downRow = lastCell.row + 1;
      if (downRow < ROAD_ROWS && !occupied.has(keyOf(lastCell.col, downRow))) {
        col = lastCell.col;
        row = downRow;
      } else {
        col = firstFreeColumnAtRow(occupied, lastCell.col + 1, lastCell.row);
        row = lastCell.row;
        isDragging = true;
      }
    }

    const cell: ColorRoadCell = { col, row, color };
    cells.push(cell);
    occupied.add(keyOf(col, row));
    maxCol = Math.max(maxCol, col);
    lastCell = cell;
    lastColor = color;
  });

  return { cells, maxCol };
}

function buildDerivedRoad(big: BigRoadModel, offset: number): ColorRoadModel {
  const colors: RoadColor[] = [];

  big.cells.forEach((cell) => {
    const color = getDerivedColor(cell, big.logicalColumns, offset);
    if (color) {
      colors.push(color);
    }
  });

  return buildColorRoad(colors);
}

export function buildRoads(results: BaccaratResult[]): RoadBundle {
  const big = buildBigRoad(results);

  return {
    bead: buildBeadPlate(results),
    big,
    bigEye: buildDerivedRoad(big, 1),
    small: buildDerivedRoad(big, 2),
    cockroach: buildDerivedRoad(big, 3),
  };
}

export function weightedRandomResult(): BaccaratResult {
  const roll = Math.random();

  if (roll < 0.46) {
    return 'P';
  }

  if (roll < 0.92) {
    return 'B';
  }

  return 'T';
}

export function isAutoResetDue(results: BaccaratResult[], roads: RoadBundle): boolean {
  return (
    results.length >= AUTO_HAND_LIMIT ||
    Math.ceil(results.length / ROAD_ROWS) > AUTO_LIMITS.beadColumns ||
    roads.big.maxCol + 1 > AUTO_LIMITS.bigColumns ||
    roads.bigEye.maxCol + 1 > AUTO_LIMITS.derivedColumns ||
    roads.small.maxCol + 1 > AUTO_LIMITS.derivedColumns ||
    roads.cockroach.maxCol + 1 > AUTO_LIMITS.derivedColumns
  );
}
