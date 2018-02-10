FROM node:carbon

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