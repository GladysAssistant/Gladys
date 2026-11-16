import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { route } from 'preact-router';
import cx from 'classnames';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import { SERVICE_STATUS } from '../../../../../server/utils/constants';
import { integrations } from '../../../config/integrations';
import BottomSheet from '../../../components/sheet/BottomSheet';
import { isSheetEntryOnTop } from '../../../components/sheet/sheetHistory';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import {
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileSwitch,
  MobileNotice,
  MobileEmptyState,
  BigButton,
  kitStyle
} from '../../../components/mobile';
import style from '../mobileSettings.css';

const STARTED_STATUS = [SERVICE_STATUS.RUNNING];
// a service that is not loaded cannot be started or stopped from here (same rule as the table)
const HIDDEN_ACTION_STATUS = [SERVICE_STATUS.UNKNOWN, SERVICE_STATUS.DISABLED];

const STATUS_TONES = {
  [SERVICE_STATUS.RUNNING]: 'success',
  [SERVICE_STATUS.ERROR]: 'danger',
  [SERVICE_STATUS.STOPPED]: 'warning'
};

const FILTERS = [
  { key: 'all', matches: () => true },
  { key: 'running', matches: service => service.status === SERVICE_STATUS.RUNNING },
  { key: 'error', matches: service => service.status === SERVICE_STATUS.ERROR },
  {
    key: 'stopped',
    matches: service => service.status !== SERVICE_STATUS.RUNNING && service.status !== SERVICE_STATUS.ERROR
  }
];

const normalize = text =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const findIntegration = service =>
  integrations.find(
    integration => get(integration, 'link', { default: integration.key }).toLowerCase() === service.selector
  );

/**
 * @description The services on a phone (docs/specs/mobile-pages/settings-pages.md, C): a search,
 * the states as chips, one row per service with its state in words, and a sheet per service to
 * start or stop it. Same requests as the desktop table (`actionOnService`).
 */
class MobileServicesPage extends Component {
  state = {
    search: '',
    filter: 'all',
    // the selector of the service of the sheet; it stays while the sheet slides out
    openSelector: null,
    sheetOpen: false,
    changing: false,
    actionError: false
  };

  componentWillUnmount() {
    this.unmounted = true;
  }

  updateSearch = e => this.setState({ search: e.target.value });
  selectFilter = filter => () => this.setState({ filter });

  openService = service => () => this.setState({ openSelector: service.selector, sheetOpen: true, actionError: false });
  closeService = () => this.setState({ sheetOpen: false });

  getName = service => {
    const integration = findIntegration(service);
    return (integration && get(this.props.intl.dictionary, `integration.${integration.key}.title`)) || service.name;
  };

  changeState = service => async () => {
    if (this.state.changing) {
      return;
    }
    const action = STARTED_STATUS.includes(service.status) ? 'stop' : 'start';
    this.setState({ changing: true, actionError: false });
    try {
      await this.props.actionOnService(service.selector, action);
      if (!this.unmounted) {
        this.setState({ changing: false });
      }
    } catch (e) {
      console.error(e);
      if (!this.unmounted) {
        this.setState({ changing: false, actionError: true });
      }
    }
  };

  openIntegration = integration => () => {
    const link = `/dashboard/integration/${integration.type}/${(integration.link || integration.key).toLowerCase()}`;
    // the entry of the sheet is on top of the history: the navigation replaces it
    route(link, isSheetEntryOnTop());
  };

  renderStatusPill = service => (
    <MobilePill tone={STATUS_TONES[service.status]} data-cy="service-status">
      <Text id={`servicesSettings.status.${service.status}.title`}>{service.status}</Text>
    </MobilePill>
  );

