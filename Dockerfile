FROM node:10.11
MAINTAINER jonathan.soeder@gmail.com
EXPOSE 8080
WORKDIR /app
RUN mkdir -p /app/node_modules /app
COPY package.json /app/package.json
RUN yarn --ignore-scripts
COPY . /app
RUN yarn
ENV SERVICE_ACCOUNT_DATA
ENV APP sheets-server
CMD yarn start $APP --port 8080 --static
