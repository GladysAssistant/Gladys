#!/bin/sh

set -eu

export IMAGE_ID="${REGISTRY}/${IMAGE}:${VERSION}-${TAG}"

if [ "$CIRCLE_BRANCH" = 'docker-build' ]; then
  export IMAGE_ID="${REGISTRY}/${IMAGE}:latest-${TAG}"
fi

# ============
# <qemu-support>
if [ $QEMU_ARCH == 'amd64' ]; then
  touch qemu-amd64-static
else
  curl -L "https://github.com/multiarch/qemu-user-static/releases/download/${QEMU_VERSION}/qemu-${QEMU_ARCH}-static.tar.gz" | tar xz
  docker run --rm --privileged multiarch/qemu-user-static:register --reset
fi
# </qemu-support>
# ============

# Replace the repo's Dockerfile with our own.
docker build -f ./docker/Dockerfile \
  -t ${IMAGE_ID} \
  --build-arg target=$TARGET \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VERSION=$VERSION \
  .

# Login to Docker Hub.
echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin

# Push push push
docker push ${IMAGE_ID}
if [ "$CIRCLE_BRANCH" = 'docker-build' ]; then
  docker tag "${IMAGE_ID}" "${REGISTRY}/${IMAGE}:latest-${TAG}"
  docker push "${REGISTRY}/${IMAGE}:latest-${TAG}"
fi
