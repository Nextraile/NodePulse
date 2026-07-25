#===========
# BASE IMAGE
#===========

FROM node:24-alpine AS base

WORKDIR /home/node/app

#==================
# DEVELOPMENT IMAGE
#==================

FROM base AS development

ENV NODE_ENV=development

COPY package*.json tsconfig.json ./

RUN npm ci --include=dev --omit=prod

USER node

# 9229 is for debugging, 3000 for the app, and 4000 for the TCP server
EXPOSE 3000 4000 9229

CMD ["npm", "run", "dev"]

#==============
# BUILDER IMAGE
#==============

FROM base AS builder

COPY package*.json tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

#=================
# PRODUCTION IMAGE
#=================

FROM base AS production

ENV NODE_ENV=production

USER node

COPY --from=builder --chown=node:node /home/node/app/dist ./dist
COPY --from=builder --chown=node:node /home/node/app/package*.json ./

# 3000 for the app, and 4000 for the TCP server
EXPOSE 3000 4000

CMD ["npm", "run", "start"]