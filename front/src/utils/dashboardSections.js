import { DASHBOARD_BOX_TYPE, DASHBOARD_SECTION_MOBILE_ORDER } from '../../../server/utils/constants';

// Maximum number of columns a dashboard section can hold
export const MAX_COLUMNS_PER_SECTION = 6;

// A column width is a small integer weight, not a free ratio: the editor
// only toggles a column between normal (1) and wide (2)
export const DEFAULT_COLUMN_WIDTH = 1;
export const WIDE_COLUMN_WIDTH = 2;

// Only the two supported weights survive: anything else (0, 3, NaN, a hole
// left by a malformed value) falls back to normal, so the renderer never
// divides by a zero total weight and never emits a NaN% share
const normalizeColumnWidth = width =>
  width === DEFAULT_COLUMN_WIDTH || width === WIDE_COLUMN_WIDTH ? width : DEFAULT_COLUMN_WIDTH;

// One weight per column, defaulting missing entries so callers can always
// index it safely whatever the stored shape
export const getSectionWidths = section =>
  section.columns.map((column, i) =>
    normalizeColumnWidth(Array.isArray(section.widths) ? section.widths[i] : undefined)
  );

// Box types that absorb the remaining height of their column so sections
// with columns of different heights don't leave blank space. This is a
// per-type constant, not a user setting: charts are excluded for now
// because their height is fixed by the chart library options.
// Media boxes stretch by letting their image absorb the extra height,
// tile boxes stretch by vertically centering their content in the card.
// The camera is deliberately NOT stretchable (forum 10737): a snapshot is
// information at a fixed aspect ratio, and every way of stretching its card
// was rejected in field testing — cover cropped the view, contain padded it
// with letterbox bands, and capping the card at the image ratio left the
// absorbed leftover as holes between the widgets of the column. A camera
// card keeps its natural height; the column simply ends earlier.
const MEDIA_STRETCH_BOX_TYPES = [DASHBOARD_BOX_TYPE.PHOTO];
const TILE_STRETCH_BOX_TYPES = [
  DASHBOARD_BOX_TYPE.TEMPERATURE_IN_ROOM,
  DASHBOARD_BOX_TYPE.HUMIDITY_IN_ROOM,
  // the illustration keeps its aspect ratio, the card centers it in the extra height
  DASHBOARD_BOX_TYPE.HOUSE_VIEW
];

export const canBoxStretch = box =>
  box && (MEDIA_STRETCH_BOX_TYPES.includes(box.type) || TILE_STRETCH_BOX_TYPES.includes(box.type));

// The house illustration keeps its aspect ratio: growing its card in the
// middle of a column only opens a hole of empty glass between two widgets,
// so it absorbs leftover height only when it sits at the bottom of its
// column. Media boxes are not concerned — their image visually fills the
// extra height wherever they sit — and value tiles share the leftover
// height by design in all-tile columns.
const LAST_ONLY_STRETCH_BOX_TYPES = [DASHBOARD_BOX_TYPE.HOUSE_VIEW];

export const canBoxStretchAt = (box, isLastInColumn) =>
  canBoxStretch(box) && (isLastInColumn || !LAST_ONLY_STRETCH_BOX_TYPES.includes(box.type));

export const isTileStretchBox = box => box && TILE_STRETCH_BOX_TYPES.includes(box.type);

// Value tiles (a number + a label) additionally become a size container when
// stretched, so their layout can adapt to the real rendered height. The
// house-view is excluded: its natural height (the illustration) is what
// drives the section height, so it must not be size-contained.
const VALUE_TILE_BOX_TYPES = [DASHBOARD_BOX_TYPE.TEMPERATURE_IN_ROOM, DASHBOARD_BOX_TYPE.HUMIDITY_IN_ROOM];

export const isValueTileBox = box => box && VALUE_TILE_BOX_TYPES.includes(box.type);

// Whether the box absorbs leftover column height, given the whole column.
// Value tiles share leftover height only in all-tile columns — the design's
// target: a row or stack of tiles equalizing with its neighbors (A.4). In a
// MIXED column (tiles above device lists, forum 10753) the tile kept
// absorbing too, but whether that absorption crosses the big-tile threshold
// hangs on the exact height balance of the section's columns — a balance the
// editor canvas cannot reproduce, since every widget wears ~4rem of edit
// chrome there and a column's height is therefore shifted by its widget
// count: the tile validated compact on the canvas came out as a big tile on
// the dashboard. Reserving the sharing for all-tile columns turns the
// decision into a structural one that the canvas applies identically without
// measuring anything: in a mixed column the tile keeps the compact card the
// editor showed and the column simply ends earlier, per the cap principle.
export const canBoxStretchInColumn = (box, column, isLastInColumn) =>
  canBoxStretchAt(box, isLastInColumn) && (!isValueTileBox(box) || column.every(isValueTileBox));

