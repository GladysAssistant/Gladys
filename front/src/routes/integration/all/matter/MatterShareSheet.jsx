import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import QRCode from 'qrcode';

import BottomSheet from '../../../../components/sheet/BottomSheet';
import { MobileNotice, BigButton } from '../../../../components/mobile';
import { formatManualPairingCode } from './matterUtils';
import style from './style.css';

/**
 * @description Shares a node with another ecosystem (docs/specs/matter.md): Gladys opens a
 * commissioning window on the node, and this sheet shows the QR code and the manual code the
 * other app asks for, until the window closes.
 */
class MatterShareSheet extends Component {
  state = {
    qrCodeDataUrl: null,
    remainingSeconds: 0
  };

  componentDidMount() {
    this.update();
  }

  componentDidUpdate(previousProps) {
    if (previousProps.share !== this.props.share) {
      this.update();
    }
  }

  componentWillUnmount() {
    clearInterval(this.countdown);
  }

  update = async () => {
    clearInterval(this.countdown);
    const { share } = this.props;
    if (!share) {
      this.setState({ qrCodeDataUrl: null, remainingSeconds: 0 });
      return;
    }
    this.tick();
    this.countdown = setInterval(this.tick, 1000);
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(share.qr_pairing_code, { margin: 1, width: 240 });
      this.setState({ qrCodeDataUrl });
    } catch (e) {
      console.error(e);
    }
  };

  tick = () => {
    const remainingSeconds = Math.max(0, Math.round((new Date(this.props.share.expires_at) - Date.now()) / 1000));
    this.setState({ remainingSeconds });
    if (remainingSeconds === 0) {
      clearInterval(this.countdown);
    }
  };

  render({ open, title, share, loading, error, onClose, depth }, { qrCodeDataUrl, remainingSeconds }) {
    const expired = share && remainingSeconds === 0;
    return (
      <BottomSheet open={open} title={title} onClose={onClose} depth={depth} dataCy="matter-share-sheet">
        {loading && (
          <MobileNotice icon="loader">
            <Text id="integration.matter.node.share.opening" />
          </MobileNotice>
        )}
        {error && (
          <MobileNotice tone="danger" icon="alert-circle" data-cy="matter-share-error">
            <Text id="integration.matter.node.share.error" />
            <div>
              <small>{error}</small>
            </div>
          </MobileNotice>
        )}
        {share && !expired && (
          <div class={style.shareContent}>
            <p class="text-muted">
              <MarkupText id="integration.matter.node.share.description" />
            </p>
            {qrCodeDataUrl && (
              <img
                class={style.shareQrCode}
                src={qrCodeDataUrl}
                alt={share.qr_pairing_code}
                data-cy="matter-share-qr"
              />
            )}
            <div class={style.shareCode} data-cy="matter-share-code">
              {formatManualPairingCode(share.manual_pairing_code)}
            </div>
            <p class="text-muted">
              <Text
                id="integration.matter.node.share.remaining"
                fields={{
                  minutes: Math.floor(remainingSeconds / 60),
                  seconds: String(remainingSeconds % 60).padStart(2, '0')
                }}
              />
            </p>
          </div>
        )}
        {expired && (
          <MobileNotice tone="warning" icon="clock">
            <Text id="integration.matter.node.share.expired" />
          </MobileNotice>
        )}
        <BigButton variant="ghost" onClick={onClose} data-cy="matter-share-close">
          <Text id="integration.matter.node.share.close" />
        </BigButton>
      </BottomSheet>
    );
  }
}

export default MatterShareSheet;
