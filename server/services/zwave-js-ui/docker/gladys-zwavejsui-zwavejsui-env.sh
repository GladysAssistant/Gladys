#!/bin/sh

# Base path
base_path_container=$1

# Configuration path
zwave_js_ui_dir=${base_path_container}/zwave-js-ui
# Configuration file
zwave_js_ui_config_file=${zwave_js_ui_dir}/settings.json

# Create configuration path (if not exists)
mkdir -p $zwave_js_ui_dir

echo "ZwaveJSUI : Writing ZwaveJSUI configuration..."

rm -f $zwave_js_ui_config_file

# Create config file
touch $zwave_js_ui_config_file
chmod o-r $zwave_js_ui_config_file

# Write defaults
cat <<EOF >>$zwave_js_ui_config_file
{
  "mqtt": {
    "name": "Gladys",
    "host": "mqtt://localhost",
    "port": 1885,
    "qos": 1,
    "prefix": "zwave-js-ui",
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
    "disclaimerVersion": 1,
    "securityKeys": {
      "S2_Unauthenticated": "$5",
      "S2_Authenticated": "$6",
      "S2_AccessControl": "$7",
      "S0_Legacy": "$8"
    }
  }
}
EOF

echo "zwave-js-ui : configuration written"
