ARG TARGET
ARG VERSION
ARG BUILD_DATE

FROM $TARGET/node:18-alpine

LABEL \
  org.label-schema.build-date=$BUILD_DATE \
  org.label-schema.version=$VERSION

COPY qemu-* /usr/bin/

# System dependencies
RUN apk add --no-cache tzdata nmap ffmpeg sqlite openssl gzip eudev

WORKDIR /tmp

# Install Bluez dependencies
RUN apk add --no-cache bluez

# Install Gladys
RUN mkdir /src
WORKDIR /src
ADD . /src
COPY ./static /src/server/static
WORKDIR /src/server
# Installer les dépendances de construction
RUN apk add --no-cache --virtual .build-deps make gcc g++ python3 git libffi-dev linux-headers

# Installer les dépendances de l'application
RUN npm ci --unsafe-perm --production || (cat /root/.npm/_logs/* && false) 

# Nettoyer le cache npm
RUN npm cache clean --force

# Supprimer les dépendances de construction
RUN apk del .build-deps

ENV NODE_ENV production
ENV SERVER_PORT 80

# Export listening port
EXPOSE 80

CMD ["node", "index.js"]
