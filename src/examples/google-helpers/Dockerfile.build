FROM node:10.11
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
WORKDIR /app
RUN mkdir -p /app/node_modules /app
COPY deployment.package.json /app/package.json
RUN yarn install --ignore-scripts
COPY lib/ /app/lib/
COPY endpoints/ /app/endpoints/
COPY scripts/ /app/scripts/
COPY docs/ /app/docs/
COPY start.js /app/start.js
COPY .gitignore /app/.gitignore

RUN git init .
RUN git config --global user.name "skypager deployment"
RUN git config --global user.email "jon@chicago.com"
RUN git add -A
RUN git commit -m "initial commit needed to make git ls-files indexing work"

CMD yarn start
