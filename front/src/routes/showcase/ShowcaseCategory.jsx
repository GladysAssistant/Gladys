import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import ShowcaseFeature from './ShowcaseFeature';

class ShowcaseCategory extends Component {
  toggle = e => {
    e.preventDefault();
    this.setState({ collapsed: !this.state.collapsed });
  };

  render({ user, category, deviceIndex, features, readOnly, updateValue }, { collapsed = false }) {
    return (
      <div class={cx('card', { 'card-collapsed': collapsed })} style="display: inline-block; min-width: 300px">
        <div class="card-header">
          <h3 class="card-title">
            <Text id={`deviceFeatureCategory.${category}.shortCategoryName`}>Unknown {category} category</Text>
          </h3>
          <div class="card-options">
            <a href="" onClick={this.toggle} class="card-options-collapse" data-toggle="card-collapse">
              <i class="fe fe-chevron-up" />
            </a>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table card-table table-vcenter">
            <tbody>
              {features.map((feature, deviceFeatureIndex) => (
                <ShowcaseFeature
                  feature={feature}
                  deviceIndex={deviceIndex}
                  deviceFeatureIndex={deviceFeatureIndex}
                  user={user}
                  readOnly={readOnly}
                  updateValue={updateValue}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default ShowcaseCategory;
