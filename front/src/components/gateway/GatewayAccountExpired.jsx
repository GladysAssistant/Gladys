import { MarkupText } from 'preact-i18n';
import style from './style.css';

const GatewayAccountExpired = ({}) => (
  <div class={style.gatewayExpiredDivBox}>
    <img src="/assets/images/undraw_credit_card_payments.svg" class={style.gatewayExpiredImage} />
    <p class={style.gatewayExpiredText}>
      <MarkupText id="gateway.accountExpired" />
    </p>
  </div>
);

export default GatewayAccountExpired;
