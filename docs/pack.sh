#!/bin/sh

./no-pack.sh
curl -s --data-urlencode js_code@"js/packed.js" --data-urlencode compilation_level="SIMPLE_OPTIMIZATIONS" --data-urlencode output_format="text" --data-urlencode output_info="compiled_code"  http://closure-compiler.appspot.com/compile >> js/packed.js
