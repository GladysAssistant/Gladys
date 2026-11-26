import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { route } from 'preact-router';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../../../../components/sheet/BottomSheet';
import { isSheetEntryOnTop } from '../../../../../components/sheet/sheetHistory';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileRowButton,
  MobileNotice,
  MobileEmptyState,
  MobileToast,
  ConfirmSheet,
  kitStyle
} from '../../../../../components/mobile';
import style from '../mobile.css';

const CONTRACTS_PATH = '/dashboard/integration/device/energy-monitoring/contracts';

const STATUS_TONE = {
  active: 'success',
  scheduled: 'accent',
  expired: undefined,
  orphaned: 'danger'
};

const STATUS_ICON_TONE = {
  active: undefined,
  scheduled: undefined,
  expired: 'neutral',
  orphaned: 'danger'
};

// "2025-01-01" as the user reads a date ("Jan 1, 2025"), without moving it to another day
const formatDay = (day, language) => {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }
  return date.toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' });
};

// a navigation started while the entry of a sheet is on top of the history replaces it
const go = url => route(url, isSheetEntryOnTop());

/**
 * @description The contracts on a phone (docs/specs/mobile-pages/energy.md, C): one section per
 * meter, one row per contract opening it, its other actions behind "•••", and a floating "+".
 * A presentation only: the contracts and their deletion come from Contracts.jsx.
 */
class MobileContracts extends Component {
  state = {
    // the contract of the action sheet and of the confirmation: kept while they slide out
    contract: null,
    actionsOpen: false,
    confirmOpen: false,
    deleting: false,
    toastVisible: false,
    toastKey: 0
  };

  componentWillUnmount() {
    this.unmounted = true;
  }

  create = () => go(`${CONTRACTS_PATH}/create`);
  edit = contract => () => go(`${CONTRACTS_PATH}/edit/${encodeURIComponent(contract.selector)}`);

  openActions = contract => () => this.setState({ contract, actionsOpen: true });
  closeActions = () => this.setState({ actionsOpen: false });

  askDelete = () => this.setState({ actionsOpen: false, confirmOpen: true });
  closeConfirm = () => this.setState({ confirmOpen: false });

  confirmDelete = async () => {
    this.setState({ deleting: true });
    const deleted = await this.props.removeContract(this.state.contract);
    if (this.unmounted) {
      return;
    }
    this.setState(prevState => ({
      deleting: false,
      confirmOpen: false,
      toastVisible: deleted,
      toastKey: prevState.toastKey + 1
    }));
  };

  closeToast = () => this.setState({ toastVisible: false });

  renderContract = contract => {
    const { intl, user } = this.props;
    const language = (user && user.language) || 'en';
    const status = contract.status || 'active';
    return (
      <div class={style.card} key={contract.id} data-cy="energy-contract-row">
        <div class={style.splitRow}>
          <MobileRow
            icon="file-text"
            iconTone={STATUS_ICON_TONE[status]}
            title={contract.name}
            subtitle={
              <span>
                {formatDay(contract.valid_from, language)} →{' '}
                {contract.valid_to ? (
                  formatDay(contract.valid_to, language)
                ) : (
                  <Text id="integration.energyMonitoring.contracts.ongoing" />
                )}
              </span>
            }
            onClick={this.edit(contract)}
            chevron={false}
            dataCy="energy-contract-open"
          >
            <span class={style.pillLine}>
              <MobilePill tone={STATUS_TONE[status]} data-cy="energy-contract-status">
                <Text id={`integration.energyMonitoring.contracts.status.${status}`} />
              </MobilePill>
              <span class={kitStyle.rowMeta}>
                {contract.currency}
                {' · '}
                <Text id={`integration.energyMonitoring.contracts.provider.${contract.provider_kind}`} />
                {contract.provider_service ? ` (${contract.provider_service.name})` : ''}
              </span>
            </span>
          </MobileRow>
          <MobileRowButton
            icon="more-horizontal"
            label={`${get(intl.dictionary, 'mobileKit.more')} — ${contract.name}`}
            onClick={this.openActions(contract)}
            data-cy="energy-contract-actions"
          />
        </div>
        {status === 'orphaned' && (
          <div class={style.cardNotice}>
            <MobileNotice tone="warning" icon="alert-triangle">
              <Text id="integration.energyMonitoring.contracts.orphanedHelp" />
            </MobileNotice>
          </div>
        )}
        {contract.migration_warning && (
          <div class={style.cardNotice}>
            <MobileNotice icon="info">
              <Text
                id="integration.energyMonitoring.contracts.migrationWarning"
                fields={{ gap: Math.round(contract.migration_warning.gap_ratio * 1000) / 10 }}
              />
            </MobileNotice>
          </div>
        )}
      </div>
    );
  };

