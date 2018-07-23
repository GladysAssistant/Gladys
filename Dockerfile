FROM node:8-alpine

# Add tzdata for timezone settings and build deps
RUN apk --no-cache add --virtual builds-deps build-base python tzdata

# Create src folder
RUN mkdir /src

WORKDIR /src
ADD . /src

RUN apk add --no-cache --virtual .build-deps make gcc g++ python git && \
    yarn install --production && npm install -g grunt-cli && grunt buildProd && npm uninstall -g grunt-cli \
    apk del .build-deps

# Remove build deps
RUN apk del builds-deps

# Export listening port
EXPOSE 8080

CMD ["node" ,"app.js"]