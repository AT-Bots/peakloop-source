# AT Media build of Postiz (AGPL-3.0). Build context: the repo root.
# Same steps as the official Dockerfile.dev of postiz-app, plus one patch step (whitelabel.mjs).
# The Postiz LICENSE stays in the image at /app/LICENSE.
FROM node:22.23.4-bookworm-slim
ARG POSTIZ_VERSION=v2.25.3
ENV NEXT_PUBLIC_VERSION=$POSTIZ_VERSION
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ make python3-pip bash nginx git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN addgroup --system www \
 && adduser --system --ingroup www --home /www --shell /usr/sbin/nologin www \
 && mkdir -p /www \
 && chown -R www:www /www /var/lib/nginx

RUN npm --no-update-notifier --no-fund --global install pnpm@10.6.1 pm2

RUN git clone --depth 1 --branch "$POSTIZ_VERSION" https://github.com/gitroomhq/postiz-app.git /app \
 && cp /app/var/docker/nginx.conf /etc/nginx/nginx.conf
WORKDIR /app
RUN pnpm install

# The patch comes after "pnpm install", so a brand change does not download the packages again.
ARG BRAND_NAME="AT Media Scheduler"
ARG BRAND_TAGLINE="AI-Powered Content. Human Impact."
ARG SOURCE_URL="https://github.com/AT-Bots/peakloop-source"
ARG TERMS_URL="https://atmediaglobal.com/terms"
ARG PRIVACY_URL="https://atmediaglobal.com/privacy"
COPY branding /brand
COPY deploy/postiz/whitelabel.mjs /brand/whitelabel.mjs
RUN BRAND_NAME="$BRAND_NAME" BRAND_TAGLINE="$BRAND_TAGLINE" SOURCE_URL="$SOURCE_URL" TERMS_URL="$TERMS_URL" PRIVACY_URL="$PRIVACY_URL" node /brand/whitelabel.mjs /app /brand

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

CMD ["sh", "-c", "nginx && pnpm run pm2"]
