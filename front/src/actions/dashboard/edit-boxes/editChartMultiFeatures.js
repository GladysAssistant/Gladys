import createBoxActions from '../boxActions';

function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    updateBoxChartName(state, x, y, chartName) {
      boxActions.updateBoxConfig(state, x, y, {
        chartName
      });
    },
    updateBoxChartType(state, x, y, chartType) {
      boxActions.updateBoxConfig(state, x, y, {
        chartType
      });
    },
    updateBoxChartPeriod(state, x, y, chartPeriod) {
      boxActions.updateBoxConfig(state, x, y, {
        chartPeriod
      });
    },
    updateBoxChartLimitClass(state, x, y, chartLimitClass) {
      boxActions.updateBoxConfig(state, x, y, {
        chartLimitClass
      });
    },
    updateBoxRoom(state, x, y, room) {
      if(room){
        boxActions.updateBoxConfig(state, x, y, {
          room
        });
      }else{
        boxActions.removeBoxConfig(state, x, y, ['room']);
      }
    },
    updateBoxDeviceFeatures(state, x, y, deviceFeatures) {
      boxActions.updateBoxConfig(state, x, y, {
        device_features: deviceFeatures
      });
    }
  };
  return actions;
}

export default createActions;
