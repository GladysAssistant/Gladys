import { Text } from 'preact-i18n';
import style from './FormulaFunctionsHelp.css';

// Mirrors the restricted mathjs namespace built in server/lib/scene/scene.formula.js.
// Function and constant names are not translated, so they live here instead of the i18n files.
const OPERATORS = '+  -  *  /  %  ^  ( )  >  >=  <  <=';
const FUNCTIONS =
  'abs, ceil, floor, fix, round, sign, sqrt, cbrt, square, cube, pow, nthRoot, hypot, ' +
  'exp, log, log2, log10, min, max, mean, median, sum, prod, gcd, lcm, random, randomInt, ' +
  'sin, cos, tan, asin, acos, atan, atan2';
const CONSTANTS = 'pi, e, tau';

const FormulaFunctionsHelp = () => (
  <div class={style.formulaHelp}>
    <div>
      <Text id="editScene.actionsCard.formulaHelp.operators" /> <code>{OPERATORS}</code>
    </div>
    <div>
      <Text id="editScene.actionsCard.formulaHelp.functions" /> <code>{FUNCTIONS}</code>
    </div>
    <div>
      <Text id="editScene.actionsCard.formulaHelp.constants" /> <code>{CONSTANTS}</code>
    </div>
    <div>
      <Text id="editScene.actionsCard.formulaHelp.example" />
    </div>
  </div>
);

export default FormulaFunctionsHelp;
