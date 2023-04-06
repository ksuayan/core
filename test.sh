#!/bin/bash
cd package
npm link
cd ../test
npm link @ksuayan/core
node script.mjs
