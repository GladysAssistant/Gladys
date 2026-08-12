import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import {
  formatResetDuration,
  getQuotaProgressBarClass,
  getQuotaUsedPercent
} from '../../../../../../server/utils/openAIQuota';

const QUOTA_REFRESH_INTERVAL_MS = 60 * 1000;

class QuotaItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      resetInSeconds: props.quota.reset_in_seconds || 0
    };
  }

  componentDidMount() {
    this.startCountdown();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.quota.reset_in_seconds !== this.props.quota.reset_in_seconds) {
      this.setState({ resetInSeconds: nextProps.quota.reset_in_seconds || 0 });
    }
  }

  componentWillUnmount() {
    this.stopCountdown();
  }

  startCountdown = () => {
    this.stopCountdown();
    this.countdownInterval = setInterval(() => {
      this.setState(prevState => ({
        resetInSeconds: prevState.resetInSeconds > 0 ? prevState.resetInSeconds - 1 : 0
      }));
    }, 1000);
  };

  stopCountdown = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  };

  render({ labelId, quota, language }, { resetInSeconds }) {
    const usedPercent = getQuotaUsedPercent(quota);
    const progressBarClass = getQuotaProgressBarClass(quota);
    const resetDuration = formatResetDuration(resetInSeconds, language);

    return (
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong>
            <Text id={labelId} />
          </strong>
          <span class="text-muted small">
            <Text
              id="integration.openai.quota.remaining"
              fields={{
                remaining: quota.remaining,
                max: quota.max
              }}
            />
          </span>
        </div>
        <div class="progress mb-2">
          <div
            class={`progress-bar ${progressBarClass}`}
            style={{
              width: `${usedPercent}%`
            }}
            role="progressbar"
            aria-valuenow={usedPercent}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={usedPercent}
          >
            <span class="visually-hidden">{usedPercent}%</span>
          </div>
        </div>
        {resetInSeconds > 0 ? (
          <p class="text-muted small mb-0">
            <Text id="integration.openai.quota.resetIn" fields={{ duration: resetDuration }} />
          </p>
        ) : (
          <p class="text-muted small mb-0">
            <Text id="integration.openai.quota.resetNow" />
          </p>
        )}
      </div>
    );
  }
}

class AiQuotaDisplay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quota: null,
      loading: true,
      loadError: false
    };
  }

  loadQuota = async () => {
    this.setState({ loading: true, loadError: false });
    try {
      const quota = await this.props.httpClient.get('/api/v1/gateway/aichat/quota');
      this.setState({
        quota,
        loading: false,
        loadError: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        quota: null,
        loading: false,
        loadError: true
      });
    }
  };

  componentDidMount() {
    this.loadQuota();
    this.refreshInterval = setInterval(this.loadQuota, QUOTA_REFRESH_INTERVAL_MS);
  }

  componentWillUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  render({ user }, { quota, loading, loadError }) {
    const language = user && user.language ? user.language : 'en';

    return (
      <div class="card mt-4">
        <div class="card-header">
          <h4 class="card-title mb-0">
            <Text id="integration.openai.quota.title" />
          </h4>
        </div>
        <div class="card-body">
          {loading && !quota && (
            <p class="text-muted mb-0">
              <Text id="integration.openai.quota.loading" />
            </p>
          )}
          {loadError && (
            <div class="alert alert-danger mb-0" role="alert">
              <Text id="integration.openai.quota.loadError" />
              <button type="button" class="btn btn-sm btn-outline-danger ml-3" onClick={this.loadQuota}>
                <Text id="integration.openai.quota.retry" />
              </button>
            </div>
          )}
          {quota && (
            <div>
              <QuotaItem labelId="integration.openai.quota.textLabel" quota={quota.text} language={language} />
              <QuotaItem labelId="integration.openai.quota.imageLabel" quota={quota.image} language={language} />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', null)(AiQuotaDisplay);
