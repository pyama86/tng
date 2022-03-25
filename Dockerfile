FROM node:17-alpine3.14
COPY package*.json ./

RUN addgroup -S tng && adduser -S tng -G tng
RUN mkdir -p /app && chown -R tng /app
WORKDIR /app
RUN npm install
EXPOSE 3000
COPY --chown=tng:tng . .
USER tng
CMD [ "npm", "start" ]
