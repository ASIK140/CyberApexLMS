FROM ghcr.io/puppeteer/puppeteer:22.0.0

WORKDIR /app

USER root

COPY package.json ./
RUN npm install

COPY . .

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

EXPOSE 7000

CMD ["node", "index.js"]
