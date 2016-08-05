#!/usr/bin/env bash

#minify the js (documentation: https://github.com/mishoo/Uglify)
node_modules/.bin/uglifyjs gci2016.js --lint -o gci2016min.js

#construct a dummy newline.txt file
printf "\n\n //...\n" > .newline.txt

#concatenate d3 to js
cat d3v4min.js .newline.txt gci2016min.js > app.js

#remove unnecessary files
rm .newline.txt gci2016min.js

