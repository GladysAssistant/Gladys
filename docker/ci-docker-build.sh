#!/bin/bash
#### Description: Script to build multiarch Docker Gladys images with Travis

set -e
set -o pipefail

# Function
getAnnotateFlags() {
	case $1 in
      amd64) flags="" ;;
      arm32v[5-6]) flags="--os linux --arch arm" ;;
      arm32v7) flags="--os linux --arch arm --variant armv7" ;;
    esac
	echo $flags
}
# Arrays for loop
export ARCHS=(amd64 arm32v6 arm32v7)
export QEMU_ARCHS=(arm x86_64)


# Updating docker
echo "Updating docker ..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) edge"
sudo apt-get update
sudo apt-get -y install docker-ce
sudo service docker restart
docker --version

# Download qemu static for all $QEMU_ARCHS
echo "Download qemu static for all ${QEMU_ARCHS}"
for target_arch in "${QEMU_ARCHS[@]}" ; do
  wget -N https://github.com/multiarch/qemu-user-static/releases/download/v2.9.1-1/x86_64_qemu-${target_arch}-static.tar.gz -P ./docker_tmp
  cd ./docker_tmp && tar -xvf ./x86_64_qemu-${target_arch}-static.tar.gz && cd -
done

docker run --rm --privileged multiarch/qemu-user-static:register --reset
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD"


#### Master build
if [[ $TRAVIS_BRANCH = master ]]; then
  for docker_arch in "${ARCHS[@]}"; do
    docker build -f ./docker/Dockerfile.${docker_arch} -t $DOCKER_REPO_SLUG:${docker_arch}-latest .
    docker push $DOCKER_REPO_SLUG:${docker_arch}-latest
    arch_images="${arch_images} $DOCKER_REPO_SLUG:${docker_arch}-latest"
  done
  echo "==> docker manifest create --amend ${DOCKER_REPO_SLUG}:latest ${arch_images}"
  docker manifest create --amend ${DOCKER_REPO_SLUG}:latest ${arch_images}
  for docker_arch in "${ARCHS[@]}"; do
    annotate_flags=$(getAnnotateFlags ${docker_arch})
	echo "==> Annotate manifest ${docker_arch}-latest ${annotate_flags}"
    docker manifest annotate ${DOCKER_REPO_SLUG}:latest ${DOCKER_REPO_SLUG}:${docker_arch}-latest ${annotate_flags}
  done
  echo "==> Push the manifest"
  docker manifest push ${DOCKER_REPO_SLUG}:latest
  exit
fi

#### Release build
if [[ $TRAVIS_TAG = $TRAVIS_BRANCH ]]; then
  for docker_arch in "${ARCHS[@]}"; do
    docker build -f ./docker/Dockerfile.${docker_arch} -t $DOCKER_REPO_SLUG:${docker_arch}-${MAJOR_VERSION} .
    docker push ${DOCKER_REPO_SLUG}:${docker_arch}-${MAJOR_VERSION}
    arch_images_majorversion="${arch_images_majorversion} $DOCKER_REPO_SLUG:${docker_arch}-${MAJOR_VERSION}"
    docker tag ${DOCKER_REPO_SLUG}:${docker_arch}-${MAJOR_VERSION} ${DOCKER_REPO_SLUG}:${docker_arch}-${TRAVIS_TAG}
	docker push ${DOCKER_REPO_SLUG}:${docker_arch}-${TRAVIS_TAG}
    arch_images_version="${arch_images_version} $DOCKER_REPO_SLUG:${docker_arch}-${TRAVIS_TAG}"
  done
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
  exit
fi
