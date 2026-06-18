#!/bin/sh
set -eu

go mod download
go run ./cmd/server
