import { Text } from 'preact-i18n';
import { useCallback, useEffect } from 'preact/hooks';
import { connect } from 'unistore/preact';
import actions from '../../../actions/dashboard/edit-boxes/editMediaPlayer';
import BaseEditBox from '../baseEditBox';

const EditMediaPlayer = connect(
  'players',
  actions
)(({ children, ...props }) => {
  useEffect(() => {
    (async () => {
      await props.getMediaPlayers();
    })();
  }, []);

  const onChange = useCallback(
    e => {
      props.updateBoxConfig(props.x, props.y, {
        player: e.target.value
      });
    },
    [props.x, props.y]
  );

  return (
    <BaseEditBox {...props} titleKey="dashboard.boxTitle.media-player">
      <div class="form-group">
        <label>
          <Text id="dashboard.boxes.mediaPlayer.editPlayerLabel" />
        </label>
        <select onChange={onChange} class="form-control">
          <option value="">
            <Text id="global.emptySelectOption" />
          </option>
          {props.players &&
            props.players.map(player => (
              <option selected={player.selector === props.box.player} value={player.selector}>
                {player.name}
              </option>
            ))}
        </select>
      </div>
    </BaseEditBox>
  );
});

export default EditMediaPlayer;