  render(
    { contractsByMeter, contracts, loading, error, getMeterName, intl },
    { contract, actionsOpen, confirmOpen, deleting, toastVisible, toastKey }
  ) {
    return (
      <div class={style.list} data-cy="energy-contracts-mobile">
        <p class={kitStyle.lead}>
          <Text id="integration.energyMonitoring.contracts.description" />
        </p>
        {error && (
          <MobileNotice tone="danger" icon="alert-circle">
            <Text id="integration.energyMonitoring.contracts.errorLoading" /> {error}
          </MobileNotice>
        )}
        <div class={cx('dimmer', { active: loading })}>
          <div class="loader" />
          <div class={cx('dimmer-content', { [style.loading]: loading && contracts.length === 0 })}>
            {contracts.length === 0 && !loading && (
              <div data-cy="energy-contract-empty">
                <MobileEmptyState icon="file-text" text={<Text id="integration.energyMonitoring.contracts.empty" />} />
              </div>
            )}
            {contractsByMeter.map(([meterId, meterContracts]) => (
              <div key={meterId} data-cy="energy-contract-meter">
                <MobileSectionHeader
                  title={
                    <span>
                      <i class="fe fe-zap mr-1" aria-hidden="true" />
                      {getMeterName(meterId)}
                    </span>
                  }
                />
                <div class={kitStyle.stack}>{meterContracts.map(this.renderContract)}</div>
              </div>
            ))}
          </div>
        </div>

        <Localizer>
          <button
            type="button"
            class={kitStyle.fab}
            onClick={this.create}
            aria-label={<Text id="integration.energyMonitoring.contracts.createTitle" />}
            data-cy="energy-contract-create"
          >
            <i class="fe fe-plus" aria-hidden="true" />
          </button>
        </Localizer>

        <BottomSheet
          open={actionsOpen}
          title={contract ? contract.name : ''}
          onClose={this.closeActions}
          dataCy="energy-contract-actions-sheet"
        >
          {contract && (
            <MobileGroup>
              <MobileRow
                icon="edit-2"
                title={<Text id="integration.energyMonitoring.contracts.editTitle" />}
                onClick={this.edit(contract)}
                dataCy="energy-contract-edit"
              />
              <MobileRow
                icon="trash-2"
                iconTone="danger"
                tone="danger"
                title={<Text id="integration.energyMonitoring.deleteContract" />}
                onClick={this.askDelete}
                chevron={false}
                dataCy="energy-contract-delete"
              />
            </MobileGroup>
          )}
        </BottomSheet>

        <ConfirmSheet
          open={confirmOpen}
          title={get(intl.dictionary, 'integration.energyMonitoring.mobile.deleteTitle')}
          text={
            <span>
              {contract && <strong>{contract.name}</strong>}
              {contract && ' — '}
              <Text id="integration.energyMonitoring.contracts.confirmDelete" />
            </span>
          }
          confirmLabel={<Text id="integration.energyMonitoring.deleteContract" />}
          destructive
          loading={deleting}
          onConfirm={this.confirmDelete}
          onCancel={this.closeConfirm}
          dataCy="energy-contract-delete-confirm"
        />

        <MobileToast
          message={toastVisible ? get(intl.dictionary, 'integration.energyMonitoring.mobile.contractDeleted') : null}
          toastKey={toastKey}
          onClose={this.closeToast}
          // above the floating "+"
          aboveBar
          dataCy="energy-contract-deleted-toast"
        />
      </div>
    );
  }
}

export default MobileContracts;
