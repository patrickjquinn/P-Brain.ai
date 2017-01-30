FROM node:6.9.3

COPY package.json /home/app/
WORKDIR /home/app

RUN npm install
