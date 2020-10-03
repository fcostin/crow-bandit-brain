containerised npm


```
docker build -t npm -f npm.Dockerfile .

./venv.sh npm install --save-dev webpack webpack-cli

./venv.sh npm install --save vue
```


### References

https://webpack.js.org/guides/getting-started/
