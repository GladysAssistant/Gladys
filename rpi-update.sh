#!/bin/bash
set -e
if [ "$#" -ne 1 ]; then
	echo "###############################################"
    echo "You must provide the URL of the new archive to download."
    echo "Example : ./rpi-update.sh http://url-of-the-file.tar.gz"
    echo "Exiting. "
    exit 1
fi

# URL of the new archive
URL=$1
DESTINATION_FILE="/usr/local/lib/node_modules/gladys-maj.tar.gz"
GLADYS_FOLDER="/usr/local/lib/node_modules/gladys"
GLADYS_TMP_PARENT_FOLDER="/usr/local/lib/node_modules/gladysupdate"
GLADYS_TMP_FOLDER="/usr/local/lib/node_modules/gladysupdate/gladys"
HOOK_FOLDER="/usr/local/lib/node_modules/gladys/api/hooks"
TMP_API_FOLDER="/usr/local/lib/node_modules/gladysupdate/gladys/api"
CACHE_FOLDER="/usr/local/lib/node_modules/gladys/cache/*"
TMP_CACHE_FOLDER="/usr/local/lib/node_modules/gladysupdate/gladys/cache"
INIT_SCRIPT="/usr/local/lib/node_modules/gladys/init.js"

# First we download the new file
wget URL -O $DESTINATION_FILE

# Cleaning Gladys update folder
rm -rf $GLADYS_TMP_PARENT_FOLDER

# Then, we create the folder where new gladys will be located
mkdir $GLADYS_TMP_PARENT_FOLDER

# Then, we extract the file
tar zxvf $DESTINATION_FILE -C $GLADYS_TMP_PARENT_FOLDER

# We delete the file
rm $DESTINATION_FILE


# if the hook folder exist
if [[ -d "$HOOK_FOLDER" ]]; then
    
    # We copy the hooks repository of the old folder
    cp -r $HOOK_FOLDER $TMP_API_FOLDER
fi

# if the cache folder exist
if [[ -d "$CACHE_FOLDER" ]]; then
    
    # We copy the cache folder of the old gladys
    cp -r $CACHE_FOLDER $TMP_CACHE_FOLDER
fi

# stopping gladys (silent is in case gladys is not running)
# silent remove any errors cause by PM2
pm2 stop --silent gladys

# delete old gladys folder
rm -rf "$GLADYS_FOLDER"

# rename new gladys folder 
mv "$GLADYS_TMP_FOLDER" "$GLADYS_FOLDER"

# Delete temp parent folder
rm -rf $GLADYS_TMP_PARENT_FOLDER

# start init script
node $INIT_SCRIPT

# restart gladys
pm2 start gladys