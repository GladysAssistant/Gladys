import { CardElement, injectStripe } from 'react-stripe-elements';
import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';

class MyStoreCheckout extends Component {
  submitCard = ev => {
    // We don't want to let default form submission happen here, which would refresh the page.
    ev.preventDefault();

    this.props.updateRequestPending(true);

    // Within the context of `Elements`, this call to createToken knows which Element to
    // tokenize, since there's only one in this group.
    this.props.stripe
      .createToken({ email: this.props.email })
      .then(({ token }) => {
        this.props.subscribeToPlan(token);
      })
      .catch(() => {
        this.props.updateRequestPending(false);
      });
  };

  render({}, {}) {
    return (
      <form onSubmit={this.submitCard}>
        <label className="form-label">
          <Text id="gatewaySubscribe.cardInformations" />
        </label>
        <CardElement
          className="form-control"
          style={{
            base: {
              lineHeight: '1.6'
            }
          }}
        />
        <br />
        <label>
          <MarkupText id="gatewaySubscribe.paymentSecuredByStripe" />
        </label>
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: '15px' }}
          disabled={this.props.requestPending === true}
        >
          <Text id="gatewaySubscribe.subscribeButton" />
        </button>
      </form>
    );
  }
}

export default injectStripe(MyStoreCheckout);
