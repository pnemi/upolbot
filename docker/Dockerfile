FROM node:12

RUN curl -o- -L https://yarnpkg.com/install.sh | bash

COPY package.json /
COPY yarn.lock /

RUN yarn install --pure-lockfile

COPY . /

RUN chmod +x /docker/wait-for-postgres.sh

RUN apt-get update && apt-get install -y netcat

EXPOSE 1798