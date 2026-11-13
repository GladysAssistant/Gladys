import { Text } from 'preact-i18n';
import cx from 'classnames';

import BottomSheet from '../../../../components/sheet/BottomSheet';
import TriggerParams from '../TriggerParams';
import SheetForm from './SheetForm';
import style from '../../mobile.css';

// The sheet of one trigger of the mobile editor (docs/specs/scene-editor-mobile.md, E.4): mounted
// for the whole life of the trigger, like a step sheet (a trigger form may register variables)
const TriggerSheet = props => {
  const { trigger, index, open, info } = props;
  const hasType = trigger.type !== null;
  return (
    <BottomSheet
      open={open}
      keepMounted
      title={info.title}
      size={hasType ? undefined : 'full'}
      onClose={props.onClose}
      onOk={hasType ? props.onClose : undefined}
      dataCy={`scene-trigger-sheet-${index}`}
    >
      <SheetForm>
        <TriggerParams
          trigger={trigger}
          index={index}
          updateTriggerProperty={props.updateTriggerProperty}
          variables={props.variables}
          setVariablesTrigger={props.setVariablesTrigger}
          sceneIntegrations={props.sceneIntegrations}
          autoFocusSearch={open && !hasType}
          fill
        />
      </SheetForm>
      {hasType && (
        <div class={style.sheetActions}>
          <button
            type="button"
            class={cx(style.sheetAction, style.sheetActionDanger)}
            onClick={props.onDelete}
            data-cy={`scene-trigger-sheet-delete-${index}`}
          >
            <i class="fe fe-trash-2" aria-hidden="true" />
            <Text id="editScene.mobile.deleteTrigger" />
          </button>
        </div>
      )}
    </BottomSheet>
  );
};

export default TriggerSheet;
