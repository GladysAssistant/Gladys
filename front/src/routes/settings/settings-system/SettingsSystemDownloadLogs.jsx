import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';

// Per-request chunk size (bytes). Stays well below Gladys Plus per-request size limit.
const CHUNK_SIZE = 256 * 1024;

const base64ToUint8Array = base64 => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const formatBytes = bytes => {
  if (!bytes) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

class SettingsSystemDownloadLogs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      downloading: false,
      progress: 0,
      totalSize: 0,
      bytesDownloaded: 0,
      error: null
    };
  }

  downloadLogs = async e => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    this.setState({
      downloading: true,
      progress: 0,
      totalSize: 0,
      bytesDownloaded: 0,
      error: null
    });
    try {
      const chunks = [];
      let offset = 0;
      let totalSize = 0;
      let refresh = true;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const response = await this.props.httpClient.get(
          `/api/v1/system/logs?offset=${offset}&limit=${CHUNK_SIZE}&refresh=${refresh}`
        );
        refresh = false;
        totalSize = response.size;
        if (response.length === 0) {
          break;
        }
        chunks.push(base64ToUint8Array(response.content_base64));
        offset += response.length;
        const progress = totalSize > 0 ? Math.min(100, Math.round((offset / totalSize) * 100)) : 100;
        this.setState({
          progress,
          totalSize,
          bytesDownloaded: offset
        });
        if (offset >= totalSize) {
          break;
        }
      }
      // Concatenate all chunks
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(totalLength);
      let position = 0;
      chunks.forEach(c => {
        merged.set(c, position);
        position += c.length;
      });
      const blob = new Blob([merged], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const fileName = `gladys-logs-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(
        now.getHours()
      )}${pad(now.getMinutes())}${pad(now.getSeconds())}.log`;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.setState({
        downloading: false,
        progress: 100
      });
    } catch (err) {
      console.error(err);
      this.setState({
        downloading: false,
        error: true
      });
    }
  };

  render({}, { downloading, progress, totalSize, bytesDownloaded, error }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.downloadLogsTitle" />
        </h4>
        <div class="card-body">
          <p>
            <Text id="systemSettings.downloadLogsDescription" />
          </p>
          {error && (
            <div class="alert alert-danger">
              <Text id="systemSettings.downloadLogsError" />
            </div>
          )}
          {downloading && (
            <div class="mb-3">
              <div class="progress mb-2">
                <div
                  class="progress-bar"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {progress}%
                </div>
              </div>
              <small class="text-muted">
                <Text
                  id="systemSettings.downloadLogsProgress"
                  fields={{ downloaded: formatBytes(bytesDownloaded), total: formatBytes(totalSize) }}
                />
              </small>
            </div>
          )}
          <button onClick={this.downloadLogs} class="btn btn-primary" disabled={downloading}>
            <i class="fe fe-download mr-2" />
            <Text id="systemSettings.downloadLogsButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemDownloadLogs);
