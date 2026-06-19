import get from 'get-value';
import { Text } from 'preact-i18n';
import CardFilter from '../../components/layout/CardFilter';
import withIntlAsProp from '../../utils/withIntlAsProp';
import style from './style.css';

const IntegrationPageHeader = ({
  intl,
  orderDir,
  changeOrderDir,
  search,
  searchKeyword,
  integrationsLength,
  totalSize
}) => {
  const showResultCount = searchKeyword.length > 0 || integrationsLength !== totalSize;
  const searchPlaceholder = get(intl.dictionary, 'integration.root.searchPlaceholder', {
    default: ''
  });

  return (
    <>
      <div class={style.headerDesktop}>
        <div class="page-header">
          <h1 class="page-title">
            <Text id="integration.root.title" />
          </h1>
          <div class="page-subtitle">
            <Text id="integration.root.subtitle" fields={{ length: integrationsLength, total: totalSize }} />
          </div>
          <div class="page-options d-flex">
            <CardFilter
              changeOrderDir={changeOrderDir}
              orderValue={orderDir}
              search={search}
              searchValue={searchKeyword}
              searchPlaceHolder={searchPlaceholder}
            />
          </div>
        </div>
      </div>

      <div class={style.headerMobile}>
        <div class={style.mobileHeaderTop}>
          <h1 class={style.mobileTitle}>
            <Text id="integration.root.title" />
          </h1>
          <select onChange={changeOrderDir} class={`form-control custom-select ${style.mobileSort}`} value={orderDir}>
            <option value="asc">
              <Text id="global.orderDirAsc" />
            </option>
            <option value="desc">
              <Text id="global.orderDirDesc" />
            </option>
          </select>
        </div>
        <div class={style.mobileSearch}>
          <div class="input-icon">
            <span class="input-icon-addon">
              <i class="fe fe-search" />
            </span>
            <input
              type="text"
              class="form-control"
              placeholder={searchPlaceholder}
              onInput={search}
              value={searchKeyword}
            />
          </div>
        </div>
        {showResultCount && (
          <div class={style.mobileResultCount}>
            <Text id="integration.root.subtitle" fields={{ length: integrationsLength, total: totalSize }} />
          </div>
        )}
      </div>
    </>
  );
};

export default withIntlAsProp(IntegrationPageHeader);
