all:
	docker run --rm -v $(shell pwd):/app -w /app node:alpine npm i
	docker run --rm -v $(shell pwd):/app -w /app node:alpine npx webpack --config webpack.config.js
	docker run --rm -v $(shell pwd):/app -w /app node:alpine npx web-ext build -i package.json package-lock.json Makefile webpack.config.js dist/bundle.js.LICENSE.txt --overwrite-dest
