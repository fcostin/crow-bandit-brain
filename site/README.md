crow-bandit-brain static site
=============================


### dev env prereqs
*	docker
*	make
*	bash
*	git

### overview of dev process

*	we run npm & webpack in a container to isolate it from our host environment
*	a `./venv.sh` script is provided to run the containerised npm.
*	npm packages and cache are cached locally in our host environment and mounted into container
*	webpack is used to generate a javascript bundle for each page
*	the generated site is written to the `dist` directory

### dev quickstart to build and deploy the site

1.	bring up the dev environment: `make devenv_setup`
2.	to ensure the `dist` directory is clean: `make clean`
3.	to build the site: `make dist`
4.	to deploy the site to `gh-pages` branch of `origin` remote repo: `make publish`

### to install a new npm package

For example:

```
./venv.sh npm install --save ndarray-householder-qr
```

### to erase and reinstall the dev environment (delete and reinstall all cached npm packages)

1.	`make devenv_clean`
2.	`make devenv_setup`

n.b. non-default configuration of webpack was required to get dist builds of vue working


### References

https://webpack.js.org/guides/getting-started/
https://stackoverflow.com/questions/49334815/vue-replaces-html-with-comment-when-compiling-with-webpack
https://codys.club/blog/2015/07/04/webpack-create-multiple-bundles-with-entry-points/
