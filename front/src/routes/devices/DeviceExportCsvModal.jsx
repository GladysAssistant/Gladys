import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import dayjs from 'dayjs';

import { formatHttpError } from '../../utils/formatErrors';
import downloadDeviceFeaturesCsv from '../../utils/downloadDeviceFeaturesCsv';
import { getExportableFeatures } from './helpers';
import style from './style.css';

const DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_PERIOD_IN_DAYS = 30;

class DeviceExportCsvModal extends Component {
  constructor(props) {
    super(props);
    const exportableFeatures = getExportableFeatures(props.device);
    this.state = {
      // Everything is selected by default: exporting the whole device is the
      // common case, unselecting a feature is the exception.
      selectedFeatures: exportableFeatures.map(feature => feature.selector),
      start: dayjs()
        .subtract(DEFAULT_PERIOD_IN_DAYS, 'day')
        .format(DATE_FORMAT),
      end: dayjs().format(DATE_FORMAT),
      exporting: false,
      error: false,
      errorDetail: null
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = e => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  handleOverlayClick = e => {
    if (e.target === e.currentTarget) {
      this.close();
    }
  };

  close = () => {
    // Covers all close paths (X, Escape, overlay, Cancel): while the export is
    // in flight, dismissing the modal would leave the download running blind.
    if (this.state.exporting) {
      return;
    }
    this.props.onClose();
  };

  toggleFeature = e => {
    const selector = e.currentTarget.getAttribute('data-selector');
    this.setState(prevState => ({
      selectedFeatures: prevState.selectedFeatures.includes(selector)
        ? prevState.selectedFeatures.filter(featureSelector => featureSelector !== selector)
        : [...prevState.selectedFeatures, selector]
    }));
  };

  updateStart = e => {
    this.setState({ start: e.target.value });
  };

  updateEnd = e => {
    this.setState({ end: e.target.value });
  };

  // Clearing an <input type="date"> gives an empty string, which dayjs turns
  // into an invalid date: it must block the export like an inverted period
  // does, otherwise toISOString() throws when building the request.
  isPeriodInvalid = () => {
    const startDate = dayjs(this.state.start);
    const endDate = dayjs(this.state.end);
    return !startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate, 'day');
  };

  exportCsv = async () => {
    const { selectedFeatures, start, end } = this.state;
    if (selectedFeatures.length === 0 || this.isPeriodInvalid()) {
      return;
    }
    await this.setState({ exporting: true, error: false, errorDetail: null });
    try {
      // The end date is inclusive: a user picking today expects today's states.
      await downloadDeviceFeaturesCsv(this.props.httpClient, {
        deviceFeatures: selectedFeatures,
        startAt: dayjs(start).startOf('day'),
        endAt: dayjs(end).endOf('day'),
        filename: this.props.device.name
      });
      this.setState({ exporting: false });
      this.props.onClose();
    } catch (e) {
      console.error(e);
      const { errorDetailString } = formatHttpError(e);
      this.setState({ exporting: false, error: true, errorDetail: errorDetailString });
    }
  };

  render({ device }, { selectedFeatures, start, end, exporting, error, errorDetail }) {
    const exportableFeatures = getExportableFeatures(device);
    const invalidPeriod = this.isPeriodInvalid();
    const canExport = selectedFeatures.length > 0 && !invalidPeriod && !exporting;
    return (
      <div class={style.modalOverlay} onClick={this.handleOverlayClick}>
        <div class={style.modalDialog}>
          <div class="card mb-0">
            <div class="card-header">
              <h3 class="card-title">
                <Text id="devicesList.export.modalTitle" fields={{ name: device.name }} />
              </h3>
              <div class="card-options">
                <button type="button" class="btn btn-secondary btn-sm" onClick={this.close}>
                  <i class="fe fe-x" />
                </button>
              </div>
            </div>
            <div
              class={cx('dimmer', {
                active: exporting
              })}
            >
              <div class="loader" />
              <div class="dimmer-content">
                <div class="card-body">
                  <p class="text-muted">
                    <Text id="devicesList.export.description" />
                  </p>
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="devicesList.export.featuresLabel" />
                    </label>
                    {exportableFeatures.map(feature => (
                      <label key={feature.selector} class="custom-control custom-checkbox">
                        <input
                          type="checkbox"
                          class="custom-control-input"
                          checked={selectedFeatures.includes(feature.selector)}
                          data-selector={feature.selector}
                          onChange={this.toggleFeature}
                        />
                        <span class="custom-control-label">
                          {feature.name}
                          {feature.unit && (
                            <span class="text-muted ml-1">
                              (<Text id={`deviceFeatureUnitShort.${feature.unit}`} />)
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div class="row">
                    <div class="col-6">
                      <div class="form-group">
                        <label class="form-label">
                          <Text id="devicesList.export.startLabel" />
                        </label>
                        <input type="date" class="form-control" value={start} onChange={this.updateStart} />
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="form-group">
                        <label class="form-label">
                          <Text id="devicesList.export.endLabel" />
                        </label>
                        <input type="date" class="form-control" value={end} onChange={this.updateEnd} />
                      </div>
                    </div>
                  </div>
                  {invalidPeriod && (
                    <div class="alert alert-warning">
                      <Text id="devicesList.export.invalidPeriod" />
                    </div>
                  )}
                  {selectedFeatures.length === 0 && (
                    <div class="alert alert-warning">
                      <Text id="devicesList.export.noFeatureSelected" />
                    </div>
                  )}
                  {error && (
                    <div class="alert alert-danger">
                      <Text id="devicesList.export.error" />
                      {errorDetail && <div class="small">{errorDetail}</div>}
                    </div>
                  )}
                  <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-secondary mr-2" onClick={this.close} disabled={exporting}>
                      <Text id="devicesList.export.cancelButton" />
                    </button>
                    <button type="button" class="btn btn-primary" onClick={this.exportCsv} disabled={!canExport}>
                      <i class="fe fe-download mr-1" />
                      <Text id="devicesList.export.exportButton" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(DeviceExportCsvModal);
