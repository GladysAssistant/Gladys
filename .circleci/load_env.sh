#!/bin/sh

echo 'export IMAGE_ID="${DOCKERHUB_REPO}:${VERSION}-${TAG}"' >>$BASH_ENV
echo 'export DIR=`pwd`' >>$BASH_ENV
echo 'export QEMU_VERSION="v5.1.0-5"' >>$BASH_ENV

. $BASH_ENV