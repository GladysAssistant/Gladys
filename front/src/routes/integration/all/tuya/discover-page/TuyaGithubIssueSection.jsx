import { Component } from 'preact';
import cx from 'classnames';
import { Text, MarkupText } from 'preact-i18n';
import {
  buildIssueTitle,
  buildFollowUpIssueTitle,
  buildGithubSearchUrl,
  checkGithubIssues,
  createGithubIssueData,
  createEmptyGithubIssueUrl
} from './githubIssue';
import { getLocalPollDpsFromParams } from '../commons/deviceHelpers';

const buildInitialState = () => ({
  githubIssueChecking: false,
  githubIssueExists: false,
  githubIssuePayload: null,
  githubIssuePayloadCopied: false,
  githubIssuePayloadUrl: null,
  githubIssueOpened: false,
  githubIssueLatestIssueNumber: null,
  githubIssueTargetTitle: null,
  githubIssueSkipDuplicateCheck: false
});

class TuyaGithubIssueSection extends Component {
  componentWillMount() {
    this.setState(buildInitialState());
  }

  componentWillReceiveProps(nextProps) {
    const currentDevice = this.props.device;
    const nextDevice = nextProps.device;
    if (!currentDevice || !nextDevice || currentDevice.external_id !== nextDevice.external_id) {
      this.setState(buildInitialState());
    }
  }

  startGithubIssueCreation = async ({ skipDuplicateCheck = false, followUp = false } = {}) => {
    const {
      githubIssueChecking,
      githubIssueExists,
      githubIssuePayload,
      githubIssuePayloadUrl,
      githubIssueOpened,
      githubIssueLatestIssueNumber
    } = this.state;
    const { device, localPollStatus, localPollError, localPollValidation, localPollDps } = this.props;
    if (!device) {
      return;
    }
    if (githubIssueChecking || githubIssuePayload || githubIssuePayloadUrl || githubIssueOpened) {
      return;
    }
    if (!followUp && githubIssueExists) {
      return;
    }
    const persistedLocalPollDps = getLocalPollDpsFromParams(device);
    const effectiveLocalPollDps = localPollDps || persistedLocalPollDps;
    const baseIssueTitle = buildIssueTitle(device);

    const popup = window.open('about:blank', '_blank');
    if (popup) {
      popup.opener = null;
      if (!skipDuplicateCheck) {
        popup.document.title = 'GitHub';
        popup.document.body.innerText = 'Searching for existing issues...';
      }
    }
    let latestIssueNumber = githubIssueLatestIssueNumber;
    let shouldOpenIssue = true;
    if (!skipDuplicateCheck) {
      this.setState({ githubIssueChecking: true });
      try {
        const searchResult = await checkGithubIssues(baseIssueTitle);
        latestIssueNumber = searchResult.latestIssueNumber;
        if (searchResult.exists) {
          shouldOpenIssue = false;
          this.setState({
            githubIssueExists: true,
            githubIssueLatestIssueNumber: searchResult.latestIssueNumber,
            githubIssuePayload: null,
            githubIssuePayloadCopied: false,
            githubIssuePayloadUrl: null,
            githubIssueOpened: false,
            githubIssueTargetTitle: null,
            githubIssueSkipDuplicateCheck: false
          });
        }
      } catch (error) {
        shouldOpenIssue = true;
      } finally {
        this.setState({ githubIssueChecking: false });
      }
    }

    const closePopup = () => {
      if (popup && !popup.closed) {
        popup.close();
      }
    };

    if (!shouldOpenIssue) {
      closePopup();
      this.setState({
        githubIssuePayload: null,
        githubIssuePayloadCopied: false,
        githubIssuePayloadUrl: null,
        githubIssueOpened: false,
        githubIssueTargetTitle: null,
        githubIssueSkipDuplicateCheck: false
      });
      return;
    }

    const targetIssueTitle = followUp ? buildFollowUpIssueTitle(baseIssueTitle, latestIssueNumber) : baseIssueTitle;
    const issueData = createGithubIssueData(
      device,
      localPollStatus,
      localPollError,
      localPollValidation,
      effectiveLocalPollDps,
      { title: targetIssueTitle }
    );
    const issueUrl = issueData.url;

    if (issueData.truncated) {
      closePopup();
      this.setState({
        githubIssuePayload: issueData.body,
        githubIssuePayloadCopied: false,
        githubIssuePayloadUrl: issueData.url,
        githubIssueOpened: false,
        githubIssueTargetTitle: targetIssueTitle,
        githubIssueSkipDuplicateCheck: skipDuplicateCheck || followUp,
        githubIssueLatestIssueNumber: latestIssueNumber
      });
      return;
    }

    this.setState({
      githubIssuePayload: null,
      githubIssuePayloadCopied: false,
      githubIssuePayloadUrl: null,
      githubIssueOpened: true,
      githubIssueTargetTitle: targetIssueTitle,
      githubIssueSkipDuplicateCheck: skipDuplicateCheck || followUp,
      githubIssueLatestIssueNumber: latestIssueNumber
    });

    if (popup) {
      popup.location = issueUrl;
      return;
    }
    window.open(issueUrl, '_blank');
  };

