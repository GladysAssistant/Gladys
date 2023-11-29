import { Fragment } from 'preact';
import { Text } from 'preact-i18n';

const CardFilter = ({ changeOrderDir, orderValue = 'asc', search, searchValue, searchPlaceHolder }) => (
  <Fragment>
    <select onChange={changeOrderDir} class="form-control custom-select w-auto">
      <option value="asc" selected={orderValue === 'asc'}>
        <Text id="global.orderDirAsc" />
      </option>
      <option value="desc" selected={orderValue === 'desc'}>
        <Text id="global.orderDirDesc" />
      </option>
    </select>

    <div class="input-icon ml-2">
      <span class="input-icon-addon">
        <i class="fe fe-search" />
      </span>
      <input type="text" class="form-control" placeholder={searchPlaceHolder} onInput={search} value={searchValue} />
    </div>
  </Fragment>
);

export default CardFilter;
