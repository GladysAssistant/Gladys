import { Text } from 'preact-i18n';
import cx from 'classnames';
import { REMOTE_CATEGORIES } from './templates';

const updateType = updateRemoteTypeFunc => e => {
  const { value } = e.target;
  updateRemoteTypeFunc(value);
};

const RemoteControlSelector = ({ updateRemoteType, remoteType, dashboard, disabled }) => (
  <div class="form-group">
    <label
      class={cx({
        'form-label': !dashboard
      })}
      for="remoteType"
    >
      <Text id="remoteControl.creation.selectTypeLabel" />
    </label>
    <select id="remoteType" onChange={updateType(updateRemoteType)} class="form-control" disabled={disabled}>
      <option value="" disabled selected={!remoteType}>
        <Text id="global.emptySelectOption" />
      </option>
      {REMOTE_CATEGORIES.map(category => (
        <option selected={category === remoteType} value={category}>
          <Text id={`deviceFeatureCategory.${category}.shortCategoryName`}>{category}</Text>
        </option>
      ))}
    </select>
  </div>
);

export default RemoteControlSelector;
