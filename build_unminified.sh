#!/usr/bin/env bash

#construct a dummy newline.txt file
printf "\n\n \n" > .newline.txt

#concatenate d3 to js

cat ./js_source/d3v4min.js \
.newline.txt \
./js_source/d3geoprojection.js \
.newline.txt \
./js_source/topojsonmin.js \
.newline.txt \
./js_source/a_setup.js \
./js_source/b_charts.js \
./js_source/c_build_map2.js \
./js_source/d_main.js > app.js

#remove unnecessary files
rm .newline.txt

