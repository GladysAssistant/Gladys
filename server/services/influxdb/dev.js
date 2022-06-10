const { InfluxDB, Point } = require('@influxdata/influxdb-client');

// You can generate a Token from the "Tokens Tab" in the UI
const token = 'nMoqt9fZW5iYphTFy3GSeJzP9HrlH7tPYM6z7GJIICX7hQTDfPSMn8DVHDDUE2CbzDe3hgHYJbusbYhZwTEAxA==';
const org = 'VonOx';
const bucket = 'gladys';

const client = new InfluxDB({ url: 'http://192.168.1.42:8086', token: token });
const writeApi = client.getWriteApi(org, bucket);
writeApi.useDefaultTags({ host: 'host1' });

const point = new Point('Name of the feature')
  .tag('device_id', 'z2m:device_id:prout')
  .tag('feature_id', 'z2m:device_id:prout:index:kilowat')
  .floatField('value', 24.0);
writeApi.writePoint(point);
writeApi
  .close()
  .then(() => {
    console.log('FINISHED');
  })
  .catch((e) => {
    console.error(e);
    console.log('\\nFinished ERROR');
  });