import { Text, Localizer } from 'preact-i18n';
import Select from './Select';

const PageOptions = ({ children, changeOrderDir, debouncedSearch, searchPlaceholder, searchValue }) => (
  <div class="page-options d-flex">
    {changeOrderDir && (
      <Select
        noMargin
        size="1"
        placeholder={<Text id="global.orderPlaceholder" />}
        onChange={changeOrderDir}
        uniqueKey="value"
        options={[
          {
            value: 'asc',
            label: <Text id="global.orderDirAsc" />
          },
          {
            value: 'desc',
            label: <Text id="global.orderDirDesc" />
          }
        ]}
      />
    )}
    {debouncedSearch && (
      <div class="input-icon ml-2">
        <span class="input-icon-addon">
          <i class="fe fe-search" />
        </span>
        <Localizer>
          <input
            type="text"
            class="form-control w-10"
            value={searchValue}
            placeholder={searchPlaceholder || <Text id="global.searchPlaceholder" />}
            onInput={debouncedSearch}
          />
        </Localizer>
      </div>
    )}
    {children}
  </div>
);

export default PageOptions;
