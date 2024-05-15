import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

const isNullOrUndefined = variable => variable === null || variable === undefined;

class EdfTempoCondition extends Component {
  handleDayChange = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'edf_tempo_day', e.target.value);
  };

  handlePeakDayTypeChange = e => {
    this.props.updateActionProperty(
      this.props.columnIndex,
      this.props.index,
      'edf_tempo_peak_day_type',
      e.target.value
    );
  };

  handlePeakHourTypeChange = e => {
    this.props.updateActionProperty(
      this.props.columnIndex,
      this.props.index,
      'edf_tempo_peak_hour_type',
      e.target.value
    );
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.edf_tempo_day'))) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'edf_tempo_day', 'today');
    }
    if (isNullOrUndefined(get(this.props, 'action.edf_tempo_peak_day_type'))) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'edf_tempo_peak_day_type', 'blue');
    }
    if (isNullOrUndefined(get(this.props, 'action.edf_tempo_peak_hour_type'))) {
      this.props.updateActionProperty(
        this.props.columnIndex,
        this.props.index,
        'edf_tempo_peak_hour_type',
        'peak-hour'
      );
    }
  };

  componentDidMount() {
    this.initActionIfNeeded();
  }

  render({ action }, {}) {
    return (
      <div>
        <div class="row">
          <div class="col-md-12">
            <p>
              <Text id="editScene.actionsCard.edfTempoCondition.description" />{' '}
              <small>
                <a
                  href="https://particulier.edf.fr/fr/accueil/gestion-contrat/options/tempo.html#/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Text id="editScene.actionsCard.edfTempoCondition.knowMore" />
                </a>
              </small>
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.edfTempoCondition.selectDay" />
              </div>
              <select class="form-control" onChange={this.handleDayChange} value={action.edf_tempo_day}>
                <option value="today">
                  <Text id="editScene.actionsCard.edfTempoCondition.today" />
                </option>
                <option value="tomorrow">
                  <Text id="editScene.actionsCard.edfTempoCondition.tomorrow" />
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.edfTempoCondition.selectPeakDayType" />
              </div>
              <select
                class="form-control"
                onChange={this.handlePeakDayTypeChange}
                value={action.edf_tempo_peak_day_type}
              >
                <option value="blue">
                  <Text id="editScene.actionsCard.edfTempoCondition.blueDay" />
                </option>
                <option value="white">
                  <Text id="editScene.actionsCard.edfTempoCondition.whiteDay" />
                </option>
                <option value="red">
                  <Text id="editScene.actionsCard.edfTempoCondition.redDay" />
                </option>
                <option value="no-check">
                  <Text id="editScene.actionsCard.edfTempoCondition.noPeakDayCheck" />
                </option>
              </select>
            </div>
          </div>
        </div>
        {action.edf_tempo_day === 'today' && (
          <div class="row">
            <div class="col">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.actionsCard.edfTempoCondition.selectPeakHourType" />
                </div>
                <select
                  class="form-control"
                  onChange={this.handlePeakHourTypeChange}
                  value={action.edf_tempo_peak_hour_type}
                >
                  <option value="peak-hour">
                    <Text id="editScene.actionsCard.edfTempoCondition.peakHour" />
                  </option>
                  <option value="off-peak-hour">
                    <Text id="editScene.actionsCard.edfTempoCondition.offPeakHour" />
                  </option>
                  <option value="no-check">
                    <Text id="editScene.actionsCard.edfTempoCondition.noPeakHourCheck" />
                  </option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect('user,httpClient', {})(EdfTempoCondition);
