#!/bin/bash

git pull

echo "Installing..."
npm install
echo "Building..."
npm run web-build`