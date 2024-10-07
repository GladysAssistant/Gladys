ARG TARGET
ARG VERSION
ARG BUILD_DATE

FROM ${TARGET}/node:18-slim

LABEL \
  org.label-schema.build-date=$BUILD_DATE \
  org.label-schema.version=$VERSION

COPY qemu-* /usr/bin/

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
         tzdata \
         nmap \
         ffmpeg \
         sqlite3 \
         openssl \
         gzip \
         udev \
         bluez \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp

# Install Gladys
RUN mkdir /src
WORKDIR /src
ADD . /src
COPY ./static /src/server/static
WORKDIR /src/server

# Install build dependencies and application dependencies
RUN apt-get update && apt-get install -y \
         build-essential \
         python3 \
         python3-pip \
         git \
         libffi-dev \
         && npm ci --unsafe-perm --production \
         && npm cache clean --force \
         && apt-get autoremove -y build-essential python3 python3-pip git libffi-dev \
         && apt-get purge -y --auto-remove \
         && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
ENV SERVER_PORT 80

# Export listening port
EXPOSE 80

CMD ["node", "index.js"]