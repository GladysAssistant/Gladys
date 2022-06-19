#!/bin/sh

# Base path
base_path_container=$1

# Configuration path
zwave2mqtt_dir=${base_path_container}/zwave2mqtt
# Configuration file
zwave2mqtt_config_file=${zwave2mqtt_dir}/settings.json

# Create configuration path (if not exists)
mkdir -p $zwave2mqtt_dir

echo "zwave : Writing zwave2mqtt configuration..."

# Create config file
touch $zwave2mqtt_config_file
chmod o-r $zwave2mqtt_config_file

# Write defaults

cat <<EOF >>$zwave2mqtt_config_file
{
  "mqtt": {
    "name": "Gladys",
    "host": "mqtt://localhost",
    "port": 1885,
    "qos": 1,
    "prefix": "zwave2mqtt",
    "reconnectPeriod": 10000,
    "retain": true,
    "clean": true,
    "auth": true,
    "username": "$2",
    "password": "$3"
  },
  "gateway": {
    "type": 0,
    "plugins": [],
    "authEnabled": true,
    "payloadType": 2,
    "nodeNames": true,
    "hassDiscovery": false,
    "discoveryPrefix": "homeassistant",
    "logEnabled": true,
    "logLevel": "info",
    "logToFile": true,
    "values": [],
    "sendEvents": true,
    "ignoreStatus": false,
    "ignoreLoc": true,
    "includeNodeInfo": true,
    "publishNodeDetails": false
  },
  "zwave": {
    "port": "$4",
    "commandsTimeout": 30000,
    "logLevel": "info",
    "logEnabled": true,
    "deviceConfigPriorityDir": "/usr/src/app/store/config",
    "logToFile": true,
    "serverEnabled": false,
    "serverServiceDiscoveryDisabled": false,
    "enableSoftReset": true,
    "enableStatistics": true,
    "serverPort": 3000,
    "logging": true,
    "autoUpdateConfig": true,
    "saveConfig": true,
    "assumeAwake": true,
    "pollInterval": 2000,
    "nodeFilter": [],
    "disclaimerVersion": 1
  }
}
EOF

echo "zwave : zwave2mqtt configuration written"
