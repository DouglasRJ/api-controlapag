FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN npm prune --production

FROM node:18-alpine

RUN apk add --no-cache curl jq aws-cli

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

ENV PROJECT_NAME=""
ENV AWS_REGION=""

EXPOSE 3000

CMD ["./entrypoint.sh"]