FROM alpine:3.3

ADD . /app
RUN apk add --no-cache nodejs && cd /app && npm install \
    && mkdir -p /etc/debade && cp config/debade.sample.yml /etc/debade/trigger.yml

WORKDIR /app
CMD ["/usr/bin/node", "/app/index.js", "-c", "/etc/debade/trigger.yml"]