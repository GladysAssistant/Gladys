import { Fragment } from 'preact';
import { Localizer } from 'preact-i18n';

import SortSelect from './SortSelect';

const SearchInput = ({ searchPlaceHolder, search, searchValue }) => {
  const input = (
    <input type="text" class="form-control" placeholder={searchPlaceHolder} onInput={search} value={searchValue} />
  );

  if (typeof searchPlaceHolder === 'string') {
    return input;
  }

  return <Localizer>{input}</Localizer>;
};

const CardFilter = ({ changeOrderDir, orderValue = 'asc', search, searchValue, searchPlaceHolder, extraOrderDirs }) => (
  <Fragment>
    <SortSelect
      value={orderValue}
      onChange={changeOrderDir}
      options={[
        { value: 'asc', labelId: 'global.orderDirAsc' },
        { value: 'desc', labelId: 'global.orderDirDesc' },
        ...(extraOrderDirs || [])
      ]}
    />

    <div class="input-icon ml-2">
      <span class="input-icon-addon">
        <i class="fe fe-search" />
      </span>
      <SearchInput searchPlaceHolder={searchPlaceHolder} search={search} searchValue={searchValue} />
    </div>
  </Fragment>
);

export default CardFilter;
