import { Fragment } from 'preact';
import { Text } from 'preact-i18n';

import DeviceRow from '../../components/boxs/device-in-room/DeviceRow';

const ShowcaseFeature = ({ user, feature, readOnly, deviceIndex, deviceFeatureIndex, updateValue }) => {
  const props = {
    device: {
      name: `Device name`
    },
    deviceFeature: {
      ...feature,
      read_only: readOnly
    },
    roomIndex: 0,
    deviceIndex,
    deviceFeatureIndex,
    updateValue,
    user
  };

  const { category, type, unit } = feature;

  return (
    <Fragment>
      <tr>
        <td colSpan="3" class="bg-light py-1 text-muted">
          <small>
            <Text id={`deviceFeatureCategory.${category}.${type}`}>Unknown {type} type</Text>
            {unit && (
              <span>
                <Text id="showcase.unitSeparator" />
                <Text id={`deviceFeatureUnit.${unit}`}>Unknown {unit} unit</Text>
              </span>
            )}
          </small>
        </td>
      </tr>
      <DeviceRow {...props} />
    </Fragment>
  );
};

export default ShowcaseFeature;
