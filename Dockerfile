FROM node:17-alpine3.14
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install
EXPOSE 3000
RUN addgroup -S tng && adduser -S tng -G tng
COPY --chown=tng:tng . .
USER tng
CMD [ "npm", "start" ]
