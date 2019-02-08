#!/bin/bash
#
# Description: Script to build multiarch Docker Gladys images with Travis

set -e
set -o pipefail

# Branch check
if [[ $TRAVIS_TAG != $TRAVIS_BRANCH && $TRAVIS_BRANCH != master ]] ; then
	echo "No need to build docker images, exiting..."
	exit
fi

# Functions
getAnnotateFlags() {
	case $1 in
      amd64) flags="" ;;
      arm32v[5-6]) flags="--os linux --arch arm" ;;
      arm32v7) flags="--os linux --arch arm --variant armv7" ;;
    esac
	echo $flags
}
fold_start() {
  echo -e "travis_fold:start:$1\033[33;1m$2\033[0m"
}
fold_end() {
  echo -e "\ntravis_fold:end:$1\r"
}


# Variables
export ARCHS=(amd64 arm32v6 arm32v7)
export QEMU_ARCHS=(arm x86_64)

# Updating docker
fold_start docker.1 "Docker-ce update"
echo "Updating docker ..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) edge"
sudo apt-get update
sudo apt-get -y install docker-ce
sudo service docker restart
docker --version
fold_end docker.1

# Download qemu static for all $QEMU_ARCHS
fold_start qemu.1 "QEMU Download & regiser"
echo "Download qemu static for all ${QEMU_ARCHS}"
for target_arch in "${QEMU_ARCHS[@]}" ; do
  wget -N https://github.com/multiarch/qemu-user-static/releases/download/v2.9.1-1/x86_64_qemu-${target_arch}-static.tar.gz -P ./docker_tmp
  cd ./docker_tmp && tar -xvf ./x86_64_qemu-${target_arch}-static.tar.gz && cd -
done
docker run --rm --privileged multiarch/qemu-user-static:register --reset
fold_end qemu.1

echo "$DOCKER_PASSWORD" | docker login -u="$DOCKER_USERNAME" --password-stdin

#### Master build
if [[ $TRAVIS_BRANCH = master ]]; then
  for docker_arch in "${ARCHS[@]}"; do
    fold_start buildlatest.${docker_arch} "Build $docker_arch docker image"
    docker build -f ./docker/Dockerfile.${docker_arch} -t $DOCKER_REPO_SLUG:${docker_arch}-latest .
    docker push $DOCKER_REPO_SLUG:${docker_arch}-latest
    arch_images="${arch_images} $DOCKER_REPO_SLUG:${docker_arch}-latest"
	fold_end buildlatest.${docker_arch}
  done
  fold_start manifestlatest.1 "Creating manifest for latest images"
  echo "==> docker manifest create --amend ${DOCKER_REPO_SLUG}:latest ${arch_images}"
  docker manifest create --amend ${DOCKER_REPO_SLUG}:latest ${arch_images}
  for docker_arch in "${ARCHS[@]}"; do
    annotate_flags=$(getAnnotateFlags ${docker_arch})
	echo "==> Annotate manifest ${docker_arch}-latest ${annotate_flags}"
    docker manifest annotate ${DOCKER_REPO_SLUG}:latest ${DOCKER_REPO_SLUG}:${docker_arch}-latest ${annotate_flags}
  done
  echo "==> Push the manifest"
  docker manifest push ${DOCKER_REPO_SLUG}:latest
  fold_end manifestlatest.1
  exit
fi

#### Release build
if [[ $TRAVIS_TAG = $TRAVIS_BRANCH ]]; then
  for docker_arch in "${ARCHS[@]}"; do
	fold_start buildrelease.${docker_arch} "Build $docker_arch docker image"
    docker build -f ./docker/Dockerfile.${docker_arch} -t $DOCKER_REPO_SLUG:${docker_arch}-${MAJOR_VERSION} .
    docker push ${DOCKER_REPO_SLUG}:${docker_arch}-${MAJOR_VERSION}
    arch_images_majorversion="${arch_images_majorversion} $DOCKER_REPO_SLUG:${docker_arch}-${MAJOR_VERSION}"
    docker tag ${DOCKER_REPO_SLUG}:${docker_arch}-${MAJOR_VERSION} ${DOCKER_REPO_SLUG}:${docker_arch}-${TRAVIS_TAG}
	docker push ${DOCKER_REPO_SLUG}:${docker_arch}-${TRAVIS_TAG}
    arch_images_version="${arch_images_version} $DOCKER_REPO_SLUG:${docker_arch}-${TRAVIS_TAG}"
	fold_end buildrelease.${docker_arch}
  done
  fold_start manifestrelease.1 "Creating manifest for $TRAVIS_TAG images"
  echo "==> docker manifest create --amend ${DOCKER_REPO_SLUG}:${MAJOR_VERSION} ${arch_images_majorversion}"
  docker manifest create --amend ${DOCKER_REPO_SLUG}:${MAJOR_VERSION} ${arch_images_majorversion}
  for docker_arch in "${ARCHS[@]}"; do
    annotate_flags=$(getAnnotateFlags ${docker_arch})
	echo "==> Annotate manifest ${docker_arch}-${MAJOR_VERSION} ${annotate_flags}"
    docker manifest annotate ${DOCKER_REPO_SLUG}:${MAJOR_VERSION} ${DOCKER_REPO_SLUG}:${docker_arch}-${MAJOR_VERSION} ${annotate_flags}
  done
  echo "==> Push the manifest"
  docker manifest push ${DOCKER_REPO_SLUG}:${MAJOR_VERSION}
  echo "==> docker manifest create --amend ${DOCKER_REPO_SLUG}:${TRAVIS_TAG} ${arch_images_version}"
  docker manifest create --amend ${DOCKER_REPO_SLUG}:${TRAVIS_TAG} ${arch_images_version}
  for docker_arch in "${ARCHS[@]}"; do
    annotate_flags=$(getAnnotateFlags ${docker_arch})
	echo "==> Annotate manifest ${docker_arch}-${TRAVIS_TAG} ${annotate_flags}"
    docker manifest annotate ${DOCKER_REPO_SLUG}:${TRAVIS_TAG} ${DOCKER_REPO_SLUG}:${docker_arch}-${TRAVIS_TAG} ${annotate_flags}
  done
  echo "==> Push the manifest"
  docker manifest push ${DOCKER_REPO_SLUG}:${TRAVIS_TAG}
  fold_end manifestrelease.1
  exit
fi
