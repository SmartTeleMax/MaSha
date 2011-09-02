#!/bin/bash
cd $(git rev-parse --show-toplevel)

dt=`date -u +%d.%m.%Y-%H:%M:%S`
if [ "$(git st --porcelain src/js/masha.js | cut -b1)" == "M" ]; then 
    out=`sed "s/\\.version = \"[^\"]*\";/\\.version = \"$dt\";/g" src/js/masha.js`
    echo "$out" > src/js/masha.js
    git add src/js/masha.js
fi

if [ "$(git st --porcelain src/js/masha.min.js | cut -b1)" == "M" ]; then 
    out=`sed "s/\\.version=\"[^\"]*\";/\\.version=\"$dt\";/g" src/js/masha.min.js`
    echo "$out" > src/js/masha.min.js
    git add src/js/masha.min.js
fi
