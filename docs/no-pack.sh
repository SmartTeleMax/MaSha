#!/bin/sh

FILES="js/jquery-1.7.1.js js/jquery.scrollTo-min.js js/jquery.jtweetsanywhere-1.2.1.min.js js/sh/scripts/shCore.js js/sh/scripts/shBrushXml.js js/sh/scripts/shBrushJScript.js src/js/masha.js js/common.js"

rm js/packed.js

for FL in $FILES; do
    echo $FL
    echo "\n//$FL\n" >> js/packed.js
    cat "$FL" >> js/packed.js
    echo ';' >> js/packed.js
done
