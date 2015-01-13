Debade Agent
============

```bash
npm install -g debade-agent
debade-agent -c <path/to/debade/config.yml>
```

## Run By Docker
```bash
touch /data/etc/debade/agent.yml
docker run --name debade-agent -d -v /data/etc/debade:/etc/debade genee/debade-agent
```