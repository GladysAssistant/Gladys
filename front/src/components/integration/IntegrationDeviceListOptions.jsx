import { Fragment } from 'preact';
import { Text, Localizer } from 'preact-i18n';

const IntegrationDeviceListOptions = ({ changeOrderDir, debouncedSearch }) => {
  return (
    <Fragment>
      <select onChange={changeOrderDir} class="form-control custom-select w-auto">
        <option value="asc">
          <Text id="global.orderDirAsc" />
        </option>
        <option value="desc">
          <Text id="global.orderDirDesc" />
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
            placeholder={<Text id="integration.root.device.search" />}
            onInput={debouncedSearch}
          />
        </Localizer>
      </div>
    </Fragment>
  );
};

export default IntegrationDeviceListOptions;
