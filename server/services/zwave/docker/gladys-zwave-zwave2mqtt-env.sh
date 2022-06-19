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
    "securityKeys": {
      "S0_Legacy": "0102030405060708090A0B0C0D0E0F10",
      "S2_AccessControl": "9EF050D84EB662D3C084148B8413D780",
      "S2_Unauthenticated": "F80C363D6CF0EE8C77D5CC2DFFDB8837",
      "S2_Authenticated": "ED76271CACBF13AEEA60F95C8B8A586B"
    },
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
