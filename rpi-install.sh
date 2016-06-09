#!/bin/bash

###########################################################
# Gladys Project
# http://gladysproject.com
# Software under licence Creative Commons 3.0 France 
# http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
# You may not use this software for commercial purposes.
# @author :: Pierre-Gilles Leymarie
#
###########################################################


# This install files is for  simplifying the installation of Gladys
# on a Raspberry Pi
# Make sure your firmware version is up to date,
# You can upgrade with the command "sudo rpi-update"



# Update & upgrade package
echo "apt-get install and apt-get upgrade" 
sudo apt-get update && sudo apt-get -y upgrade

# Installing building tools
sudo apt-get install -y build-essential

# Installing Node.js
echo "Installing Node.js"
wget https://nodejs.org/dist/v4.4.2/node-v4.4.2-linux-armv6l.tar.xz
tar -xvf node-v4.4.2-linux-armv6l.tar.xz
cd node-v4.4.2-linux-armv6l
sudo cp -R * /usr/local/

# Install MySQL
echo "Installing MySQL"
sudo apt-get install -y mysql-server


# Creating database gladys
echo "Creating MySQL DB"
mysql -u root -proot -e "create database gladys"

# Dependencies
sudo apt-get install -y libasound2-dev

# NPM global modules
sudo npm install -g pm2

# Installing Gladys - One line ! :)
sudo npm install -g gladys

# Init script of Gladys
cd /usr/local/lib/node_modules/gladys/
node init.js

# Starting Gladys at startup
pm2 startup
pm2 start /usr/local/lib/node_modules/gladys/app.js --name gladys
pm2 save
