#!/bin/bash

export UPSTREAM_REPO=git@github.com:fcostin/crow-bandit-brain.git
export UPSTREAM_PUBLISH_BRANCH_TO_OVERWRITE=gh-pages-234
export LOCAL_SCRATCH_BRANCH=scratch
export LOCAL_DIST_PATH=/home/rfc/projects/crow_bandit_brain/dev/dist

./deploy.sh
