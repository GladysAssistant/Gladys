import { Text } from 'preact-i18n';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import House from './House';
import EmptySearch from './EmptySearch';
import { RequestStatus } from '../../../utils/consts';
import PageOptions from '../../../components/form/PageOptions';

const loaderHeight = {
  height: '20rem'
};

const HousePage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="page-header">
      <PageOptions
        searchPlaceholder={<Text id="housesSettings.searchPlaceholder" />}
        changeOrderDir={props.changeOrderDir}
        debouncedSearch={props.debouncedSearch}
      >
        <button onClick={props.addHouse} class="btn btn-outline-primary ml-2">
          <Text id="housesSettings.newButton" /> <i class="fe fe-plus" />
        </button>
      </PageOptions>
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
