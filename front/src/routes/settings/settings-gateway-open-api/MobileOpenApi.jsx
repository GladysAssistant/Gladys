import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import get from 'get-value';

import BottomSheet from '../../../components/sheet/BottomSheet';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobileRowButton,
  MobileNotice,
  MobileEmptyState,
  MobileField,
  fieldClass,
  BigButton,
  MobileToast,
  ConfirmSheet,
  kitStyle
} from '../../../components/mobile';
import style from '../mobileSettings.css';

const formatDate = (isoDate, language) => new Date(isoDate).toLocaleDateString(language, { dateStyle: 'medium' });

/**
 * @description The Open API keys on a phone (docs/specs/mobile-pages/settings-pages.md, G): one
 * row per key, a key created in a sheet — its name, then the key itself, shown once, with a
 * "Copy" button — and a revocation that is confirmed. Same container as the desktop table.
 */
class MobileOpenApi extends Component {
  state = {
    createOpen: false,
    // 'name': the name is asked; 'key': the key just created is shown
    createStep: 'name',
    creating: false,
    createError: false,
    // the key waiting for a confirmation; it stays while the sheet slides out
    revoking: null,
    revokeOpen: false,
    revokeLoading: false,
    revokeError: false,
    // 'copied' | 'selected' for a few seconds after "Copy the key"
    copyResult: null,
    toast: null,
    toastKey: 0
  };

