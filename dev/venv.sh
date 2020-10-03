#!/usr/bin/env bash

set -o errexit -o pipefail

# n.b. setting user is necessary otherwise
# files written by the container are owned by
# root
docker run -u `id -u $USER` --mount type=bind,source="$(pwd)",target="/work" --rm -it npm -- $*
