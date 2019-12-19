#!/bin/bash
if [ $# -lt 1 ]; then
  echo "Launch any of the following examples with 'npm start <example>'"
  echo "-----------------------------------------------------------------------------"
  ls ./examples/ --width 80 --color=never
  echo "-----------------------------------------------------------------------------"
  exit
fi
npm install --prefix examples/$1
if [ "$2" == '--dev' ]; then # ./launch.sh <example> --dev
  npm install
  npm run build
  rm examples/$1/node_modules/tabris -rf
  rm examples/$1/node_modules/tabris-decorators -rf
  npm install tabris@nightly --no-save --prefix examples/$1
  mkdir examples/$1/node_modules/tabris-decorators
  cp ./dist/* examples/$1/node_modules/tabris-decorators
fi
if [ "$GITPOD_HOST" != '' ]; then
  npm run gitpod --prefix examples/$1
else
  npm start --prefix examples/$1
fi
