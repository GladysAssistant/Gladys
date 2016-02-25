FROM node:argon

# Create src folder
RUN mkdir /src

WORKDIR /src
ADD . /src
RUN npm install

# Export listening port
EXPOSE 1337

CMD ["node" ,"app.js"]