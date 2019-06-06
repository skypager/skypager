FROM node:10.11
EXPOSE 5000
WORKDIR /
RUN export PATH="/node_modules/.bin:$PATH"
COPY package.json /
RUN yarn