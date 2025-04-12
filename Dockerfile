FROM node:23.9-alpine3.21 AS base
ENV PNPM_VERSION=10.5.2
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" PNPM_VERSION=$PNPM_VERSION sh -
WORKDIR /app
EXPOSE 3000

FROM base AS dev
CMD pnpm i --frozen-lockfile && pnpm run dev

FROM base AS dev-test
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i --frozen-lockfile
CMD pnpm run test

FROM base AS test
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i --frozen-lockfile
COPY . .
CMD pnpm run test run

FROM base AS migration
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i --frozen-lockfile
COPY . .
CMD pnpm run migrate

FROM base AS prod-build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i --frozen-lockfile
COPY . .
RUN pnpm run build

FROM base AS prod
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i --prod --frozen-lockfile
COPY --from=prod-build /app/dist /app/dist
CMD node --enable-source-maps ./dist/index.js
