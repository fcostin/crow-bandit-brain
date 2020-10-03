#!/usr/bin/env bash

set -o errexit -o pipefail

# n.b. setting user is necessary otherwise files
# written by the container are owned by root.
# n.b. setting npm_config_cache is necessary otherwise
# when running as non-root user the container isn't
# able to write to its default npm cache location.

docker run \
	-u "$(id -u $USER):$(id -g $USER)" \
	-e npm_config_cache=/work/.npm_cache \
	--mount type=bind,source="$(pwd)",target="/work" \
	--rm -it \
	npm -- \
	$*
