#!/bin/bash
cd $(git rev-parse --show-toplevel)

dt=`date -u +%d.%m.%Y-%H:%M:%S`
if [ "$(git status --porcelain src/js/masha.js | cut -b1)" == "M" ]; then 
    # Adding version to js
    out=`sed "s/\\.version = \"[^\"]*\";/\\.version = \"$dt\";/g" src/js/masha.js`
    echo "$out" > src/js/masha.js
    git add src/js/masha.js

    # packing js
    echo "packing masha.js..."
    curl -s --data-urlencode js_code@"src/js/masha.js" --data-urlencode compilation_level="SIMPLE_OPTIMIZATIONS" --data-urlencode output_format="text" --data-urlencode output_info="compiled_code"  http://closure-compiler.appspot.com/compile > src/js/masha.min.js
    git add src/js/masha.min.js
fi
