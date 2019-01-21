FROM node:10.11
MAINTAINER jonathan.soeder@gmail.com
EXPOSE 8080
WORKDIR /app
RUN mkdir -p /app/node_modules /app
COPY package.json /app/package.json
RUN yarn --ignore-scripts
COPY . /app
ENV SERVICE_ACCOUNT_DATA {}
RUN mkdir -p secrets
RUN echo $SERVICE_ACCOUNT_DATA > secrets/serviceAccount.json
RUN yarn build
CMD yarn start
