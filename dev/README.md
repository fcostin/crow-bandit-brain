containerised npm


```
docker build -t npm -f npm.Dockerfile .

./venv.sh npm install --save-dev webpack webpack-cli

./venv.sh npm install --save vue
```

Running webpack to produce `dist/main.js`

```
make
```

n.b. non-default configuration of webpack was required to get dist builds of vue working


### References

https://webpack.js.org/guides/getting-started/
https://stackoverflow.com/questions/49334815/vue-replaces-html-with-comment-when-compiling-with-webpack
