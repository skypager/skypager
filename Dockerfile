FROM node:10.11
EXPOSE 8080
WORKDIR /app
RUN mkdir -p /app/node_modules /app
COPY package.json /app/package.json
RUN yarn --ignore-scripts
COPY . /app
RUN yarn
ENV SERVICE_ACCOUNT_DATA '{}'
ENV APP portfolio-browser
RUN yarn build $APP
CMD yarn start $APP --port 8080 --static
