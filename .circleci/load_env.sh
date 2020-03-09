#!/bin/sh

echo 'export GITHUB_REPO=vonox/Gladys' >>$BASH_ENV
echo 'export IMAGE=gladys' >>$BASH_ENV
echo 'export REGISTRY=vonox' >>$BASH_ENV

echo 'export VERSION=${CIRCLE_TAG}' >>$BASH_ENV
echo 'export IMAGE_ID="${REGISTRY}/${IMAGE}:${VERSION}-${TAG}"' >>$BASH_ENV
echo 'export DIR=`pwd`' >>$BASH_ENV
echo 'export QEMU_VERSION="v4.2.0-2"' >>$BASH_ENV

. $BASH_ENV