  render(props, { search, filter, openSelector, sheetOpen, changing, actionError }) {
    const { intl } = props;
    const services = props.services || [];
    const query = normalize(search.trim());
    const activeFilter = FILTERS.find(candidate => candidate.key === filter) || FILTERS[0];
    const searched = services.filter(
      service =>
        query.length === 0 ||
        normalize(this.getName(service)).includes(query) ||
        normalize(service.selector).includes(query)
    );
    const visible = searched.filter(activeFilter.matches);
    const openService = services.find(service => service.selector === openSelector);
    const openIntegration = openService && findIntegration(openService);
    const canChange = openService && !HIDDEN_ACTION_STATUS.includes(openService.status);
    return (
      <SettingsLayout>
        <div class={style.page} data-cy="services-mobile">
          <label class={kitStyle.search}>
            <i class="fe fe-search" aria-hidden="true" />
            <Localizer>
              <input
                type="search"
                class={kitStyle.searchInput}
                value={search}
                onInput={this.updateSearch}
                placeholder={<Text id="servicesSettings.mobile.searchPlaceholder" />}
                aria-label={<Text id="servicesSettings.mobile.searchPlaceholder" />}
                autocomplete="off"
                autocapitalize="off"
                enterkeyhint="search"
                data-cy="services-search"
              />
            </Localizer>
          </label>
          <div class={cx(kitStyle.chips, style.chipsRow)}>
            {FILTERS.map(candidate => {
              const count = searched.filter(candidate.matches).length;
              // a state no service is in is not offered ("All" always is)
              if (candidate.key !== 'all' && count === 0 && candidate.key !== filter) {
                return null;
              }
              return (
                <button
                  key={candidate.key}
                  type="button"
                  class={cx(kitStyle.chip, { [kitStyle.chipSelected]: candidate.key === filter })}
                  aria-pressed={candidate.key === filter ? 'true' : 'false'}
                  onClick={this.selectFilter(candidate.key)}
                  data-cy={`services-filter-${candidate.key}`}
                >
                  <Text id={`servicesSettings.mobile.filters.${candidate.key}`} /> {count}
                </button>
              );
            })}
          </div>

          {!props.services && (
            <div class="dimmer active">
              <div class="loader" />
              <div class={`dimmer-content ${style.loading}`} />
            </div>
          )}
          {visible.length > 0 && (
            <MobileGroup>
              {visible.map(service => (
                <MobileRow
                  key={service.selector}
                  title={this.getName(service)}
                  subtitle={service.selector}
                  trailing={this.renderStatusPill(service)}
                  chevron
                  onClick={this.openService(service)}
                  dataCy="service-row"
                />
              ))}
            </MobileGroup>
          )}
          {props.services && visible.length === 0 && (
            <MobileEmptyState icon="search" text={<Text id="servicesSettings.mobile.noResult" />} />
          )}
        </div>

        <BottomSheet
          open={sheetOpen && Boolean(openService)}
          title={openService ? this.getName(openService) : ''}
          onClose={this.closeService}
          dataCy="service-sheet"
        >
          {openService && (
            <div>
              <MobileNotice
                tone={STATUS_TONES[openService.status]}
                icon={openService.status === SERVICE_STATUS.ERROR ? 'alert-triangle' : 'info'}
              >
                <Text id={`servicesSettings.status.${openService.status}.detail`}>{openService.status}</Text>
              </MobileNotice>
              {actionError && (
                <MobileNotice tone="danger" icon="alert-circle">
                  <Text id="servicesSettings.mobile.actionError" />
                </MobileNotice>
              )}
              <div class={style.block}>
                <MobileGroup>
                  {canChange && (
                    <MobileRow
                      title={<Text id="servicesSettings.mobile.started" />}
                      subtitle={
                        changing ? (
                          <Text
                            id={
                              STARTED_STATUS.includes(openService.status)
                                ? 'servicesSettings.mobile.stopping'
                                : 'servicesSettings.mobile.starting'
                            }
                          />
                        ) : (
                          <Text id="servicesSettings.mobile.startedHelp" />
                        )
                      }
                      trailing={
                        <MobileSwitch
                          checked={STARTED_STATUS.includes(openService.status)}
                          onChange={this.changeState(openService)}
                          disabled={changing}
                          label={get(intl.dictionary, 'servicesSettings.mobile.started')}
                          dataCy="service-switch"
                        />
                      }
                    />
                  )}
                  <MobileRow
                    title={<Text id="servicesSettings.mobile.internalName" />}
                    value={openService.selector}
                    chevron={false}
                  />
                  <MobileRow
                    title={<Text id="servicesSettings.status.title" />}
                    trailing={this.renderStatusPill(openService)}
                  />
                </MobileGroup>
              </div>
              {openIntegration && (
                <BigButton
                  icon="arrow-right-circle"
                  onClick={this.openIntegration(openIntegration)}
                  data-cy="service-open-integration"
                >
                  <Text id="servicesSettings.mobile.openIntegration" />
                </BigButton>
              )}
            </div>
          )}
        </BottomSheet>
      </SettingsLayout>
    );
  }
}

export default withIntlAsProp(MobileServicesPage);
