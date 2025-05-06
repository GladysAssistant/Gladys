import { Text } from 'preact-i18n';

const EditActions = props => (
  <div class="fixed-bottom footer">
    <div class="container">
      <div class="row align-items-center flex-row-reverse">
        <div class="col-auto">
          <button onClick={props.startScene} className="btn btn-primary">
            <Text id="editScene.startButton" /> <i class="fe fe-play" />
          </button>
          <button onClick={props.saveScene} disabled={props.saving} className="btn btn-success ml-2">
            <Text id="editScene.saveButton" /> <i class="fe fe-save" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default EditActions;
