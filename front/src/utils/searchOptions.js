// Search should not care about case or accents ("temperature" must match "Température")
export const normalizeSearchString = str =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// react-select filterOption: every typed word must match (implicit AND) against the option's
// `searchText` when it has one (room + device + feature, so "motion living" finds the motion
// sensor of the living room), against its label otherwise
export const filterOptionByWords = (option, rawInput) => {
  if (!rawInput) {
    return true;
  }
  const searchText = (option.data && option.data.searchText) || normalizeSearchString(String(option.label));
  return normalizeSearchString(rawInput)
    .split(/\s+/)
    .filter(Boolean)
    .every(word => searchText.includes(word));
};