// The editor works on a flat list of columns (so drag & drop coordinates stay
// global) plus the number of columns of each section. Column widths flatten
// the same way, into one weight per global column index.
// The phone order of a section (DASHBOARD_SECTION_MOBILE_ORDER): rows when
// explicitly asked, columns otherwise (the historic order)
export const getSectionMobileOrder = section =>
  section && section.mobile_order === DASHBOARD_SECTION_MOBILE_ORDER.ROWS
    ? DASHBOARD_SECTION_MOBILE_ORDER.ROWS
    : DASHBOARD_SECTION_MOBILE_ORDER.COLUMNS;

export const flattenSections = sections => {
  const columns = [];
  const sectionSizes = [];
  const columnWidths = [];
  const sectionMobileOrders = [];
  sections.forEach(section => {
    section.columns.forEach(column => columns.push(column));
    sectionSizes.push(section.columns.length);
    columnWidths.push(...getSectionWidths(section));
    sectionMobileOrders.push(getSectionMobileOrder(section));
  });
  return { columns, sectionSizes, columnWidths, sectionMobileOrders };
};

export const buildSections = (columns, sectionSizes, columnWidths = [], sectionMobileOrders = []) => {
  const sections = [];
  let offset = 0;
  sectionSizes.forEach((size, sectionIndex) => {
    const section = { columns: columns.slice(offset, offset + size) };
    const widths = section.columns.map((column, i) => normalizeColumnWidth(columnWidths[offset + i]));
    // all-default widths stay implicit, matching the server normalization
    if (widths.some(width => width !== DEFAULT_COLUMN_WIDTH)) {
      section.widths = widths;
    }
    // same for the phone order: only the non-default value is stored
    if (sectionMobileOrders[sectionIndex] === DASHBOARD_SECTION_MOBILE_ORDER.ROWS) {
      section.mobile_order = DASHBOARD_SECTION_MOBILE_ORDER.ROWS;
    }
    sections.push(section);
    offset += size;
  });
  return sections;
};

// Global index of the first column of each section
export const getSectionOffsets = sectionSizes => {
  const offsets = [];
  let offset = 0;
  sectionSizes.forEach(size => {
    offsets.push(offset);
    offset += size;
  });
  return offsets;
};

// Index of the section containing the column at this global index
export const findSectionIndex = (sectionSizes, columnIndex) => {
  let offset = 0;
  for (let s = 0; s < sectionSizes.length; s += 1) {
    offset += sectionSizes[s];
    if (columnIndex < offset) {
      return s;
    }
  }
  return sectionSizes.length - 1;
};

// ---------------------------------------------------------------- in-place editing
// The dashboard itself (long press on a widget, "+" of the dock, "Add to a dashboard" of a device)
// edits the sections shape directly, a widget being named by its global column index x — the same
// x as the editor's flat columns and the data-x of the dashboard's widget slots — and its index y
// in that column. Every function returns new arrays: the sections it is given are never mutated.

const locateColumn = (sections, x) => {
  let offset = 0;
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const { columns } = sections[sectionIndex];
    if (x < offset + columns.length) {
      return { sectionIndex, columnIndex: x - offset };
    }
    offset += columns.length;
  }
  return null;
};

const withColumn = (sections, x, change) => {
  const location = locateColumn(sections, x);
  if (!location) {
    return sections;
  }
  return sections.map((section, sectionIndex) =>
    sectionIndex !== location.sectionIndex
      ? section
      : {
          ...section,
          columns: section.columns.map((column, columnIndex) =>
            columnIndex === location.columnIndex ? change([...column]) : column
          )
        }
  );
};

export const getBoxInSections = (sections, x, y) => {
  const location = locateColumn(sections || [], x);
  if (!location) {
    return null;
  }
  return sections[location.sectionIndex].columns[location.columnIndex][y] || null;
};

export const replaceBoxInSections = (sections, x, y, box) =>
  withColumn(sections, x, column => {
    column[y] = box;
    return column;
  });

export const removeBoxInSections = (sections, x, y) =>
  withColumn(sections, x, column => {
    column.splice(y, 1);
    return column;
  });

export const insertBoxInSections = (sections, x, y, box) => {
  if (!sections || sections.length === 0) {
    return [{ columns: [[box]] }];
  }
  return withColumn(sections, x, column => {
    column.splice(Math.min(y, column.length), 0, box);
    return column;
  });
};

// Where a new widget goes "at the top" (first column, first place) or "at the bottom" (last column
// of the last section, after its widgets) of a dashboard
export const getEdgePosition = (sections, edge) => {
  const columnCount = (sections || []).reduce((count, section) => count + section.columns.length, 0);
  if (columnCount === 0) {
    return { x: 0, y: 0 };
  }
  if (edge === 'top') {
    return { x: 0, y: 0 };
  }
  const x = columnCount - 1;
  const location = locateColumn(sections, x);
  return { x, y: sections[location.sectionIndex].columns[location.columnIndex].length };
};

// Every widget of a type, in reading order: { x, y, box }
export const findBoxesInSections = (sections, type) => {
  const found = [];
  let x = 0;
  (sections || []).forEach(section =>
    section.columns.forEach(column => {
      column.forEach((box, y) => {
        if (box && box.type === type) {
          found.push({ x, y, box });
        }
      });
      x += 1;
    })
  );
  return found;
};
