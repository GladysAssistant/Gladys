# Build image for Anthropic's OSS Scanner (https://github.com/anthropics/oss-scanner).
#
# The scanner builds this file with the repository root as the build context, then audits the resulting image with no
# network access. Everything the server, its integrations, the front build and the test suite need is therefore fetched
# here. This image is for security analysis only: it is not the production image (see docker/Dockerfile.buildx).
#
# The full (non-slim) Node image already ships git, python3 and the gcc/g++/make toolchain needed by the native modules
# (sqlite3, bcrypt, sharp, USB/serial and bluetooth integrations).
FROM node:24

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
      libudev-dev \
      libffi-dev \
      python-is-python3 \
      sqlite3 \
      openssl \
      ffmpeg \
      nmap \
    && rm -rf /var/lib/apt/lists/*

# Scanner contract: the checkout lives inside the image, at /src.
# .oss-scanner/Dockerfile.dockerignore replaces the root .dockerignore, which hides server/test from the production image.
COPY . /src

# Front: build the Preact SPA and serve it from the server, as the production image does. Cypress is a dev dependency
# for the E2E tests: skip its binary download, the scanner has no display.
WORKDIR /src/front
ENV CYPRESS_INSTALL_BINARY=0
RUN npm ci --no-audit --no-fund \
    && npm run build \
    && rm -rf /src/server/static \
    && cp -R /src/front/build /src/server/static

# Server: install every dependency, dev dependencies included (mocha, sinon, nock... for the test suite). The postinstall
# script (server/cli/install_service_dependencies.js) then installs the dependencies of each integration under
# server/services/*. One integration failing to install must not abort the whole image.
WORKDIR /src/server
ENV INSTALL_SERVICES_SILENT_FAIL=true
RUN npm ci --no-audit --no-fund

# Smoke-test the image: run the server test suite once, without letting a failing test abort the build.
# Tests run offline (HTTP calls are mocked with nock) against a throwaway SQLite/DuckDB database.
RUN (timeout 1200 npm test > /tmp/gladys-server-tests.log 2>&1 && echo "server tests passed") \
    || (tail -n 80 /tmp/gladys-server-tests.log; echo "WARNING: server tests reported failures, see /tmp/gladys-server-tests.log")

# How to run things inside the image (also described in .oss-scanner/threat_model.md):
#   cd /src/server && npm test                                # full Mocha suite (~7400 tests, about a minute)
#   cd /src/server && npm run test-service --service=<name>   # one integration, e.g. --service=mqtt
#   cd /src/server && SERVER_PORT=1443 SQLITE_FILE_PATH=/tmp/gladys.db npm run start:prod
#                                                             # run Gladys: front + API on http://localhost:1443
WORKDIR /src
