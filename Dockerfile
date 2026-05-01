FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm install --workspaces --include-workspace-root

COPY shared shared
COPY server server
COPY client client

RUN npm run build:shared
RUN npm run build:server
RUN npm run build:client

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=2567
ENV CLIENT_DIR=/app/client/dist

COPY --from=build /app/package.json ./
COPY --from=build /app/shared/package.json shared/
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/server/package.json server/
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/shared/node_modules shared/node_modules
COPY --from=build /app/server/node_modules server/node_modules

EXPOSE 2567
CMD ["node", "server/dist/index.js"]
