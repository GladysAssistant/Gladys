import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

const GladysStartTrigger = () => (
  <div>
    <div class="row">
      <div class="col-sm-12">
        <Text id="editScene.triggersCard.gladysStart.description" />
      </div>
    </div>
  </div>
);

export default connect('', {})(GladysStartTrigger);
