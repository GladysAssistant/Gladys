ARG target

FROM $target/node:12-alpine

LABEL \
  org.label-schema.build-date=$BUILD_DATE \
  org.label-schema.version=$VERSION

COPY qemu-* /usr/bin/

# System dependencies
RUN apk add --no-cache tzdata nmap openzwave-dev openzwave-libs ffmpeg sqlite openssl gzip

RUN mkdir /src
WORKDIR /src
ADD . /src
COPY ./static /src/server/static
WORKDIR /src/server

RUN apk add --no-cache --virtual .build-deps make gcc g++ python git libffi-dev linux-headers udev \
    && npm install --unsafe-perm --production \
    && npm cache clean --force \
    && apk del .build-deps

ENV NODE_ENV production
ENV SERVER_PORT 80

# Export listening port
EXPOSE 80

CMD ["npm" ,"run", "start:prod"]
