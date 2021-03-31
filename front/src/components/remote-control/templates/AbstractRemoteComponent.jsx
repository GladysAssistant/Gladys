import { Component } from 'preact';
import ButtonBox from '../ButtonBox';

import { FEATURES_BY_CATEGORY } from './index';

class AbstractRemoteComponent extends Component {
  constructor(props, template) {
    super(props);

    const { category } = template;
    this.state = {
      category,
      buttons: FEATURES_BY_CATEGORY[category]
    };
  }

  renderButton = (featureName, value) => {
    const { category, buttons } = this.state;
    const { editionMode, featureByType = {}, onClick } = this.props;
    const valuedKey = `${featureName}-${value}`;
    const button = buttons[valuedKey] || buttons[featureName] || {};

    return (
      <ButtonBox
        category={category}
        featureName={featureName}
        editionMode={editionMode}
        edited={featureByType[valuedKey] || featureByType[featureName]}
        button={button}
        onClick={onClick}
        value={value}
      />
    );
  };
}

export default AbstractRemoteComponent;
