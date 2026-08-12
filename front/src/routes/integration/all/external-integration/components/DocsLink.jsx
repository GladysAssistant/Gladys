import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import Modal from './Modal';
import { RequestStatus } from '../../../../../utils/consts';

// The store documentation is a re-hosted raw .md file: instead of sending
// the user to it, render it in a modal. The markdown is fetched through
// the server (which only resolves URLs from the store index) and
// sanitized before display: the doc is third-party content. marked and
// DOMPurify are only downloaded on the first open, not in the main
// bundle. A modified click (ctrl, cmd, shift) keeps the browser behavior
// and opens the raw file in a new tab, like the load-error fallback.
class DocsLink extends Component {
  handleOpen = e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      return;
    }
    e.preventDefault();
    this.open();
  };

  open = async () => {
    this.setState({ modalOpened: true, status: RequestStatus.Getting });
    try {
      const [markedModule, dompurifyModule, docs] = await Promise.all([
        import('marked'),
        import('dompurify'),
        this.props.httpClient.get('/api/v1/external_integration/store/docs', {
          store_slug: this.props.storeSlug,
          lang: this.props.lang
        })
      ]);
      const html = this.buildHtml(markedModule.marked, dompurifyModule.default, docs.content, docs.url);
      this.setState({ html, status: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ status: RequestStatus.Error });
    }
  };

  buildHtml = (marked, DOMPurify, content, baseUrl) => {
    const template = document.createElement('template');
    template.innerHTML = DOMPurify.sanitize(marked.parse(content), { USE_PROFILES: { html: true } });
    // resolve the relative links and images of the doc folder, and keep
    // navigation out of the dashboard (sanitized first: the hrefs here
    // can only carry safe schemes)
    template.content.querySelectorAll('a[href]').forEach(link => {
      link.setAttribute('href', new URL(link.getAttribute('href'), baseUrl).toString());
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
    template.content.querySelectorAll('img[src]').forEach(image => {
      image.setAttribute('src', new URL(image.getAttribute('src'), baseUrl).toString());
      image.setAttribute('style', 'max-width: 100%;');
    });
    template.content.querySelectorAll('table').forEach(table => {
      table.setAttribute('class', 'table table-bordered');
    });
    return template.innerHTML;
  };

  close = () => {
    this.setState({ modalOpened: false });
  };

  render({ docsUrl, labelId, linkClass }, { modalOpened, status, html }) {
    return (
      <span>
        <a href={docsUrl} target="_blank" rel="noopener noreferrer" class={linkClass} onClick={this.handleOpen}>
          <i class="fe fe-book-open mr-1" />
          <Text id={labelId} />
        </a>
        {modalOpened && (
          <Modal title={<Text id="integration.externalIntegration.docs.modalTitle" />} onClose={this.close} large>
            <div class="card-body" style="max-height: 70vh; overflow-y: auto;">
              {status === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="integration.externalIntegration.docs.loadError" />{' '}
                  <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                    <Text id="integration.externalIntegration.docs.openRawLink" />
                  </a>
                </div>
              )}
              <div
                class={cx('dimmer', {
                  active: status === RequestStatus.Getting
                })}
              >
                <div class="loader" />
                <div class="dimmer-content" dangerouslySetInnerHTML={{ __html: html || '' }} />
              </div>
            </div>
            <div class="card-footer text-right">
              <a href={docsUrl} target="_blank" rel="noopener noreferrer" class="small">
                <i class="fe fe-external-link mr-1" />
                <Text id="integration.externalIntegration.docs.openRawLink" />
              </a>
            </div>
          </Modal>
        )}
      </span>
    );
  }
}

export default DocsLink;
