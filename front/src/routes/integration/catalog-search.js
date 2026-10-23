import normalizeSearchText from '../../utils/normalizeSearchText';

// The search is the first filter of a catalog of hundreds of integrations:
// most of the time the user already knows what they are looking for (a brand,
// a device, a service). It therefore reads more than the card shows — every
// language of the description, the search-only `keywords` of the manifest, the
// repository owner (the author) and the countries served — and ranks what it
// finds, so that "Sonos" is the card named Sonos before the cards that
// mention it (docs/specs/integration-catalog-categories.md §4).

// Several words are all required, in any order: "borne recharge" finds
// "Bornes de recharge". Accents and case are folded on both sides.
export const getSearchTokens = keyword =>
  normalizeSearchText(keyword)
    .split(/\s+/)
    .filter(Boolean);

// Ranks, best first. Ties are broken by the sort the user chose.
export const SEARCH_RANK = {
  NAME_STARTS_WITH: 0,
  NAME: 1,
  KEYWORDS: 2,
  TEXT: 3
};

// The text a card is searched through, folded once when the catalog is built
// rather than on every keystroke. `name` and `keywords` are kept apart for the
// ranking; `text` is everything.
export const buildSearchIndex = ({ name, descriptions = [], keywords = [], author = '', extra = [] }) => {
  const keywordTerms = [...keywords, author].filter(Boolean);
  return {
    name: normalizeSearchText(name),
    keywords: normalizeSearchText(keywordTerms.join(' ')),
    text: normalizeSearchText([name, ...descriptions, ...keywordTerms, ...extra].filter(Boolean).join(' '))
  };
};

// null when the card does not match, else its rank
export const getSearchRank = (searchIndex, tokens) => {
  if (!tokens.every(token => searchIndex.text.includes(token))) {
    return null;
  }
  if (searchIndex.name.startsWith(tokens.join(' '))) {
    return SEARCH_RANK.NAME_STARTS_WITH;
  }
  if (tokens.every(token => searchIndex.name.includes(token))) {
    return SEARCH_RANK.NAME;
  }
  if (tokens.every(token => searchIndex.keywords.includes(token))) {
    return SEARCH_RANK.KEYWORDS;
  }
  return SEARCH_RANK.TEXT;
};
