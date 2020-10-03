dist: dist_static dist_js

dist_static:
	rsync --recursive static/ dist

dist_js:
	./venv.sh npx webpack --config webpack.config.js

publish: export UPSTREAM_REPO = $(shell git remote get-url origin)
publish: export UPSTREAM_PUBLISH_BRANCH_TO_OVERWRITE=gh-pages
publish: export LOCAL_SCRATCH_BRANCH=scratch
publish: export LOCAL_DIST_PATH=$(shell realpath dist)

publish:
	./publish_to_gitrepo.sh

clean:
	rm -rf dist

.PHONY: dist dist_static dist_js publish clean
