#!/bin/sh

echo 'export GITHUB_REPO=gladysassistant/gladys-4-playground' >>$BASH_ENV
echo 'export IMAGE=gladys-zigbee2mqtt' >>$BASH_ENV
echo 'export REGISTRY=r6n0' >>$BASH_ENV

echo 'export VERSION=4.0.0-beta' >>$BASH_ENV
echo 'export IMAGE_ID="${REGISTRY}/${IMAGE}:${VERSION}-${TAG}"' >>$BASH_ENV
echo 'export DIR=`pwd`' >>$BASH_ENV
echo 'export QEMU_VERSION="v4.0.0"' >>$BASH_ENV

. $BASH_ENV
