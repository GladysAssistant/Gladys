import { Text } from 'preact-i18n';
import cx from 'classnames';
import RemoteCategories from './templates';

const updateType = updateRemoteTypeFunc => e => {
  const { value } = e.target;
  updateRemoteTypeFunc(value);
};

const RemoteControlSelector = ({ updateRemoteTypeAndButtons, remoteType, dashboard }) => (
  <div class="form-group">
    <label
      class={cx({
        'form-label': !dashboard
      })}
      for="remoteType"
    >
      <Text id="remoteControl.creation.selectTypeLabel" />
    </label>
    <select id="remoteType" onChange={updateType(updateRemoteTypeAndButtons)} class="form-control">
      <option value="">
        <Text id="global.emptySelectOption" />
      </option>
      {Object.keys(RemoteCategories).map(category => (
        <option selected={category === remoteType} value={category}>
          <Text id={`deviceFeatureCategory.${category}.shortCategoryName`}>{category}</Text>
        </option>
      ))}
    </select>
  </div>
);

export default RemoteControlSelector;
