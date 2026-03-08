import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import House from './House';
import EmptySearch from './EmptySearch';
import { RequestStatus } from '../../../utils/consts';
import CardFilter from '../../../components/layout/CardFilter';

const HousePage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="page-header">
      <div class="page-options d-flex">
        <Localizer>
          <CardFilter
            changeOrderDir={props.changeOrderDir}
            orderValue={props.getHousesOrderDir}
            search={props.debouncedSearch}
            searchValue={props.housesSearch}
            searchPlaceHolder={<Text id="housesSettings.searchPlaceholder" />}
          />
        </Localizer>
        <button onClick={props.addHouse} class="btn btn-outline-primary ml-2">
          <Text id="housesSettings.newButton" /> <i class="fe fe-plus" />
        </button>
      </div>
    </div>
    {props.housesGetStatus === RequestStatus.Getting && (
      <div class="dimmer active h-50">
        <div class="loader" />
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
