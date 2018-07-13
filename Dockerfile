FROM node:8-alpine

# Add tzdata for timezone settings
RUN apk add --no-cache tzdata

# Create src folder
RUN mkdir /src

WORKDIR /src
ADD . /src
RUN npm install

RUN npm install -g grunt-cli
RUN grunt buildProd

# Export listening port
EXPOSE 8080

CMD ["node" ,"app.js"]