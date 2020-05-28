FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

COPY . .

CMD [ "npm", "start" ]