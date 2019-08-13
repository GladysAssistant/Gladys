import { featureConverter } from '../../../../../../server/services/mqtt/lib/handler/sonoff/featureConverter';

const Models = {
  basic: featureConverter(1),
  pow: featureConverter(6),
  s26: featureConverter(8)
};

export default Models;
