#!/bin/bash

# PURPOSE: this script can be used to overwrite an upstream "publish" branch
# of a specified git repo with a new historyless (orphan) commit containing
# a bunch of files copied from some location in the local filesystem.
#
# BEWARE: this script will delete the previous publish branch from the
# upstream repo!
#
# BEWARE: this script creates a commit that doesn't share history with
# any existing commit in the upstream repo!
#
# Note: this process makes some kind of sense when using a github
# gh-pages branch to deploy a static website.

set -o errexit -o pipefail

if [[ -z "${UPSTREAM_REPO}" ]]; then
    >&2 echo "UPSTREAM_REPO not set. Set it to something like git@github.com:octocat/example.git"
    exit 1
fi

if [[ -z "${UPSTREAM_PUBLISH_BRANCH_TO_OVERWRITE}" ]]; then
    >&2 echo "UPSTREAM_PUBLISH_BRANCH_TO_OVERWRITE not set."
    exit 1
fi

if [[ -z "${LOCAL_SCRATCH_BRANCH}" ]]; then
    >&2 echo "LOCAL_SCRATCH_BRANCH not set"
    exit 1
fi

if [[ -z "${LOCAL_DIST_PATH}" ]]; then
    >&2 echo "LOCAL_DIST_PATH not set"
    exit 1
fi

WORK_DIR=$(mktemp -d)
if [[ ! "$WORK_DIR" || ! -d "$WORK_DIR" ]]; then
  >&2 echo "Could not create temporary work dir"
  exit 1
fi
function cleanup {      
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

pushd "$WORK_DIR"
# n.b. we cannot shallow-clone as that breaks --force-with-lease
git clone --no-checkout "${UPSTREAM_REPO}" repo
cd repo/
git checkout --orphan "${LOCAL_SCRATCH_BRANCH}"
git reset .
git clean -fdx
cp -r "${LOCAL_DIST_PATH}"/* .
git add --all
git commit -m "deploy $(date --utc --rfc-3339=seconds)"
# *destructively overwrite the remote dest branch with our local source branch*
git push origin --force-with-lease "${LOCAL_SCRATCH_BRANCH}":"${UPSTREAM_PUBLISH_BRANCH_TO_OVERWRITE}"
popd
