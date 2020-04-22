import { Text } from 'preact-i18n';

const MultiLevelDeviceType = ({ children, ...props }) => {
  function updateValue(e) {
    props.updateValue(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      e.target.value
    );
  }

  return (
    <tr>
      <td>
        <i class="fe fe-toggle-right" />
      </td>
      {props.deviceFeature.deviceFeatureName && <td>{props.deviceFeature.deviceFeatureName}</td>}
      {!props.deviceFeature.deviceFeatureName && (
        <td>
          <Text
            id="dashboard.boxes.devicesInRoom.deviceTitle"
            fields={{ name: props.deviceFeature.name, type: props.deviceFeature.type }}
          />
        </td>
      )}

      <td class="text-right" style="padding-top: 0px; padding-bottom: 0px">
        <div class="col">
          <input
            style={{
              minHeight: '30px'
            }}
            type="range"
            value={props.deviceFeature.last_value}
            onChange={updateValue}
            class="form-control custom-range"
            step={1}
            min={0}
            max={100}
          />
        </div>
      </td>
    </tr>
  );
};

export default MultiLevelDeviceType;
