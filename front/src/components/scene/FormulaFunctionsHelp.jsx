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

// A native <details> keeps the reference collapsed by default so it costs one line in the action
// box, and opens on click without any state or JS. It also stays keyboard-reachable for free.
const FormulaFunctionsHelp = () => (
  <details class={style.formulaHelp}>
    <summary class={style.summary}>
      <Text id="editScene.actionsCard.formulaHelp.toggle" />
    </summary>
    <div class={style.content}>
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
      <div>
        <Text id="editScene.actionsCard.formulaHelp.caveats" />
      </div>
    </div>
  </details>
);

export default FormulaFunctionsHelp;
