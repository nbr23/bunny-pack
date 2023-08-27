all:
	npx webpack --config webpack.config.js
	npx web-ext build -i package.json package-lock.json Makefile webpack.config.js dist/bundle.js.LICENSE.txt --overwrite-dest
