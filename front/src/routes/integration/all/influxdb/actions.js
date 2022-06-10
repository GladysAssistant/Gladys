import { RequestStatus } from '../../../../utils/consts';
import { InfluxdbStatus } from '../../../../utils/consts';

const actions = store => ({
  async getInfluxdbSettings(state) {
    store.setState({
      influxdbGetSettingsStatus: InfluxdbStatus.Getting
    });

    let influxdbUrl = '';
    let influxdbBucket = '';
    let influxdbToken = '';
    let influxdbOrg = '';

    store.setState({
      influxdbUrl,
      influxdbBucket,
      influxdbToken,
      influxdbOrg
    });

    try {
      const { value: url } = await state.httpClient.get('/api/v1/service/influxdb/variable/INFLUXDB_URL');
      influxdbUrl = url;
      const { value: bucket } = await state.httpClient.get('/api/v1/service/influxdb/variable/INFLUXDB_BUCKET');
      influxdbBucket = bucket;
      const { value: token } = await state.httpClient.get('/api/v1/service/influxdb/variable/INFLUXDB_TOKEN');
      influxdbToken = token;
      const { value: org } = await state.httpClient.get('/api/v1/service/influxdb/variable/INFLUXDB_ORG');
      influxdbOrg = org;

      store.setState({
        influxdbGetSettingsStatus: InfluxdbStatus.Success
      });
    } catch (e) {
      store.setState({
        influxdbGetSettingsStatus: InfluxdbStatus.Error
      });
    }
    store.setState({
      influxdbUrl,
      influxdbBucket,
      influxdbToken,
      influxdbOrg
    });
  }
});

export default actions;
