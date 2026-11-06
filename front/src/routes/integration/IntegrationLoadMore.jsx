import { Component } from 'preact';
import { Text } from 'preact-i18n';
import style from './style.css';

/**
 * End of the rendered page of cards: the next page is rendered when this
 * block comes close to the viewport, so scrolling the catalog feels like one
 * list. The button is the keyboard path, and the fallback where
 * IntersectionObserver is not available.
 */
class IntegrationLoadMore extends Component {
  componentDidMount() {
    if (typeof IntersectionObserver === 'function') {
      this.observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            this.props.onLoadMore();
          }
        },
        { rootMargin: '600px' }
      );
      this.observer.observe(this.base);
    }
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  render({ onLoadMore, remaining }) {
    return (
      <div class={`text-center mt-4 ${style.loadMore}`}>
        <button type="button" class="btn btn-secondary" onClick={onLoadMore}>
          <Text id="integration.root.showMore" plural={remaining} fields={{ count: remaining }} />
        </button>
      </div>
    );
  }
}

export default IntegrationLoadMore;
