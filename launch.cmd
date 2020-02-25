@echo off
if NOT "%~1"=="" goto npminstall
echo Launch any of the following examples with 'npm start ^<example^>'
echo -----------------------------------------------------------------
dir examples /b
echo -----------------------------------------------------------------
exit
:npminstall
call npm install --prefix examples/%1
if NOT "%~2"=="--dev" goto launch
call npm install
call npm run build
rmdir examples\%1\node_modules\tabris /S /Q
rmdir examples\%1\node_modules\tabris-decorators /S /Q
mkdir examples\%1\node_modules\tabris
mkdir examples\%1\node_modules\tabris-decorators
copy dist\* examples\%1\node_modules\tabris-decorators\
copy node_modules\tabris\* examples\%1\node_modules\tabris\
:launch
call npm start --prefix examples/%1