  handleCreateGithubIssue = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    await this.startGithubIssueCreation({ skipDuplicateCheck: false, followUp: false });
  };

  handleCreateGithubIssueAnyway = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    await this.startGithubIssueCreation({ skipDuplicateCheck: true, followUp: true });
  };

  copyGithubIssuePayload = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const { githubIssuePayload } = this.state;
    if (!githubIssuePayload) {
      return;
    }
    let copied = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(githubIssuePayload);
        copied = true;
      } catch (error) {
        copied = false;
      }
    }
    if (!copied && this.githubIssueTextarea) {
      try {
        this.githubIssueTextarea.focus();
        this.githubIssueTextarea.select();
        this.githubIssueTextarea.setSelectionRange(0, this.githubIssueTextarea.value.length);
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      } finally {
        this.githubIssueTextarea.blur();
      }
    }
    this.setState({ githubIssuePayloadCopied: copied });
  };

  openEmptyGithubIssue = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const { device } = this.props;
    const {
      githubIssuePayloadUrl,
      githubIssueChecking,
      githubIssueOpened,
      githubIssueTargetTitle,
      githubIssueSkipDuplicateCheck
    } = this.state;
    if (!device || !githubIssuePayloadUrl || githubIssueChecking || githubIssueOpened) {
      return;
    }
    const issueTitle = githubIssueTargetTitle || buildIssueTitle(device);
    const popup = window.open('about:blank', '_blank');
    if (popup) {
      popup.opener = null;
    }
    if (githubIssueSkipDuplicateCheck) {
      if (popup && !popup.closed) {
        popup.location.href = createEmptyGithubIssueUrl(issueTitle);
      } else {
        window.open(createEmptyGithubIssueUrl(issueTitle), '_blank');
      }
      this.setState({ githubIssueOpened: true });
      return;
    }
    this.setState({ githubIssueChecking: true });
    let shouldOpenIssue = true;
    try {
      const searchResult = await checkGithubIssues(issueTitle);
      if (searchResult.exists) {
        shouldOpenIssue = false;
        if (popup && !popup.closed) {
          popup.close();
        }
        this.setState({
          githubIssueExists: true,
          githubIssueLatestIssueNumber: searchResult.latestIssueNumber
        });
      }
    } catch (error) {
      shouldOpenIssue = true;
    } finally {
      this.setState({ githubIssueChecking: false });
    }
    if (!shouldOpenIssue) {
      return;
    }
    if (popup && !popup.closed) {
      popup.location.href = createEmptyGithubIssueUrl(issueTitle);
    } else {
      window.open(createEmptyGithubIssueUrl(issueTitle), '_blank');
    }
    this.setState({ githubIssueOpened: true });
  };

  render({ actionLabelId, device, withMargin = true, showInfoWhenNoIssue = true }) {
    const {
      githubIssueChecking,
      githubIssueExists,
      githubIssuePayload,
      githubIssuePayloadCopied,
      githubIssuePayloadUrl,
      githubIssueOpened,
      githubIssueLatestIssueNumber
    } = this.state;
    if (!device) {
      return null;
    }
    const disableGithubIssueButton =
      githubIssueChecking || githubIssueExists || githubIssueOpened || githubIssuePayloadUrl || githubIssuePayload;
    const disableGithubIssueCreateAnywayButton = githubIssueChecking || githubIssueOpened || githubIssuePayload;
    const shouldShowGithubIssuePayloadPanel = Boolean(githubIssuePayload || githubIssuePayloadCopied);
    const shouldShowGithubIssuePayloadInsideExistingInfo = Boolean(
      githubIssueExists && (githubIssuePayload || githubIssuePayloadCopied || githubIssuePayloadUrl)
    );
    const githubIssuesUrl = githubIssueExists ? buildGithubSearchUrl(buildIssueTitle(device)) : null;

    const renderGithubIssuePayloadContent = () => (
      <div>
        <Text id="integration.tuya.device.githubIssuePayloadInfo" />
        <textarea
          class="form-control mt-2"
          rows="6"
          readOnly
          value={githubIssuePayload || ''}
          ref={el => {
            this.githubIssueTextarea = el;
          }}
        />
        <div class="d-flex align-items-center mt-2">
          <button onClick={this.copyGithubIssuePayload} class="btn btn-outline-primary">
            <Text id="integration.tuya.device.githubIssuePayloadCopyButton" />
          </button>
          <button
            onClick={this.openEmptyGithubIssue}
            class="btn btn-outline-secondary ml-auto"
            disabled={!githubIssuePayloadUrl || githubIssueChecking || githubIssueOpened}
          >
            <Text id="integration.tuya.device.githubIssuePayloadOpenEmptyButton" />
          </button>
        </div>
        {githubIssuePayloadCopied && (
          <div class="text-success mt-2">
            <Text id="integration.tuya.device.githubIssuePayloadCopied" />
          </div>
        )}
      </div>
    );

    const renderGithubIssueCreateAnywayButton = () => (
      <button
        onClick={this.handleCreateGithubIssueAnyway}
        class="btn btn-outline-secondary mt-2"
        disabled={disableGithubIssueCreateAnywayButton}
      >
        <Text id="integration.tuya.device.githubIssueCreateAnywayButton" />
      </button>
    );

    return (
      <div>
        {actionLabelId && (
          <div class="d-flex flex-wrap">
            <a
              class={cx('btn btn-gray', { disabled: disableGithubIssueButton })}
              href="#"
              onClick={this.handleCreateGithubIssue}
              aria-disabled={disableGithubIssueButton}
              tabIndex={disableGithubIssueButton ? -1 : undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Text id={actionLabelId} />
            </a>
          </div>
        )}

        {githubIssueExists ? (
          <div class={cx('alert alert-info', { 'mt-2': withMargin })}>
            <MarkupText id="integration.tuya.device.githubIssueExistsInfo" fields={{ issuesUrl: githubIssuesUrl }} />
            {shouldShowGithubIssuePayloadInsideExistingInfo ? (
              <div class="mt-3">{renderGithubIssuePayloadContent()}</div>
            ) : (
              <>
                <div class="text-muted mt-2">
                  <Text
                    id="integration.tuya.device.githubIssueCreateAnywayInfo"
                    fields={{ issueNumber: githubIssueLatestIssueNumber || '?' }}
                  />
                </div>
                <div>{renderGithubIssueCreateAnywayButton()}</div>
              </>
            )}
          </div>
        ) : (
          showInfoWhenNoIssue && (
            <div class="text-muted mt-2">
              <Text id="integration.tuya.device.githubIssueInfo" />
            </div>
          )
        )}

        {shouldShowGithubIssuePayloadPanel && !githubIssueExists && !shouldShowGithubIssuePayloadInsideExistingInfo && (
          <div class="alert alert-info mt-2">{renderGithubIssuePayloadContent()}</div>
        )}
      </div>
    );
  }
}

export default TuyaGithubIssueSection;
