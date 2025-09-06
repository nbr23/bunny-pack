all: build

build:
	docker run --rm -v $(shell pwd):/app -w /app node:alpine npm i
	docker run --rm -v $(shell pwd):/app -w /app node:alpine npx webpack --config webpack.config.js
	docker run --rm -v $(shell pwd):/app -w /app node:alpine npx web-ext build -i package.json package-lock.json Makefile webpack.config.js dist/bundle.js.LICENSE.txt  Jenkinsfile *.sh --overwrite-dest

icons:
	./generate-icons.sh

clean:
	rm -rf dist/ web-ext-artifacts node_modules

.PHONY: all build clean icons
