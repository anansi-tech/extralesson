// The territories CXC actually serves, and what money they use.
//
// Our currency convention was written as "always EC$" to keep a bare $ out of
// the maths — and EC$ is the Eastern Caribbean dollar, used by seven of the
// sixteen. So the rule quietly confined every priced question to the OECS: of
// 34 questions naming a place, 28 were St Lucia or Grenada, and none were set
// in Jamaica, Trinidad, Guyana, Belize or the Bahamas — between them most of
// the candidates sitting the paper.
//
// A question set in Kingston priced in EC$ is not merely repetitive, it is
// wrong. So a question picks a territory and uses that territory's money.

export interface Territory {
  name: string;
  /** How the paper writes the money: prefix + amount, never a bare $. */
  currency: string;
  /** A place or two inside it, so a stem can be specific. */
  places: string[];
}

export const TERRITORIES: Territory[] = [
  { name: 'Jamaica', currency: 'J$', places: ['Kingston', 'Montego Bay', 'Ocho Rios'] },
  { name: 'Trinidad and Tobago', currency: 'TT$', places: ['Port of Spain', 'San Fernando', 'Scarborough'] },
  { name: 'Guyana', currency: 'G$', places: ['Georgetown', 'Linden', 'New Amsterdam'] },
  { name: 'Barbados', currency: 'BB$', places: ['Bridgetown', 'Speightstown', 'Oistins'] },
  { name: 'Belize', currency: 'BZ$', places: ['Belize City', 'Belmopan', 'San Ignacio'] },
  { name: 'The Bahamas', currency: 'B$', places: ['Nassau', 'Freeport'] },
  { name: 'Saint Lucia', currency: 'EC$', places: ['Castries', 'Vieux Fort', 'Soufrière'] },
  { name: 'Grenada', currency: 'EC$', places: ["St George's", 'Grenville', 'Carriacou'] },
  { name: 'Saint Vincent and the Grenadines', currency: 'EC$', places: ['Kingstown', 'Bequia'] },
  { name: 'Dominica', currency: 'EC$', places: ['Roseau', 'Portsmouth'] },
  { name: 'Antigua and Barbuda', currency: 'EC$', places: ["St John's", 'Codrington'] },
  { name: 'Saint Kitts and Nevis', currency: 'EC$', places: ['Basseterre', 'Charlestown'] },
  { name: 'Montserrat', currency: 'EC$', places: ['Brades', 'Salem'] },
  { name: 'Anguilla', currency: 'EC$', places: ['The Valley'] },
  { name: 'Cayman Islands', currency: 'KY$', places: ['George Town', 'West Bay'] },
  { name: 'British Virgin Islands', currency: 'US$', places: ['Road Town', 'Spanish Town'] },
  { name: 'Turks and Caicos Islands', currency: 'US$', places: ['Providenciales', 'Cockburn Town'] },
];

/** How many recent questions a territory must stay clear of. */
export const TERRITORY_MEMORY = 8;

/**
 * Territories a topic has used recently, so generation can choose elsewhere.
 * Matched on the territory's own name and its places, since a stem usually
 * names a town rather than the country.
 */
export function recentTerritories(texts: string[]): string[] {
  const seen: string[] = [];
  for (const text of texts.slice(0, TERRITORY_MEMORY)) {
    for (const t of TERRITORIES) {
      const named = [t.name, ...t.places].some((p) => new RegExp(`\\b${p}\\b`, 'i').test(text));
      if (named && !seen.includes(t.name)) seen.push(t.name);
    }
  }
  return seen;
}

/** Prompt block: pick a territory, use its money, avoid the recent ones. */
export function territoryGuidance(recentTexts: string[]): string {
  const used = recentTerritories(recentTexts);
  const avoid = used.length ? ` Recently used here: ${used.join(', ')} — set this one somewhere else.` : '';
  return `TERRITORY: when the question names a place, pick ONE from the territories CXC serves and use that territory's money. Jamaica J$, Trinidad and Tobago TT$, Guyana G$, Barbados BB$, Belize BZ$, The Bahamas B$, the OECS states (Saint Lucia, Grenada, Saint Vincent, Dominica, Antigua, Saint Kitts, Montserrat, Anguilla) EC$, Cayman KY$, the British Virgin Islands and Turks and Caicos US$. Jamaica and Trinidad have the largest candidate entries; do not write every question in the Eastern Caribbean.${avoid}`;
}
