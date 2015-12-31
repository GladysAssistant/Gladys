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
# on a Raspberry Pi 2.
# Make sure your firmware version is up to date,
# You can upgrade with the command "sudo rpi-update"


# Update & upgrade package
sudo apt-get update && sudo apt-get -y upgrade

# Installing building tools
sudo apt-get install -y build-essential

# Installing Node.js
wget https://nodejs.org/dist/v4.2.2/node-v4.2.2-linux-armv7l.tar.xz
tar -xvf node-v4.2.2-linux-armv7l.tar.xz
cd node-v4.2.2-linux-armv7l
sudo cp -R * /usr/local/

# Install MySQL
sudo apt-get install -y mysql-server
# Creating database gladys
mysql -u root -proot -e "create database gladys"

# Dependencies
sudo apt-get install -y libasound2-dev

# NPM global modules
sudo npm install -g pm2

# Installing Gladys - One line ! :) 
# --unsafe-perm is because of node serialport module 
# which does not correctly install without unsafe perm
sudo npm install -g gladys --unsafe-perm

# Starting Gladys at startup
sudo pm2 startup
sudo pm2 start /usr/local/lib/node_modules/gladys/app.js --name gladys
sudo pm2 save