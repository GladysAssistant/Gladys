import { Fragment } from 'preact';
import { Text, Localizer } from 'preact-i18n';

const SearchInput = ({ searchPlaceHolder, search, searchValue }) => {
  const input = (
    <input type="text" class="form-control" placeholder={searchPlaceHolder} onInput={search} value={searchValue} />
  );

  if (typeof searchPlaceHolder === 'string') {
    return input;
  }

  return <Localizer>{input}</Localizer>;
};

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
      <SearchInput searchPlaceHolder={searchPlaceHolder} search={search} searchValue={searchValue} />
    </div>
  </Fragment>
);

export default CardFilter;
