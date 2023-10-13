import { Fragment } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

const CardFilter = ({
  changeOrderDir,
  orderValue = 'asc',
  search,
  searchValue,
  searchPlaceHolder,
  tags,
  searchTags
}) => (
  <Fragment>
    <select onChange={changeOrderDir} class="form-control custom-select w-auto">
      <option value="asc" selected={orderValue === 'asc'}>
        <Text id="global.orderDirAsc" />
      </option>
      <option value="desc" selected={orderValue === 'desc'}>
        <Text id="global.orderDirDesc" />
      </option>
    </select>
    {tags && (
      <div class="ml-2 w-50">
        <Select
          options={tags.map(tag => ({ value: tag.name, label: tag.name }))}
          onChange={tags => searchTags(tags.map(tag => tag.value))}
          closeMenuOnSelect={false}
          isMulti
          formatCreateLabel={inputValue => <Text id="editScene.createTag" fields={{ tagName: inputValue }} />}
        />
      </div>
    )}

    <div class="input-icon ml-2">
      <span class="input-icon-addon">
        <i class="fe fe-search" />
      </span>
      <input type="text" class="form-control" placeholder={searchPlaceHolder} onInput={search} value={searchValue} />
    </div>
  </Fragment>
);

export default CardFilter;
