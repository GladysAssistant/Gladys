import { Component, createRef } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import axios from 'axios';

class SettingsSystemLocalBackup extends Component {
  fileInputRef = createRef();

  state = {
    backupInProgress: false,
    backupError: false,
    backupSuccess: false,
    restoreInProgress: false,
    restoreError: false,
    restoreStarted: false,
    restoreConfirm: false,
    selectedFile: null,
    uploadPercent: 0
  };

  // ── Backup ────────────────────────────────────────────────────────────────

  startLocalBackup = async e => {
    e.preventDefault();
    this.setState({ backupInProgress: true, backupError: false, backupSuccess: false });
    try {
      const response = await axios({
        baseURL: this.props.httpClient.localApiUrl,
        url: '/api/v1/system/backup/local',
        method: 'get',
        responseType: 'blob',
        headers: this.props.httpClient.getAxiosHeaders()
      });

      const contentDisposition = response.headers['content-disposition'] || '';
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      const fileName = match ? match[1] : `gladys-local-backup-${new Date().toISOString().slice(0, 10)}.tar.gz`;

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/gzip' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.setState({ backupInProgress: false, backupSuccess: true });
    } catch (err) {
      console.error(err);
      this.setState({ backupInProgress: false, backupError: true });
    }
  };

  // ── Restore ───────────────────────────────────────────────────────────────

  onFileSelected = e => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      this.setState({ selectedFile: file, restoreError: false, restoreStarted: false });
    }
  };

  askRestoreConfirm = e => {
    e.preventDefault();
    this.setState({ restoreConfirm: true });
  };

  cancelRestore = e => {
    e.preventDefault();
    this.setState({ restoreConfirm: false });
  };

  confirmRestore = async e => {
    e.preventDefault();
    const { selectedFile } = this.state;
    if (!selectedFile) return;

    this.setState({ restoreInProgress: true, restoreError: false, restoreConfirm: false, uploadPercent: 0 });
    try {
      await axios({
        baseURL: this.props.httpClient.localApiUrl,
        url: '/api/v1/system/backup/local/restore',
        method: 'post',
        data: selectedFile,
        headers: {
          ...this.props.httpClient.getAxiosHeaders(),
          'Content-Type': 'application/gzip'
        },
        onUploadProgress: evt => {
          if (evt.total) {
            const pct = Math.round((evt.loaded * 100) / evt.total);
            this.setState({ uploadPercent: pct });
          }
        }
      });
      this.setState({ restoreInProgress: false, restoreStarted: true, selectedFile: null });
      if (this.fileInputRef.current) this.fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      this.setState({ restoreInProgress: false, restoreError: true });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  render(
    {},
    {
      backupInProgress,
      backupError,
      backupSuccess,
      restoreInProgress,
      restoreError,
      restoreStarted,
      restoreConfirm,
      selectedFile,
      uploadPercent
    }
  ) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.localBackupTitle" />
        </h4>
        <div class="card-body">
          {/* ── Backup section ── */}
          <h5>
            <Text id="systemSettings.localBackupSectionTitle" />
          </h5>
          <p>
            <Text id="systemSettings.localBackupDescription" />
          </p>
          {backupError && (
            <div class="alert alert-danger">
              <Text id="systemSettings.localBackupError" />
            </div>
          )}
          {backupSuccess && (
            <div class="alert alert-success">
              <Text id="systemSettings.localBackupSuccess" />
            </div>
          )}
          <button onClick={this.startLocalBackup} class="btn btn-primary" disabled={backupInProgress}>
            {backupInProgress ? (
              <span>
                <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                <Text id="systemSettings.localBackupInProgress" />
              </span>
            ) : (
              <Text id="systemSettings.localBackupButton" />
            )}
          </button>

          <hr />

          {/* ── Restore section ── */}
          <h5>
            <Text id="systemSettings.localRestoreSectionTitle" />
          </h5>
          <p>
            <Text id="systemSettings.localRestoreDescription" />
          </p>

          {restoreError && (
            <div class="alert alert-danger">
              <Text id="systemSettings.localRestoreError" />
            </div>
          )}
          {restoreStarted && (
            <div class="alert alert-warning">
              <Text id="systemSettings.localRestoreStarted" />
            </div>
          )}

          {!restoreStarted && (
            <div>
              <div class="mb-3">
                <input
                  ref={this.fileInputRef}
                  type="file"
                  accept=".tar.gz,.gz"
                  class="form-control-file"
                  onChange={this.onFileSelected}
                  disabled={restoreInProgress}
                />
              </div>

              {restoreInProgress && (
                <div class="mb-3">
                  <div class="progress">
                    <div
                      class="progress-bar"
                      role="progressbar"
                      style={{ width: `${uploadPercent}%` }}
                      aria-valuenow={uploadPercent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {uploadPercent}%
                    </div>
                  </div>
                  <small class="text-muted mt-1 d-block">
                    <Text id="systemSettings.localRestoreUploading" />
                  </small>
                </div>
              )}

              {restoreConfirm && (
                <div class="alert alert-warning mb-3">
                  <strong>
                    <Text id="systemSettings.localRestoreConfirmWarning" />
                  </strong>
                  <div class="mt-2">
                    <button class="btn btn-danger mr-2" onClick={this.confirmRestore}>
                      <Text id="systemSettings.localRestoreConfirmYes" />
                    </button>
                    <button class="btn btn-secondary" onClick={this.cancelRestore}>
                      <Text id="systemSettings.localRestoreConfirmNo" />
                    </button>
                  </div>
                </div>
              )}

              {!restoreConfirm && (
                <button
                  onClick={this.askRestoreConfirm}
                  class="btn btn-danger"
                  disabled={!selectedFile || restoreInProgress}
                >
                  <Text id="systemSettings.localRestoreButton" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('session,httpClient', null)(SettingsSystemLocalBackup);
