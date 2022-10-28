#!/bin/sh

# Base path
base_path_container=$1

# Configuration path
mosquitto_dir=${base_path_container}/mosquitto/config
# Configuration file
mosquitto_config_file=${mosquitto_dir}/mosquitto.conf
# Password file
mosquitto_passwd_file=${mosquitto_dir}/mosquitto.passwd
internal_mosquitto_passwd_file=/mosquitto/config/mosquitto.passwd

# Create configuration path (if not exists)
mkdir -p $mosquitto_dir

# Check if config file not already exists
if [ ! -f "$mosquitto_config_file" ]; then
  echo "zwave-js-ui : Writing MQTT configuration..."

  # Create config file
  touch $mosquitto_config_file

  # Write defaults
  echo "listener 1885" >> $mosquitto_config_file
  echo "allow_anonymous false" >> $mosquitto_config_file
  echo "# connection_messages false" >> $mosquitto_config_file
  echo "password_file ${internal_mosquitto_passwd_file}" >> $mosquitto_config_file

  echo "zwave-js-ui : MQTT configuration written"
else
  echo "zwave-js-ui : MQTT configuration file already exists."
fi

# Create passwd file if not exists
touch ${mosquitto_passwd_file}
