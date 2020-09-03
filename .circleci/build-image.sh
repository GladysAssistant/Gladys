#!/bin/sh

set -e

echo "Github Repository: $GITHUB_REPO"
echo "Image: $IMAGE"
echo "DockerHub Registry: $REGISTRY"
echo "Docker ImageID: $IMAGE_ID"
echo "Building Target: $TARGET"
echo "QEMU Arch: $QEMU_ARCH"
echo "QEMU Version: $QEMU_VERSION"
echo "Tag used: $VERSION"

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

if [ -n "$MAJOR_VERSION" ]; then
  docker tag ${IMAGE_ID} ${REGISTRY}/${IMAGE}:${MAJOR_VERSION}-${TAG}
  docker tag ${IMAGE_ID} ${REGISTRY}/${IMAGE}:latest-${TAG}
  docker push ${REGISTRY}/${IMAGE}:${MAJOR_VERSION}-${TAG}
  docker push ${REGISTRY}/${IMAGE}:latest-${TAG}
fi

# Push push push
docker push ${IMAGE_ID}
