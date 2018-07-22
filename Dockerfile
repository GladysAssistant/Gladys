FROM node:8-alpine

# Add tzdata for timezone settings and build deps
RUN apk --no-cache add --virtual builds-deps build-base python tzdata

# Create src folder
RUN mkdir /src

WORKDIR /src
ADD . /src
RUN npm install

RUN npm install -g grunt-cli
RUN grunt buildProd

# Remove build deps
RUN apk del builds-deps

# Export listening port
EXPOSE 8080

CMD ["node" ,"app.js"]