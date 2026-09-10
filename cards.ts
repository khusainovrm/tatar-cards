import { legacyCards } from './legacy-cards';
import { newA1Cards } from './content/course';

// Keep legacy words available in the catalog; the A1 groups contain phrases only.
export const cards = [...legacyCards, ...newA1Cards];
