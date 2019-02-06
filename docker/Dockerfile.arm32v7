FROM arm32v7/node:lts-stretch

COPY ./docker_tmp/qemu-arm-static /usr/bin/

RUN apt-get update && apt-get install -y tzdata

RUN mkdir /src
WORKDIR /src
ADD . /src

RUN apt-get update && apt-get install -y make gcc g++ python git && \
    yarn install --production && \
    yarn global add grunt-cli && \
    grunt buildProd && \
    yarn global remove grunt-cli && \
    apt-get remove -y make gcc g++ python git && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8080

CMD ["node" ,"app.js"]
