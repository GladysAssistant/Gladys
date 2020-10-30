#!/bin/sh

set -e

echo "DockerHub Registry: $DOCKERHUB_REPO"
echo "Docker ImageID: $IMAGE_ID"
echo "Building Target: $TARGET"
echo "QEMU Arch: $QEMU_ARCH"
echo "QEMU Version: $QEMU_VERSION"
echo "Tag used: $VERSION"

# Download QEMU for cross platform build
if [ $QEMU_ARCH == 'amd64' ]; then
  touch qemu-amd64-static
else
  curl -L "https://github.com/multiarch/qemu-user-static/releases/download/${QEMU_VERSION}/qemu-${QEMU_ARCH}-static.tar.gz" | tar xz
  docker run --rm --privileged multiarch/qemu-user-static:register --reset
fi

# Login to Docker Hub before pulling
echo $DOCKERHUB_PASS | docker login -u $DOCKERHUB_USER --password-stdin

# Build docker image
docker build -f ./docker/Dockerfile \
  -t ${IMAGE_ID} \
  --build-arg TARGET=$TARGET \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --build-arg VERSION=$VERSION \
  .
# Tag docker image
if [ -n "$MAJOR_VERSION" ]; then
  docker tag ${IMAGE_ID} ${DOCKERHUB_REPO}:${MAJOR_VERSION}-${TAG}
  docker tag ${IMAGE_ID} ${DOCKERHUB_REPO}:latest-${TAG}
  docker push ${DOCKERHUB_REPO}:${MAJOR_VERSION}-${TAG}
  docker push ${DOCKERHUB_REPO}:latest-${TAG}
fi

# Push docker image
docker push ${IMAGE_ID}
