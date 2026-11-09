import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import get from 'get-value';
import { useState, useCallback } from 'preact/hooks';

import TriggerParams from './TriggerParams';
import { SCENE_DECLARATION_KINDS, getSceneDeclarationTitle } from './sceneIntegrations';

import { EVENTS } from '../../../../../server/utils/constants';
import { TRIGGER_ICON, TRIGGER_COLOR, COLOR_CLASS } from './typesCatalog';
import { getTriggerSummary } from './summary';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import style from './style.css';

const deleteTriggerFromList = (deleteTrigger, index) => () => {
  deleteTrigger(index);
};

const TriggerCard = ({ children, ...props }) => {
  // A new trigger starts expanded (the type picker is shown), an existing one
  // starts collapsed with a short summary, like the action cards
  const [expanded, setExpanded] = useState(props.trigger.type === null);
  const toggleExpanded = useCallback(() => {
    setExpanded(previousExpanded => !previousExpanded);
  }, []);
  const summary = !expanded ? getTriggerSummary(props.trigger, props.intl.dictionary) : null;
  // a trigger declared by an external integration is titled by its manifest
  // label; an orphan one (uninstalled, key removed) keeps the generic label
  const declarationTitle =
    props.trigger.type === EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT
      ? getSceneDeclarationTitle(
          props.sceneIntegrations,
          SCENE_DECLARATION_KINDS.trigger,
          props.trigger,
          get(props, 'user.language') || 'en'
        )
      : null;

  return (
    <div class={cx('card user-select-none', style.stepCard)}>
      <div class={cx('card-header', style.stepCardHeader)}>
        <span
          class={cx(style.stepIconTile, style[COLOR_CLASS[TRIGGER_COLOR[props.trigger.type]] || 'typePickerIconGray'])}
        >
          {TRIGGER_ICON[props.trigger.type] && <i class={TRIGGER_ICON[props.trigger.type]} />}
          {props.trigger.type === null && <i class="fe fe-plus-circle" />}
        </span>
        <div class={style.stepText} onClick={toggleExpanded} data-not-an-edit>
          <span class={style.stepLabel}>
            {declarationTitle || <Text id={`editScene.triggers.${props.trigger.type}`} />}
            {props.trigger.type === null && <Text id="editScene.newTrigger" />}
          </span>
          {summary && <span class={style.stepSummary}>{summary}</span>}
        </div>
        <div class="card-options">
          <Localizer>
            <button
              type="button"
              onClick={deleteTriggerFromList(props.deleteTrigger, props.index)}
              class={cx('card-options-remove mr-4', style.cardOptionButton)}
              aria-label={<Text id="editScene.deleteTriggerButton" />}
            >
              <i class="fe fe-x" />
            </button>
          </Localizer>
          <Localizer>
            <button
              type="button"
              onClick={toggleExpanded}
              data-not-an-edit
              class={style.cardOptionButton}
              aria-expanded={expanded}
              aria-label={<Text id={expanded ? 'editScene.collapseStepButton' : 'editScene.expandStepButton'} />}
            >
              <i class={cx('fe', expanded ? 'fe-chevron-up' : 'fe-chevron-down')} />
            </button>
          </Localizer>
        </div>
      </div>
      <div class={cx('card-body', { 'd-none': !expanded })}>
        <TriggerParams
          trigger={props.trigger}
          index={props.index}
          updateTriggerProperty={props.updateTriggerProperty}
          variables={props.variables}
          setVariablesTrigger={props.setVariablesTrigger}
          sceneIntegrations={props.sceneIntegrations}
        />
      </div>
    </div>
  );
};

export default connect('user', {})(withIntlAsProp(TriggerCard));
