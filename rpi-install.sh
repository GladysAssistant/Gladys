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
# on a Raspberry Pi.
# Make sure your firmware version is up to date,
# You can upgrade with the command "sudo rpi-update"


# Update & upgrade package
sudo apt-get update && sudo apt-get -y upgrade

# Installing building tools
sudo apt-get install -y build-essential

# Installing Node.js
#sudo curl -sL https://deb.nodesource.com/setup | sudo bash - 
#sudo apt-get install -y nodejs

wget http://node-arm.herokuapp.com/node_0.10.36_armhf.deb
sudo dpkg -i node_0.10.36_armhf.deb

# Installing MySQL
# Prevent MySQL for asking a password, set Password to "root"
echo "mysql-server mysql-server/root_password root" | debconf-set-selections
echo "mysql-server mysql-server/root_password_again root" | debconf-set-selection
# Install MySQL
sudo apt-get install -y mysql-server

# Dependencies
sudo apt-get install -y libasound2-dev

# NPM global modules
sudo npm install -g node-gyp
sudo npm install -g sails
sudo npm install -g forever


#Cloning Gladys into "gladys" directory
git clone https://github.com/GladysProject/Gladys.git gladys
cd gladys

# Installing dependencies
sudo npm install

