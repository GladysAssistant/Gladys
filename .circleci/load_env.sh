#!/bin/sh

echo 'export IMAGE=$(cut -d'/' -f2 <<<"${DOCKERHUB_REPO}")' >>$BASH_ENV
echo 'export REGISTRY=$(cut -d'/' -f1 <<<"${DOCKERHUB_REPO}")' >>$BASH_ENV
echo 'export IMAGE_ID="${REGISTRY}/${IMAGE}:${VERSION}-${TAG}"' >>$BASH_ENV
echo 'export DIR=`pwd`' >>$BASH_ENV
echo 'export QEMU_VERSION="v5.1.0-5"' >>$BASH_ENV

. $BASH_ENV