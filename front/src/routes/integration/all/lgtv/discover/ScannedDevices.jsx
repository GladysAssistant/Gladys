import { useEffect, useState, useCallback } from 'preact/hooks';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';
import { connect } from 'unistore/preact';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import uuid from 'uuid';

import { STATE } from '../../../../../../../server/services/lgtv/lib/tv/consts';

const DiscoveredText = ({ modelName }) =>
  modelName ? (
    <Text id="integration.lgtv.deviceFound" fields={{ modelName }} />
  ) : (
    <Text id="integration.lgtv.deviceFoundNoModel" />
  );

const Prompt = ({ device, state, onPromptRequested, isPending, countdown }) => {
  return (
    <div class="col-md-12">
      <div class={cx('text-center')}>
        <div>
          <h4 class={style.heading}>
            <DiscoveredText modelName={device.modelName} />
          </h4>
          {status === STATE.PROMPT_ERROR && <Text id="integration.lgtv.promptError" />}
          <button onClick={onPromptRequested} disabled={isPending} class="btn btn-primary ml-2">
            {isPending ? <Text id="integration.lgtv.prompt" /> : <Text id="integration.lgtv.requestPrompt" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const Connected = ({ onAddScannedDevice, device }) => {
  const onClick = useCallback(() => {
    onAddScannedDevice(device);
  });
  return (
    <div class="col-md-12">
      <div class={cx('text-center', style.scanResults)}>
        <h4 class={style.heading}>
          <DiscoveredText modelName={device.modelName} />
        </h4>

        <button onClick={onClick} class="btn btn-primary ml-2">
          {device.modelName ? (
            <Text id="integration.lgtv.addDetectedDevice" fields={{ modelName: device.modelName }} />
          ) : (
            <Text id="integration.lgtv.addDetectedDeviceNoModel" />
          )}
        </button>
      </div>
    </div>
  );
};

const ScannedDevices = connect('session')(({ onAddScannedDevice, devices, session }) => {
  const device = devices[0];

  const [state, setState] = useState(device.state);
  const [isPending, setIsPending] = useState(false);

  const id = useCallback(() => uuid.v4());

  useEffect(() => {
    const onConnect = () => {
      setState(STATE.CONNECTED);
      setIsPending(false);
      onAddScannedDevice(device);
    };

    const onTimeout = () => {
      setState(STATE.PROMPT_TIMEOUT);
      setIsPending(false);
    };

    const onPromptError = () => {
      setState(STATE.ERROR);
      setIsPending(false);
    };

    session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.LGTV.CONNECTED, onConnect);
    session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT_ERROR, onPromptError);
    session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT_TIMEOUT, onTimeout);

    return function cleanup() {
      session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.LGTV.CONNECTED, onConnect);
      session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT_ERROR, onPromptError);
      session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT_TIMEOUT, onTimeout);
    };
  }, [device]);

  const onPromptRequested = useCallback(() => {
    session.ws.send(
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.LGTV.PROMPT,
        payload: {
          uuid: id()
        }
      })
    );
    setIsPending(true);
  });

  switch (state) {
    case STATE.PROMPT:
    case STATE.PROMPT_TIMEOUT:
    case STATE.PROMPT_ERROR:
      return <Prompt device={device} state={state} onPromptRequested={onPromptRequested} isPending={isPending} />;
    case STATE.CONNECTED:
      return <Connected onAddScannedDevice={onAddScannedDevice} device={device} />;
  }

  return null;
});

export default ScannedDevices;
