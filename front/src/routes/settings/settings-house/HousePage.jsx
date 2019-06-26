import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import House from './House';
import EmptySearch from './EmptySearch';
import { RequestStatus } from '../../../utils/consts';

const loaderHeight = {
  height: '20rem'
};

const HousePage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="page-header">
      <div class="page-options d-flex">
        <select onChange={props.changeOrderDir} class="form-control custom-select w-auto">
          <option value="asc">
            <Text id="housesSettings.orderDirAsc" />
          </option>
          <option value="desc">
            <Text id="housesSettings.orderDirDesc" />
          </option>
        </select>
        <div class="input-icon ml-2">
          <span class="input-icon-addon">
            <i class="fe fe-search" />
          </span>
          <Localizer>
            <input
              type="text"
              class="form-control w-10"
              placeholder={<Text id="housesSettings.searchPlaceholder" />}
              onInput={props.debouncedSearch}
            />
          </Localizer>
        </div>
        <button onClick={props.addHouse} class="btn btn-outline-primary ml-2">
          <Text id="housesSettings.newButton" /> <i class="fe fe-plus" />
        </button>
      </div>
    </div>
    {props.housesGetStatus === RequestStatus.Getting && (
      <div class="dimmer active">
        <div class="loader" />
        <div style={loaderHeight} />
      </div>
    )}
    <div>
      <div class={props.housesGetStatus === RequestStatus.Getting ? 'dimmer active' : 'dimmer'}>
        <div class="dimmer-content">
          {props.houses &&
            props.houses.map((house, index) => (
              <House
                {...props}
                key={house.id}
                house={house}
                houseIndex={index}
                houseUpdateStatus={get(props.houseUpdateStatus, house.id)}
              />
            ))}
          {props.houses && props.houses.length === 0 && <EmptySearch housesSearch={props.housesSearch} />}
        </div>
      </div>
    </div>
  </SettingsLayout>
);

export default HousePage;
