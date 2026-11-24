import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

export const CONTRACTS_PAGE = '/dashboard/integration/device/energy-monitoring/contracts';

// The price of a tier changes a few times a day at most: 5 minutes is fast
// enough to follow it, and the box also reschedules itself on the exact
// switch time the server announces (valid_until).
const BOX_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const DEFAULT_UNIT = 'kWh';

// "0.1609 €/kWh": the currency symbol of the browser locale, 4 fraction
// digits (electricity prices are quoted to the tenth of a cent). An unknown
// currency code (Intl throws a RangeError) falls back to the plain code.
const formatPrice = (price, currency, unit, language) => {
  const suffix = `/${unit || DEFAULT_UNIT}`;
  try {
    const formatted = new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
    return `${formatted}${suffix}`;
  } catch (e) {
    return `${price} ${currency || ''}${suffix}`;
  }
};

// "Until 00:00" on a Thursday for a change on Saturday would mislead: a switch on
// another day carries its weekday and date
const formatTime = (isoDate, language) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const sameDay = date.toDateString() === new Date().toDateString();
  const options = sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  try {
    return new Intl.DateTimeFormat(language, options).format(date);
  } catch (e) {
    return sameDay ? date.toLocaleTimeString() : date.toLocaleString();
  }
};

const formatKwh = (value, language) => {
  try {
    return new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value);
  } catch (e) {
    return String(value);
  }
};

// The box targets a meter, the main meter when it names none, and shows the
// price of the contract active on it (docs/specs/energy-contracts.md 8.2). A box
// saved before the meter targeting names a contract instead: the server reads it
// as the meter of that contract.
const getCurrentPrice = (httpClient, { electric_meter: electricMeter, energy_contract: energyContract }) => {
  if (!electricMeter && energyContract) {
    return httpClient.get(`/api/v1/energy_contract/${encodeURIComponent(energyContract)}/current`);
  }
  return httpClient.get(
    '/api/v1/energy_contract/current',
    electricMeter ? { electric_meter: electricMeter } : undefined
  );
};

const EnergyPriceBox = ({ title, loading, error, current, language }) => {
  // the meter has no contract covering "now" (or there is no meter at all):
  // say so, never show the price of an expired contract
  const noActiveContract = current && current.contract === null;
  const meterName = current && current.electric_meter ? current.electric_meter.name : null;
  const hasPrice = current && current.price !== null && current.price !== undefined;
  const validUntil = current && current.valid_until ? formatTime(current.valid_until, language) : null;
  const hasNextPrice = current && current.next_price !== null && current.next_price !== undefined;
  const cumulativeDay =
    current && current.cumulative && typeof current.cumulative.day === 'number' ? current.cumulative.day : null;
  return (
    <div class="card">
      <div class="card-body">
        <div class={cx('dimmer', { active: loading })}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class={style.header}>
              <span class={style.title}>
                <i class="fe fe-dollar-sign" />
                <span>{title}</span>
              </span>
              {current && current.label && <span class={style.tierBadge}>{current.label}</span>}
            </div>
            {error && (
              <div class={style.errorState}>
                <i class="fe fe-bell" />
                <span>
                  <Text id="dashboard.boxes.energyPrice.error" />
                </span>
              </div>
            )}
            {!error && noActiveContract && (
              <div>
                <div class={style.unknownPrice}>
                  {meterName ? (
                    <Text id="dashboard.boxes.energyPrice.noActiveContract" fields={{ meter: meterName }} />
                  ) : (
                    <Text id="dashboard.boxes.energyPrice.noContract" />
                  )}
                </div>
                <div class={style.muted}>
                  <Link href={CONTRACTS_PAGE}>
                    <Text id="dashboard.boxes.energyPrice.manageContractsLink" />
                  </Link>
                </div>
              </div>
            )}
            {!error && current && !noActiveContract && (
              <div>
                {hasPrice ? (
                  <div class={style.price}>{formatPrice(current.price, current.currency, current.unit, language)}</div>
                ) : (
                  <div class={style.unknownPrice}>
                    <Text id="dashboard.boxes.energyPrice.unknownPrice" />
                  </div>
                )}
                {validUntil && (
                  <div class={style.muted}>
                    <Text id="dashboard.boxes.energyPrice.until" fields={{ time: validUntil }} />
                    {hasNextPrice && (
                      <span>
                        {' '}
                        <i class="fe fe-arrow-right" />{' '}
                        {formatPrice(current.next_price, current.currency, current.unit, language)}
                        {current.next_label && ` (${current.next_label})`}
                      </span>
                    )}
                  </div>
                )}
                {cumulativeDay !== null && (
                  <div class={style.muted}>
                    <Text
                      id="dashboard.boxes.energyPrice.cumulativeToday"
                      fields={{ kwh: formatKwh(cumulativeDay, language) }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

class EnergyPrice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: false,
      current: null
    };
  }

  refreshData = async () => {
    clearTimeout(this.switchTimeout);
    try {
      this.setState({ error: false, loading: true });
      const current = await getCurrentPrice(this.props.httpClient, this.props.box);
      this.setState({ error: false, loading: false, current });
      this.scheduleRefreshAtSwitch(current);
    } catch (e) {
      this.setState({ error: true, loading: false });
    }
  };

  // The tier switches at a known instant: refresh right after it rather than
  // showing a stale price for up to five minutes
  scheduleRefreshAtSwitch = current => {
    if (!current || !current.valid_until) {
      return;
    }
    const delay = new Date(current.valid_until).getTime() - Date.now() + 1000;
    if (Number.isNaN(delay) || delay <= 0 || delay >= BOX_REFRESH_INTERVAL_MS) {
      return;
    }
    this.switchTimeout = setTimeout(() => this.refreshData(), delay);
  };

  componentDidMount() {
    this.refreshData();
    this.interval = setInterval(() => this.refreshData(), BOX_REFRESH_INTERVAL_MS);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.box.electric_meter !== this.props.box.electric_meter ||
      prevProps.box.energy_contract !== this.props.box.energy_contract
    ) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearTimeout(this.switchTimeout);
  }

  render({ box, user }, { loading, error, current }) {
    const language = user && user.language ? user.language : undefined;
    // the box name, else the contract that priced it, else its meter
    const title = box.name ||
      (current && current.contract && current.contract.name) ||
      (current && current.electric_meter && current.electric_meter.name) || (
        <Text id="dashboard.boxTitle.energy-price" />
      );
    return <EnergyPriceBox title={title} loading={loading} error={error} current={current} language={language} />;
  }
}

export default connect('httpClient,user', {})(EnergyPrice);
