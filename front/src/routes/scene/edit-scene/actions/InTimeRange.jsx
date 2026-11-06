import { Text } from 'preact-i18n';

/**
 * Condition on the time ranges of the scene: continue when we are inside one of them
 * (or outside, when the user picks the opposite).
 *
 * @param {object} props - Props of the component.
 * @returns {object} The component.
 */
const InTimeRange = props => {
  const inRange = props.action.in_range !== false;
  // Without a time-range trigger there is nothing to be inside: the scene stops at this
  // step every time it runs, which the card said nothing about.
  const hasTimeRangeTrigger = ((props.scene && props.scene.triggers) || []).some(
    trigger => trigger.scheduler_type === 'time-range'
  );

  const handleChange = e => {
    props.updateActionProperty(props.path, 'in_range', e.target.value === 'true');
  };

  return (
    <div>
      <div class="form-group">
        <div class="form-label">
          <Text id="editScene.actionsCard.inTimeRange.label" />
        </div>
        <select class="form-control" value={String(inRange)} onChange={handleChange}>
          <option value="true">
            <Text id="editScene.actionsCard.inTimeRange.inRange" />
          </option>
          <option value="false">
            <Text id="editScene.actionsCard.inTimeRange.outOfRange" />
          </option>
        </select>
      </div>
      {!hasTimeRangeTrigger && (
        <div class="alert alert-warning">
          <Text id="editScene.actionsCard.inTimeRange.noTrigger" />
        </div>
      )}
      <div class="alert alert-info">
        <Text id="editScene.actionsCard.inTimeRange.description" />
      </div>
    </div>
  );
};

export default InTimeRange;
