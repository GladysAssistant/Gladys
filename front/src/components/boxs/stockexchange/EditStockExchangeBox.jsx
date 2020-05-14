import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';

const StockExchangeBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.stockexchange">
    <Text id="dashboard.boxes.stockExchange.description" />
  </BaseEditBox>
);

export default StockExchangeBox;
