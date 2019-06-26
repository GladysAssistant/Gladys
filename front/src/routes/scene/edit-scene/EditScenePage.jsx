import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import ActionColumn from './ActionColumn';

const EditScenePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1
              class="page-title"
              style={{
                marginRight: '20px'
              }}
            >
              <Link href="/dashboard/scene" class="btn btn-secondary btn-sm btn-block">
                ◀️️ <Text id="editScene.backButton" />
              </Link>
            </h1>
            <h1 class="page-title">{props.scene.name}</h1>
            <div class="page-options d-flex">
              <button onClick={props.startScene} class="btn btn-sm btn-primary ml-2">
                <Text id="editScene.startButton" /> <i class="fe fe-play" />
              </button>
              <button onClick={props.saveScene} class="btn btn-sm btn-success ml-2">
                <Text id="editScene.saveButton" /> <i class="fe fe-save" />
              </button>
              <button onClick={props.deleteScene} class="btn btn-sm btn-danger ml-2">
                <Text id="editScene.deleteButton" /> <i class="fe fe-trash" />
              </button>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="card">
                <div class="card-body">
                  <div class="row flex-nowrap" style="overflow-x: auto;">
                    {props.scene.actions.map((parallelActions, index) => (
                      <ActionColumn
                        addAction={props.addAction}
                        actions={parallelActions}
                        deleteAction={props.deleteAction}
                        updateSelectedNewAction={props.updateSelectedNewAction}
                        updateActionProperty={props.updateActionProperty}
                        highLightedActions={props.highLightedActions}
                        sceneParamsData={props.sceneParamsData}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EditScenePage;
