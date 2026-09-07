import houseSolar from './gallery/house-solar.svg';
import houseFamily from './gallery/house-family.svg';
import houseModern from './gallery/house-modern.svg';
import apartment from './gallery/apartment.svg';

// Bundled house illustrations, all drawn in the same isometric style so any
// pick looks consistent with the rest of the dashboard. Referenced from the
// box config as "gallery:<key>".
// ratio is each illustration's width/height, copied from its viewBox: the
// files are viewBox-only SVGs with no intrinsic dimensions, so nothing can
// be measured from the loaded <img> (naturalWidth is 0) — the stretched-tile
// sizing needs the ratio declared here (see HouseViewBox).
export const HOUSE_VIEW_GALLERY = [
  { key: 'house-solar', url: houseSolar, ratio: 270.5 / 194.0 },
  { key: 'house-family', url: houseFamily, ratio: 266.1 / 210.0 },
  { key: 'house-modern', url: houseModern, ratio: 283.5 / 199.5 },
  { key: 'apartment', url: apartment, ratio: 248.8 / 234.5 }
];

const getGalleryEntry = key => HOUSE_VIEW_GALLERY.find(galleryEntry => galleryEntry.key === key);

export const getGalleryUrl = key => {
  const entry = getGalleryEntry(key);
  return entry && entry.url;
};

export const getGalleryRatio = key => {
  const entry = getGalleryEntry(key);
  return (entry && entry.ratio) || null;
};
