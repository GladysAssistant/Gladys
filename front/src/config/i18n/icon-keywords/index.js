import en from './en.json';
import fr from './fr.json';
import de from './de.json';
import { AVAILABLE_LANGUAGES } from '../../../../../server/utils/constants';

// Search keywords for the scene icon picker, kept out of the main translation
// files: they are one entry per icon rather than UI strings, and `npm run
// compare-translations` compares i18n/*.json against each other.
export default { [AVAILABLE_LANGUAGES.FR]: fr, [AVAILABLE_LANGUAGES.EN]: en, [AVAILABLE_LANGUAGES.DE]: de };
