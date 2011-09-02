#!/bin/bash
cd $(git rev-parse --show-toplevel)

dt=`date -u +%d.%m.%Y-%H:%M:%S`
if [ "$(git st --porcelain src/js/masha.js | cut -b1)" == "M" ]; then 
    out=`sed "s/\\.version = \"[^\"]*\";/\\.version = \"$dt\";/g" src/js/masha.js`
    echo "$out" > version
    git add version
fi

if [ "$(git st --porcelain src/js/masha.min.js | cut -b1)" == "M" ]; then 
    out=`sed "s/\\.version = \"[^\"]*\";/\\.version = \"$dt\";/g" masha.min.js`
    echo "$out" > version
    git add version
fi
