Debade Trigger
============

```bash
npm install -g debade-trigger
debade-trigger -c <path/to/debade/config.yml>
```

## Run By Docker
```bash
touch /data/etc/debade/trigger.yml
docker run --name debade-trigger -d -v /data/etc/debade:/etc/debade genee/debade-trigger
```