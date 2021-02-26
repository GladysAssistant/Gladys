import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updatePiholeIp(state, e) {
    store.setState({
      piholeIp: e.target.value
    });
  },
  async getPiholeIp(state) {
    store.setState({
      piholeGetIpStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/pihole/variable/PIHOLE_IP');
      store.setState({
        piholeIp: variable.value,
        piholeGetIpStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        piholeGetIpStatus: RequestStatus.Error
      });
    }
  },
  async savePiholeIp(state, e) {
    e.preventDefault();
    store.setState({
      piholeSaveIpStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        piholeIp: state.piholeIp.trim()
      });
      // save telegram api key
      await state.httpClient.post('/api/v1/service/pihole/variable/PIHOLE_IP', {
        value: state.piholeIp.trim(),
        piholeSaveIpStatus: RequestStatus.Success
      });
      // start service
      await state.httpClient.post('/api/v1/service/pihole/start');
    } catch (e) {
      store.setState({
        piholeSaveIpStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
