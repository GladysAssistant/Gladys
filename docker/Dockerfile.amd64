FROM amd64/node:lts-alpine

COPY ./docker_tmp/qemu-x86_64-static /usr/bin/

RUN apk add --no-cache tzdata nmap openzwave-libs

RUN mkdir /src
WORKDIR /src
ADD . /src

RUN apk add --no-cache --virtual .build-deps make gcc g++ python git && \
    yarn install --production && \
    yarn global add grunt-cli && \
    grunt buildProd && \
    yarn global remove grunt-cli &&\
    apk del .build-deps

EXPOSE 8080

CMD ["node" ,"app.js"]
