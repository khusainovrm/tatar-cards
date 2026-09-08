import { cards } from '../cards';
import { assertValidBuiltinCards } from '../src/features/cards/domain/catalog';

assertValidBuiltinCards(cards);
console.log(`Validated ${cards.length} built-in cards.`);
