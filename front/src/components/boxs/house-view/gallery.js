import houseSolar from './gallery/house-solar.svg';
import houseFamily from './gallery/house-family.svg';
import houseModern from './gallery/house-modern.svg';
import apartment from './gallery/apartment.svg';

// Bundled house illustrations, all drawn in the same isometric style so any
// pick looks consistent with the rest of the dashboard. Referenced from the
// box config as "gallery:<key>".
export const HOUSE_VIEW_GALLERY = [
  { key: 'house-solar', url: houseSolar },
  { key: 'house-family', url: houseFamily },
  { key: 'house-modern', url: houseModern },
  { key: 'apartment', url: apartment }
];

export const getGalleryUrl = key => {
  const entry = HOUSE_VIEW_GALLERY.find(galleryEntry => galleryEntry.key === key);
  return entry && entry.url;
};
