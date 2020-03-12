#!/bin/bash
if [ $# -lt 1 ]; then
  echo "Launch any of the following examples with 'npm start <example>'"
  echo "-----------------------------------------------------------------------------"
  ls ./examples/ --width 80 --color=never
  echo "-----------------------------------------------------------------------------"
  exit
fi
if [ "$2" == '--dev' ]; then # ./launch.sh <example> --dev
  rm examples/$1/node_modules -rf
  npm install tabris@nightly --no-save --prefix examples/$1
  rm examples/$1/node_modules/tabris-decorators -rf
  mkdir examples/$1/node_modules/tabris-decorators
  npm run build
  cp ./dist/* examples/$1/node_modules/tabris-decorators
else
  npm install --prefix examples/$1
fi
if [ "$GITPOD_HOST" != '' ]; then
  npm run gitpod --prefix examples/$1
else
  npm start --prefix examples/$1
fi
