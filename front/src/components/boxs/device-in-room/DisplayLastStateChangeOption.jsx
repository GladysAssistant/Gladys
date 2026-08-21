import { Text } from 'preact-i18n';

/**
 * Shared editor option of the "devices" and "devices in room" boxes: when enabled, every
 * binary sensor of the box displays, under its state, the date at which this state was
 * reached (door opened/closed, motion detected...).
 */
const DisplayLastStateChangeOption = ({ box, x, y, updateDisplayLastStateChange }) => {
  // The edit dashboard displays every box at once, so a hardcoded id would be duplicated as soon
  // as two devices boxes are on the dashboard, and clicking the label of one would toggle the
  // checkbox of the other. The box coordinates make it unique.
  const inputId = `displayLastStateChange-${x}-${y}`;
  return (
    <div class="form-group">
      <label class="custom-switch">
        <input
          type="checkbox"
          id={inputId}
          name="displayLastStateChange"
          class="custom-switch-input"
          checked={box.display_last_state_change === true}
          onClick={updateDisplayLastStateChange}
        />
        <span class="custom-switch-indicator" />
        <span class="custom-switch-description">
          <Text id="dashboard.boxes.devicesInRoom.displayLastStateChangeLabel" />
        </span>
      </label>
      <p class="mt-2">
        <small class="text-muted">
          <Text id="dashboard.boxes.devicesInRoom.displayLastStateChangeDescription" />
        </small>
      </p>
    </div>
  );
};

export default DisplayLastStateChangeOption;
