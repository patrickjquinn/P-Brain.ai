FROM node:12-alpine

EXPOSE 4567

WORKDIR /app
COPY . /app

RUN yarn --frozen-lockfile
RUN yarn lint
RUN yarn test

RUN yarn --prod --frozen-lockfile

ENTRYPOINT [ "/usr/local/bin/node", "server.js" ]
