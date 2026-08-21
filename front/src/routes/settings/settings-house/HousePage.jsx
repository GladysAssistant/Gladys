import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import HouseCard from './HouseCard';
import EmptyState from './EmptyState';
import { RequestStatus } from '../../../utils/consts';
import CardFilter from '../../../components/layout/CardFilter';
import style from './style.css';

const countRooms = houses =>
  (houses || []).reduce((total, house) => total + (house.rooms || []).filter(room => !room.to_delete).length, 0);

const HousePage = ({ children, ...props }) => {
  const houses = props.houses || [];
  const roomCount = countRooms(houses);
  const loading = props.housesGetStatus === RequestStatus.Getting;

  return (
    <SettingsLayout>
      <div class="page-header d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-sm-between">
        <div>
          <h1 class="page-title">
            <Text id="housesSettings.title" />
          </h1>
          <p class={style.pageSubtitle}>
            <Text id="housesSettings.subtitle" />
          </p>
        </div>
        <div class="d-flex align-items-center mt-2 mt-sm-0">
          <div class="d-flex">
            <Localizer>
              <CardFilter
                changeOrderDir={props.changeOrderDir}
                orderValue={props.getHousesOrderDir}
                search={props.debouncedSearch}
                searchValue={props.housesSearch}
                searchPlaceHolder={<Text id="housesSettings.searchPlaceholder" />}
              />
            </Localizer>
          </div>
          <button onClick={props.addHouse} class="btn btn-outline-primary ml-2 flex-shrink-0">
            <span class="d-none d-lg-inline-block mr-2">
              <Text id="housesSettings.newButton" />
            </span>
            <i class="fe fe-plus" />
          </button>
        </div>
      </div>
      <div class={cx('dimmer', style.houseList, { active: loading })}>
        <div class="loader" />
        <div class="dimmer-content">
          {houses.length > 0 && (
            <p class={style.listSummary}>
              <Text
                id={houses.length > 1 ? 'housesSettings.houseCount' : 'housesSettings.oneHouseCount'}
                fields={{ count: houses.length }}
              />
              {' · '}
              <Text
                id={roomCount > 1 ? 'housesSettings.summary.rooms' : 'housesSettings.summary.oneRoom'}
                fields={{ count: roomCount }}
              />
            </p>
          )}
          {houses.map((house, index) => (
            <HouseCard
              {...props}
              key={house.id}
              house={house}
              houseIndex={index}
              expanded={props.expandedHouseId === house.id}
              dirty={Boolean(get(props.dirtyHouses, house.id))}
              onToggle={() => props.toggleHouse(house.id)}
              houseUpdateStatus={get(props.houseUpdateStatus, house.id)}
            />
          ))}
          {houses.length === 0 && !loading && (
            <EmptyState housesSearch={props.housesSearch} addHouse={props.addHouse} />
          )}
        </div>
      </div>
    </SettingsLayout>
  );
};

export default HousePage;
