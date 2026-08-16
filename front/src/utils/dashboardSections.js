import { DASHBOARD_BOX_TYPE } from '../../../server/utils/constants';

// Maximum number of columns a dashboard section can hold
export const MAX_COLUMNS_PER_SECTION = 6;

// Box types that absorb the remaining height of their column so sections
// with columns of different heights don't leave blank space. This is a
// per-type constant, not a user setting: charts are excluded for now
// because their height is fixed by the chart library options.
// Media boxes stretch by letting their image absorb the extra height,
// tile boxes stretch by vertically centering their content in the card.
const MEDIA_STRETCH_BOX_TYPES = [DASHBOARD_BOX_TYPE.CAMERA, DASHBOARD_BOX_TYPE.PHOTO];
const TILE_STRETCH_BOX_TYPES = [
  DASHBOARD_BOX_TYPE.TEMPERATURE_IN_ROOM,
  DASHBOARD_BOX_TYPE.HUMIDITY_IN_ROOM,
  // the illustration keeps its aspect ratio, the card centers it in the extra height
  DASHBOARD_BOX_TYPE.HOUSE_VIEW
];

export const canBoxStretch = box =>
  box && (MEDIA_STRETCH_BOX_TYPES.includes(box.type) || TILE_STRETCH_BOX_TYPES.includes(box.type));

export const isTileStretchBox = box => box && TILE_STRETCH_BOX_TYPES.includes(box.type);

// Value tiles (a number + a label) additionally become a size container when
// stretched, so their layout can adapt to the real rendered height. The
// house-view is excluded: its natural height (the illustration) is what
// drives the section height, so it must not be size-contained.
const VALUE_TILE_BOX_TYPES = [DASHBOARD_BOX_TYPE.TEMPERATURE_IN_ROOM, DASHBOARD_BOX_TYPE.HUMIDITY_IN_ROOM];

export const isValueTileBox = box => box && VALUE_TILE_BOX_TYPES.includes(box.type);

// The editor works on a flat list of columns (so drag & drop coordinates stay
// global) plus the number of columns of each section.
export const flattenSections = sections => {
  const columns = [];
  const sectionSizes = [];
  sections.forEach(section => {
    section.columns.forEach(column => columns.push(column));
    sectionSizes.push(section.columns.length);
  });
  return { columns, sectionSizes };
};

export const buildSections = (columns, sectionSizes) => {
  const sections = [];
  let offset = 0;
  sectionSizes.forEach(size => {
    sections.push({ columns: columns.slice(offset, offset + size) });
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
