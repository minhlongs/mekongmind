.PHONY: all setup install build test lint clean

all: install build

setup:
	@echo "=== Setting up MekongMind monorepo ==="
	pnpm install
	poetry install
	@echo "=== Setup complete ==="

install:
	pnpm install
	poetry install

build:
	pnpm turbo build
	$(MAKE) -C engine build

test:
	pnpm turbo test
	poetry run pytest cli/tests engine/quantization
	$(MAKE) -C engine test

lint:
	pnpm turbo lint
	poetry run ruff check cli/
	$(MAKE) -C engine lint

clean:
	pnpm turbo clean
	$(MAKE) -C engine clean
	find . -name node_modules -type d -prune -exec rm -rf {} +
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
	find . -name .next -type d -prune -exec rm -rf {} +
	find . -name dist -type d -prune -exec rm -rf {} +
