import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import dayjs from 'dayjs';

import { formatHttpError } from '../../utils/formatErrors';
import downloadDeviceFeaturesCsv from '../../utils/downloadDeviceFeaturesCsv';
import { getExportableFeatures } from './helpers';
import style from './style.css';

const DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_PERIOD_IN_DAYS = 30;

/**
 * The CSV export dialog: a bottom sheet on a phone, a centered dialog on a tablet or a desktop,
 * like the light control panel of the dashboard.
 */
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
      exportedStates: 0,
      error: false,
      errorDetail: null
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    // The sheet covers the screen on a phone: scrolling inside it must not scroll the devices
    // list underneath.
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (this.sheetRef) {
      this.sheetRef.focus();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = this.previousBodyOverflow;
  }

  setSheetRef = element => {
    this.sheetRef = element;
  };

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
    // Covers all close paths (X, Escape, overlay, Cancel). While an export is
    // running, closing cancels it: the download loop checks this flag before
    // requesting the next chunk and stops without saving a partial file.
    if (this.state.exporting) {
      this.exportCanceled = true;
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
    this.exportCanceled = false;
    await this.setState({ exporting: true, exportedStates: 0, error: false, errorDetail: null });
    try {
      // The end date is inclusive: a user picking today expects today's states.
      const { aborted } = await downloadDeviceFeaturesCsv(this.props.httpClient, {
        deviceFeatures: selectedFeatures,
        startAt: dayjs(start).startOf('day'),
        endAt: dayjs(end).endOf('day'),
        filename: this.props.device.name,
        // The file is downloaded chunk by chunk: a long export shows how far it is.
        onProgress: exportedStates => this.setState({ exportedStates }),
        shouldAbort: () => this.exportCanceled
      });
      if (aborted) {
        // The dialog is already closed: it closed itself when the user canceled.
        return;
      }
      this.setState({ exporting: false });
      this.props.onClose();
    } catch (e) {
      if (this.exportCanceled) {
        return;
      }
      console.error(e);
      const { errorDetailString } = formatHttpError(e);
      this.setState({ exporting: false, error: true, errorDetail: errorDetailString });
    }
  };

  render({ device }, { selectedFeatures, start, end, exporting, exportedStates, error, errorDetail }) {
    const exportableFeatures = getExportableFeatures(device);
    const invalidPeriod = this.isPeriodInvalid();
    const noFeatureSelected = selectedFeatures.length === 0;
    const canExport = !noFeatureSelected && !invalidPeriod && !exporting;
    // One notice at a time: what blocks the export comes first, the failure of the last attempt
    // is only worth reading once the form can be submitted again.
    const blockingNotice = invalidPeriod || noFeatureSelected;
    const showError = error && !blockingNotice;
    // The dialog is rendered on <body>: the page and its cards carry backdrop filters, which
    // would turn a fixed overlay nested inside them into a box clipped to the card.
    return createPortal(
      <div class={cx('glass-theme', style.exportOverlay)} onClick={this.handleOverlayClick}>
        <Localizer>
          <div
            class={style.exportSheet}
            role="dialog"
            aria-modal="true"
            aria-label={<Text id="devicesList.export.modalTitle" fields={{ name: device.name }} />}
            tabIndex="-1"
            ref={this.setSheetRef}
          >
            <div class={style.exportSheetHandle} />
            <div class={style.exportHeader}>
              <div class={style.exportHeaderTitles}>
                <span class={style.exportTitle}>{device.name}</span>
                <span class={style.exportSubtitle}>
                  <Text id="devicesList.export.description" />
                </span>
              </div>
              <Localizer>
                <button
                  type="button"
                  class={style.exportCloseButton}
                  onClick={this.close}
                  aria-label={<Text id="devicesList.export.closeButton" />}
                >
                  <i class="fe fe-x" />
                </button>
              </Localizer>
            </div>

            <div class={style.exportSection}>
              <span class={style.exportSectionLabel}>
                <Text id="devicesList.export.featuresLabel" />
              </span>
              <div class={style.exportFeatureList}>
                {exportableFeatures.map(feature => {
                  const selected = selectedFeatures.includes(feature.selector);
                  return (
                    <button
                      key={feature.selector}
                      type="button"
                      class={cx(style.exportFeature, { [style.exportFeatureSelected]: selected })}
                      data-selector={feature.selector}
                      aria-pressed={selected}
                      onClick={this.toggleFeature}
                    >
                      <span class={style.exportFeatureCheck}>
                        <i class="fe fe-check" />
                      </span>
                      <span class={style.exportFeatureName}>
                        {feature.name}
                        {feature.unit && (
                          <span class={style.exportFeatureUnit}>
                            <Text id={`deviceFeatureUnitShort.${feature.unit}`} />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div class={style.exportSection}>
              <span class={style.exportSectionLabel}>
                <Text id="devicesList.export.periodLabel" />
              </span>
              <div class={style.exportDates}>
                <label class={style.exportDateField} htmlFor="device-export-csv-start">
                  <span class={style.exportDateLabel}>
                    <Text id="devicesList.export.startLabel" />
                  </span>
                  <input
                    type="date"
                    id="device-export-csv-start"
                    class={style.exportDateInput}
                    value={start}
                    onChange={this.updateStart}
                  />
                </label>
                <label class={style.exportDateField} htmlFor="device-export-csv-end">
                  <span class={style.exportDateLabel}>
                    <Text id="devicesList.export.endLabel" />
                  </span>
                  <input
                    type="date"
                    id="device-export-csv-end"
                    class={style.exportDateInput}
                    value={end}
                    onChange={this.updateEnd}
                  />
                </label>
              </div>
            </div>

            {(blockingNotice || showError) && (
              <div class={cx(style.exportNotice, { [style.exportNoticeError]: showError })}>
                <i class={cx('fe', showError ? 'fe-alert-triangle' : 'fe-info', style.exportNoticeIcon)} />
                <span>
                  {invalidPeriod && <Text id="devicesList.export.invalidPeriod" />}
                  {!invalidPeriod && noFeatureSelected && <Text id="devicesList.export.noFeatureSelected" />}
                  {showError && (
                    <span>
                      <Text id="devicesList.export.error" />
                      {errorDetail && <span class={style.exportNoticeDetail}>{errorDetail}</span>}
                    </span>
                  )}
                </span>
              </div>
            )}

            {exporting && exportedStates > 0 && (
              <div class={style.exportProgress}>
                <Text
                  id="devicesList.export.progress"
                  fields={{ count: exportedStates.toLocaleString(this.props.user && this.props.user.language) }}
                />
              </div>
            )}

            <div class={style.exportActions}>
              {/* Cancel stays enabled while exporting: it is how a long export is stopped */}
              <button type="button" class={style.exportCancelButton} onClick={this.close}>
                <Text id="devicesList.export.cancelButton" />
              </button>
              <button type="button" class={style.exportSubmitButton} onClick={this.exportCsv} disabled={!canExport}>
                <i
                  class={cx('fe', {
                    'fe-download': !exporting,
                    'fe-loader': exporting,
                    [style.exportSpinning]: exporting
                  })}
                />
                <Text id="devicesList.export.exportButton" />
              </button>
            </div>
          </div>
        </Localizer>
      </div>,
      document.body
    );
  }
}

export default connect('httpClient,user', {})(DeviceExportCsvModal);
