# Copyright 2026 Mekong IDE Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Mekong IDE — Go CLI Makefile
# ============================
# All targets assume Go 1.22+ is available on PATH.
# Cross-compile for Apple Silicon: GOARCH=arm64 GOOS=darwin make build

BINARY      := mekong
MODULE      := github.com/longtho638-jpg/mekong-ide
CMD_DIR     := ./cmd/mekong
BUILD_DIR   := ./bin
VERSION     ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS     := -X $(MODULE)/internal/bootstrap.Version=$(VERSION) -s -w

.PHONY: all build test clean run-chat run-health lint vet fmt deps tidy

## all: build the binary (default target)
all: build

## deps: download and verify Go modules
deps:
	go mod download
	go mod verify

## tidy: tidy go.mod/go.sum
tidy:
	go mod tidy

## The user's ~/.local/bin/cc is an LLM-routing shim that invokes router.py; pin to system cc.
export CC := /usr/bin/cc
export CXX := /usr/bin/cc

## build: compile the mekong binary into ./bin/
## LC_RPATH entries are injected via -extldflags so dyld resolves libmekong_safety.dylib
## from /usr/local/lib (standard install) or adjacent lib/ dir (portable bundle) without
## any post-build install_name_tool step. Note: Go 1.21+ rejects @executable_path in
## #cgo LDFLAGS, so rpath must come from the go build command instead.
build: deps
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=1 CC=$(CC) CXX=$(CXX) go build \
		-ldflags '$(LDFLAGS) -extldflags "-Wl,-rpath,@executable_path/../lib -Wl,-rpath,@executable_path/lib -Wl,-rpath,/usr/local/lib"' \
		-o $(BUILD_DIR)/$(BINARY) $(CMD_DIR)
	@echo "Built: $(BUILD_DIR)/$(BINARY)"

## test: run all Go tests with race detector
test:
	go test -race -count=1 -timeout 60s ./...

## test-cover: run tests with coverage report
test-cover:
	go test -race -count=1 -timeout 60s -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out

## vet: run go vet
vet:
	go vet ./...

## fmt: format all Go source files
fmt:
	gofmt -w -s .

## lint: run go vet + fmt check (no external linter required)
lint: vet
	@test -z "$$(gofmt -l .)" || (echo "gofmt issues found:" && gofmt -l . && exit 1)

## run-chat: quick smoke test — chat hello (requires MLX servers running on M1 Max)
run-chat: build
	$(BUILD_DIR)/$(BINARY) chat "hello, what can you do?"

## run-health: probe all three MLX endpoints
run-health: build
	$(BUILD_DIR)/$(BINARY) health

## clean: remove build artifacts
clean:
	rm -rf $(BUILD_DIR) coverage.out

## help: show this message
help:
	@grep -E '^## [a-z]' Makefile | sed 's/## /  make /'