  componentDidUpdate(prevProps) {
    // the container stores the key it just created: the sheet shows it
    if (this.state.createOpen && this.props.newApiKey && prevProps.newApiKey !== this.props.newApiKey) {
      this.showCreatedKey();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    clearTimeout(this.copyResultTimer);
  }

  showCreatedKey = () => this.setState({ createStep: 'key', creating: false });

  showToast = textId =>
    this.setState(prevState => ({
      toast: get(this.props.intl.dictionary, textId),
      toastKey: prevState.toastKey + 1
    }));

  closeToast = () => this.setState({ toast: null });

  openCreate = () => this.setState({ createOpen: true, createStep: 'name', createError: false, copyResult: null });
  closeCreate = () => this.setState({ createOpen: false });

  createKey = async e => {
    if (e) {
      e.preventDefault();
    }
    if (this.state.creating) {
      return;
    }
    this.setState({ creating: true, createError: false });
    try {
      await this.props.createApiKey();
      if (!this.unmounted) {
        this.setState({ creating: false });
      }
    } catch (error) {
      console.error(error);
      if (!this.unmounted) {
        this.setState({ creating: false, createError: true });
      }
    }
  };

  setKeyElement = element => {
    this.keyElement = element;
  };

  // The clipboard API needs a secure context: without it, the key is selected so the system
  // "Copy" is one tap away. The button says what happened (a toast would sit over the sheet).
  copyKey = async () => {
    const key = get(this.props, 'newApiKey.api_key');
    let copyResult = 'copied';
    try {
      await navigator.clipboard.writeText(key);
    } catch (e) {
      copyResult = 'selected';
      if (this.keyElement && window.getSelection) {
        const range = document.createRange();
        range.selectNodeContents(this.keyElement);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    if (this.unmounted) {
      return;
    }
    this.setState({ copyResult });
    clearTimeout(this.copyResultTimer);
    this.copyResultTimer = setTimeout(() => {
      if (!this.unmounted) {
        this.setState({ copyResult: null });
      }
    }, 3000);
  };

  askRevoke = apiKey => () => this.setState({ revoking: apiKey, revokeOpen: true, revokeError: false });

  cancelRevoke = () => {
    if (!this.state.revokeLoading) {
      this.setState({ revokeOpen: false });
    }
  };

  confirmRevoke = async () => {
    const { revoking } = this.state;
    const index = (this.props.apiKeys || []).findIndex(apiKey => apiKey.id === revoking.id);
    if (index === -1) {
      this.setState({ revokeOpen: false });
      return;
    }
    this.setState({ revokeLoading: true, revokeError: false });
    try {
      await this.props.revokeOpenApiKey(revoking.id, index);
      if (!this.unmounted) {
        this.setState({ revokeLoading: false, revokeOpen: false });
        this.showToast('gatewayOpenApi.mobile.revoked');
      }
    } catch (error) {
      console.error(error);
      if (!this.unmounted) {
        this.setState({ revokeLoading: false, revokeError: true });
      }
    }
  };

  render(
    props,
    {
      createOpen,
      createStep,
      creating,
      createError,
      revoking,
      revokeOpen,
      revokeLoading,
      revokeError,
      copyResult,
      toast,
      toastKey
    }
  ) {
    const { intl } = props;
    const language = get(props, 'user.language') || 'en';
    const apiKeys = props.apiKeys || [];
    return (
      <div class={style.page} data-cy="open-api-mobile">
        <div class={style.lead}>
          <Text id="gatewayOpenApi.description" /> <MarkupText id="gatewayOpenApi.moreInformations" />
        </div>
        <div class={style.block}>
          <BigButton variant="primary" icon="plus" onClick={this.openCreate} data-cy="open-api-create">
            <Text id="gatewayOpenApi.mobile.createButton" />
          </BigButton>
        </div>

        {apiKeys.length > 0 && (
          <div>
            <MobileSectionHeader
              title={
                <Text id="gatewayOpenApi.mobile.keysTitle" plural={apiKeys.length} fields={{ count: apiKeys.length }} />
              }
            />
            <MobileGroup>
              {apiKeys.map(apiKey => (
                <MobileRow
                  key={apiKey.id}
                  icon="key"
                  title={apiKey.name}
                  subtitle={
                    <Text
                      id="gatewayOpenApi.mobile.created"
                      fields={{ date: formatDate(apiKey.created_at, language) }}
                    />
                  }
                  meta={
                    apiKey.last_used ? (
                      <Text
                        id="gatewayOpenApi.mobile.lastUsed"
                        fields={{ date: formatDate(apiKey.last_used, language) }}
                      />
                    ) : (
                      <Text id="gatewayOpenApi.mobile.neverUsed" />
                    )
                  }
                  trailing={
                    <MobileRowButton
                      icon="trash-2"
                      danger
                      label={get(intl.dictionary, 'gatewayOpenApi.revoke')}
                      onClick={this.askRevoke(apiKey)}
                      data-cy="open-api-revoke"
                    />
                  }
                  dataCy="open-api-row"
                >
                  {/* a key just created stays readable in its row until the page is left, as in
                      the table */}
                  {apiKey.api_key && (
                    <span class={style.rowCode} data-cy="open-api-row-key">
                      {apiKey.api_key}
                    </span>
                  )}
                </MobileRow>
              ))}
            </MobileGroup>
          </div>
        )}
        {apiKeys.length === 0 && <MobileEmptyState icon="key" text={<Text id="gatewayOpenApi.mobile.empty" />} />}

        <BottomSheet
          open={createOpen}
          title={get(
            intl.dictionary,
            createStep === 'key' ? 'gatewayOpenApi.mobile.keyTitle' : 'gatewayOpenApi.mobile.createTitle'
          )}
          onClose={this.closeCreate}
          dataCy="open-api-create-sheet"
        >
          {createStep === 'name' && (
            <form onSubmit={this.createKey}>
              {createError && (
                <MobileNotice tone="danger" icon="alert-circle">
                  <Text id="gatewayOpenApi.mobile.createError" />
                </MobileNotice>
              )}
              <MobileField
                label={<Text id="gatewayOpenApi.keyName" />}
                htmlFor="openApiKeyName"
                help={<Text id="gatewayOpenApi.mobile.nameHelp" />}
                error={props.missingNewOpenApiName ? <Text id="gatewayOpenApi.mobile.nameRequired" /> : null}
              >
                <Localizer>
                  <input
                    id="openApiKeyName"
                    type="text"
                    class={`${fieldClass.input} ${props.missingNewOpenApiName ? fieldClass.invalid : ''}`}
                    value={props.newApiKeyName}
                    onInput={props.updateNewApiKeyName}
                    placeholder={<Text id="gatewayOpenApi.mobile.namePlaceholder" />}
                    autocomplete="off"
                    autocapitalize="sentences"
                    enterkeyhint="go"
                    data-cy="open-api-name"
                  />
                </Localizer>
              </MobileField>
              <BigButton variant="primary" type="submit" loading={creating} data-cy="open-api-generate">
                <Text id="gatewayOpenApi.generateButton" />
              </BigButton>
            </form>
          )}
          {createStep === 'key' && props.newApiKey && (
            <div>
              <MobileNotice tone="warning" icon="alert-triangle">
                <Text id="gatewayOpenApi.warningKeyDisappear" />
              </MobileNotice>
              <MobileField label={props.newApiKey.name}>
                <div class={style.code} ref={this.setKeyElement} data-cy="open-api-key">
                  {props.newApiKey.api_key}
                </div>
              </MobileField>
              <div class={kitStyle.buttons}>
                <BigButton
                  variant="primary"
                  icon={copyResult === 'copied' ? 'check' : 'copy'}
                  onClick={this.copyKey}
                  data-cy="open-api-copy"
                >
                  <span role="status">
                    <Text id={copyResult ? `gatewayOpenApi.mobile.${copyResult}` : 'gatewayOpenApi.mobile.copy'} />
                  </span>
                </BigButton>
                <BigButton variant="ghost" onClick={this.closeCreate} data-cy="open-api-done">
                  <Text id="mobileKit.done" />
                </BigButton>
              </div>
            </div>
          )}
        </BottomSheet>

        <ConfirmSheet
          open={revokeOpen}
          title={get(intl.dictionary, 'gatewayOpenApi.mobile.revokeTitle')}
          text={revoking && <Text id="gatewayOpenApi.mobile.revokeText" fields={{ name: revoking.name }} />}
          confirmLabel={<Text id="gatewayOpenApi.revoke" />}
          destructive
          loading={revokeLoading}
          onConfirm={this.confirmRevoke}
          onCancel={this.cancelRevoke}
          dataCy="open-api-revoke-confirm"
        >
          {revokeError && (
            <MobileNotice tone="danger" icon="alert-circle">
              <Text id="gatewayOpenApi.mobile.revokeError" />
            </MobileNotice>
          )}
        </ConfirmSheet>

        <MobileToast message={toast} toastKey={toastKey} onClose={this.closeToast} dataCy="open-api-toast" />
      </div>
    );
  }
}

export default withIntlAsProp(MobileOpenApi);
