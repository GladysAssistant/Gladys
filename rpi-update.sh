#!/bin/bash

GLADYS_TOP_FOLDER="/home/pi/gladys"
GLADYS_FOLDER="/home/pi/gladys/node_modules/gladys"
HOOK_FOLDER="$GLADYS_FOLDER/api/hooks"
CACHE_FOLDER="$GLADYS_FOLDER/cache/*"
TMP_HOOK_FOLDER="/tmp/gladys_hooks"
TMP_CACHE_FOLDER="/tmp/gladys_cache"
INIT_SCRIPT="$GLADYS_FOLDER/init.js"

# Cleaning Gladys hook folder
rm -rf $TMP_HOOK_FOLDER

# Cleaning Gladys cache folder
rm -rf $TMP_CACHE_FOLDER

# Then, we create the temp hook folder
mkdir $TMP_HOOK_FOLDER

# Then, we create the temp hook folder
mkdir $TMP_CACHE_FOLDER

# if the hook folder exist
if [[ -d "$HOOK_FOLDER" ]]; then
    
    # We copy the hooks repository of the old folder
    cp -r $HOOK_FOLDER $TMP_HOOK_FOLDER
fi

# if the cache folder exist
if [[ -d "$CACHE_FOLDER" ]]; then
    
    # We copy the cache folder of the old gladys
    cp -r $CACHE_FOLDER $TMP_CACHE_FOLDER
fi

# stopping gladys (silent is in case gladys is not running)
# silent remove any errors cause by PM2
#sudo pm2 stop --silent gladys

cd $GLADYS_TOP_FOLDER

npm update gladys

# start init script
node $INIT_SCRIPT

# go to gladys folder
cd $GLADYS_FOLDER

#BuildProd 
grunt buildProd

# restart gladys
sudo pm2 start gladys