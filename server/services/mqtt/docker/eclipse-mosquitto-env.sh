#!/bin/sh

# Configuration path
mosquitto_dir=/var/lib/gladysassistant/mosquitto
# Configuration file
mosquitto_config_file=${mosquitto_dir}/mosquitto.conf
# Password file
mosquitto_passwd_file=${mosquitto_dir}/mosquitto.passwd
internal_mosquitto_passwd_file=/mosquitto/config/mosquitto.passwd

# Create configuration path (if not exists)
mkdir -p $mosquitto_dir

# Check if config file not already exists
if [ ! -f "$mosquitto_config_file" ]; then
  echo "Writting default eclipse-mosquitto configuration..."

  # Create config file
  touch $mosquitto_config_file

  # Write defaults
  echo "allow_anonymous false" >> $mosquitto_config_file
  echo "connection_messages false" >> $mosquitto_config_file
  echo "password_file ${internal_mosquitto_passwd_file}" >> $mosquitto_config_file

  echo "Default eclipse-mosquitto configuration written"
else
  echo "eclipse-mosquitto configuration file already exists."
fi

# Create passwd file if not exists
touch ${mosquitto_passwd_file}
