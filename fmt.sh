#!/bin/sh

find \
	. \
	-type f \
	-name '*.mjs' |
	deno fmt
