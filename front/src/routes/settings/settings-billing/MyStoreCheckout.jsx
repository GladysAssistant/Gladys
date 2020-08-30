import { Text, MarkupText } from 'preact-i18n';
import { CardElement, injectStripe } from 'react-stripe-elements';
import { Component } from 'preact';

class MyStoreCheckout extends Component {
  submitCard = ev => {
    // We don't want to let default form submission happen here, which would refresh the page.
    ev.preventDefault();

    this.props.updateBillingRequestPending();

    // Within the context of `Elements`, this call to createToken knows which Element to
    // tokenize, since there's only one in this group.
    this.props.stripe.createToken({ name: this.props.userCardName }).then(({ token }) => {
      this.props.saveBillingInformations(token);
    });
  };

  render({}, {}) {
    return (
      <form onSubmit={this.submitCard}>
        <CardElement />
        <br />
        <label>
          <MarkupText id="gatewaySubscribe.paymentSecuredByStripe" />
        </label>
        <button class="btn btn-primary btn-block" style={{ marginTop: '15px' }}>
          <Text id="gatewaySubscribe.priceButton" />
        </button>
      </form>
    );
  }
}

export default injectStripe(MyStoreCheckout);
