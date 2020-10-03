FROM debian:buster-slim
RUN apt-get update && apt-get install --no-install-recommends -y \
	npm \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR work
ENTRYPOINT ["/usr/bin/env"]
