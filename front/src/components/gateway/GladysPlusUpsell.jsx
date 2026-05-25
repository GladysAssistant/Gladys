import { Component } from 'preact';
import { connect } from 'unistore/preact';

import GladysPlusUpsellCard from './GladysPlusUpsellCard';

/**
 * Smart wrapper around <GladysPlusUpsellCard /> that only renders the card
 * when the local Gladys instance is NOT connected to Gladys Plus.
 *
 * Use this in places where you want to upsell Gladys Plus *only* to users
 * who don't have it yet (premium features pages, integration pages, scene
 * actions that require Plus, etc.).
 *
 * Accepts the exact same props as <GladysPlusUpsellCard /> (titleKey,
 * descriptionKey, featureKeys, icon, utmCampaign, variant).
 */
class GladysPlusUpsell extends Component {
  state = {
    gladysPlusConnected: null
  };

  fetchStatus = async () => {
    try {
      const response = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({ gladysPlusConnected: response.configured === true });
    } catch (e) {
      console.error(e);
      this.setState({ gladysPlusConnected: false });
    }
  };

  componentDidMount() {
    this.fetchStatus();
  }

  render(props, { gladysPlusConnected }) {
    if (gladysPlusConnected !== false) {
      return null;
    }
    return <GladysPlusUpsellCard {...props} />;
  }
}

export default connect('httpClient', {})(GladysPlusUpsell);
