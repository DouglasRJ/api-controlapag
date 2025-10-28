FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY tsconfig.build.json ./tsconfig.build.json
COPY nest-cli.json ./nest-cli.json

RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY --from=builder /usr/src/app/src ./src

COPY --from=builder /usr/src/app/tsconfig.json ./tsconfig.json
COPY --from=builder /usr/src/app/tsconfig.build.json ./tsconfig.build.json
COPY --from=builder /usr/src/app/nest-cli.json ./nest-cli.json

COPY --from=builder /usr/src/app/dist ./dist

COPY entrypoint.sh .

RUN chmod +x ./entrypoint.sh

EXPOSE 3000
ENV PORT 3000

CMD ["./entrypoint.sh"]