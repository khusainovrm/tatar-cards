import { cards } from '../cards';
import { assertValidBuiltinCards } from '../src/features/cards/domain/catalog';
import { validateStarterCourse } from '../content/course';

assertValidBuiltinCards(cards);
validateStarterCourse();
console.log(`Validated ${cards.length} built-in cards.`);
console.log('Validated 20 A1 groups, 50 phrases each, including every existing phrase.');
