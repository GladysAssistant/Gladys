#!/bin/sh

# Configuration path
zigbee2mqtt_dir=/var/lib/gladysassistant/zigbee2mqtt/z2m
# Configuration file
zigbee2mqtt_config_file=${zigbee2mqtt_dir}/configuration.yaml

# Create configuration path (if not exists)
mkdir -p $zigbee2mqtt_dir

# Check if config file not already exists
if [ ! -f "$zigbee2mqtt_config_file" ]; then
  echo "Zigbee2mqtt : Writing configuration..."

  # Create config file
  touch $zigbee2mqtt_config_file
  chmod o-r $zigbee2mqtt_config_file

  # Write defaults

  cat <<EOF >>$zigbee2mqtt_config_file
homeassistant: false
permit_join: false
mqtt:
  base_topic: zigbee2mqtt
  server: 'mqtt://localhost:1884'
  user: $1
  password: $2
serial:
  port: /dev/ttyACM0
  # Optional: disable LED of the adapter if supported (default: false)
  disable_led: true
frontend:
  port: 8080
experimental:
  new_api: true
# Optional: networkmap options
map_options:
  graphviz:
    # Optional: Colors to be used in the graphviz network map (default: shown below)
    colors:
      fill:
        enddevice: '#fff8ce'
        coordinator: '#e04e5d'
        router: '#4ea3e0'
      font:
        coordinator: '#ffffff'
        router: '#ffffff'
        enddevice: '#000000'
      line:
        active: '#009900'
        inactive: '#994444'
EOF

  echo "Zigbee2mqtt : configuration written"
else
  echo "Zigbee2mqtt : configuration file already exists."
fi
