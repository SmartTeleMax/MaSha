#!/bin/bash
cd $(git rev-parse --show-toplevel)

dt=`date -u +%d.%m.%Y-%H:%M:%S`
if [ "$(git st --porcelain version | cut -b1)" == "M" ]; then 
    out=`sed "s/\\.version = \"[^\"]*\";/\\.version = \"$dt\";/g" version`
    echo "$out" > version
    git add version
fi
