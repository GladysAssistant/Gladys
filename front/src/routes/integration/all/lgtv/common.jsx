import { useCallback } from 'preact/hooks';
import { Text } from 'preact-i18n';
import { route } from 'preact-router';
import { RequestStatus } from '../../../../utils/consts';

export const NewLink = ({ onClick }) => (
  <span class="ml-2">
    <Text id="integration.lgtv.or" />{' '}
    <a href="/dashboard/integration/device/lgtv/add" onClick={onClick}>
      <Text id="integration.lgtv.setUpManually" />
    </a>
  </span>
);

export const NewButton = () => {
  const onClick = useCallback(() => {
    route('/dashboard/integration/device/lgtv/discover');
  });
  return (
    <button onClick={onClick} class="btn btn-secondary ml-2">
      <Text id="integration.lgtv.new" />
      <i class="fe fe-plus" />
    </button>
  );
};

export const RoomInput = ({ houses, onChange, selectedRoomId }) => (
  <div class="form-group">
    <label>
      <Text id="integration.lgtv.device.roomLabel" />
    </label>
    <select onChange={onChange} class="form-control">
      <option value="">
        <Text id="global.emptySelectOption" />
      </option>
      {houses &&
        houses.map(house => (
          <optgroup label={house.name}>
            {house.rooms.map(room => (
              <option selected={room.id === selectedRoomId} value={room.id}>
                {room.name}
              </option>
            ))}
          </optgroup>
        ))}
    </select>
  </div>
);

export const ScanButton = ({ onClick, scanStatus }) => (
  <button onClick={onClick} class="btn btn-primary ml-2" disabled={scanStatus === RequestStatus.Getting}>
    {scanStatus === RequestStatus.Getting ? (
      <Text id="integration.lgtv.scanning" />
    ) : (
      <Text id="integration.lgtv.discoverButton" />
    )}{' '}
    <i class="fe fe-radio" />
  </button>
);
