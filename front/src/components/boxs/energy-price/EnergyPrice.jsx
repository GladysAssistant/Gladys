import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import style from './style.css';

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

const formatTime = (isoDate, language) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(date);
  } catch (e) {
    return date.toLocaleTimeString();
  }
};

const formatKwh = (value, language) => {
  try {
    return new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(value);
  } catch (e) {
    return String(value);
  }
};

const EnergyPriceBox = ({ title, loading, error, notConfigured, current, language }) => {
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
            {notConfigured && (
              <div class={style.muted}>
                <Text id="dashboard.boxes.energyPrice.notConfigured" />
              </div>
            )}
            {!notConfigured && error && (
              <div class={style.errorState}>
                <i class="fe fe-bell" />
                <span>
                  <Text id="dashboard.boxes.energyPrice.error" />
                </span>
              </div>
            )}
            {!notConfigured && !error && current && (
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
    const { energy_contract: energyContract } = this.props.box;
    clearTimeout(this.switchTimeout);
    if (!energyContract) {
      this.setState({ loading: false, error: false, current: null });
      return;
    }
    try {
      this.setState({ error: false, loading: true });
      const current = await this.props.httpClient.get(
        `/api/v1/energy_contract/${encodeURIComponent(energyContract)}/current`
      );
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
    if (prevProps.box.energy_contract !== this.props.box.energy_contract) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    clearTimeout(this.switchTimeout);
  }

  render({ box, user }, { loading, error, current }) {
    const language = user && user.language ? user.language : undefined;
    const title = box.name || (current && current.contract && current.contract.name) || box.energy_contract || '';
    return (
      <EnergyPriceBox
        title={title}
        loading={loading}
        error={error}
        notConfigured={!box.energy_contract}
        current={current}
        language={language}
      />
    );
  }
}

export default connect('httpClient,user', {})(EnergyPrice);
