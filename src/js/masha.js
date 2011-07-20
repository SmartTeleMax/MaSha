// XXX merge with range.js
// XXX decrease jQuery dependency
(function(){

var MaSha = function(options) {
    this.options = extend({}, MaSha.default_options, options);
    
    extend(this, {
        counter: 0,
        savedSel: [],
        ranges: {},
        childs: [],
        blocks: {}
    });

    this.init();
}

MaSha.default_options = {
    'regexp': new RegExp('[^\\s,;:–.!?<>…\\n\xA0\\*]+', 'ig'),
    'selectable': 'selectable-content',
    'marker': 'txtselect_marker',
    'location': window.location,
    'ignored': null,
    'onSelected': null,
    'onDeselected': null,
    'onHashRead': function(){
        window.setTimeout(function(){
            var elem = document.getElementsByClassName('user_selection_true')[0];
            if(elem) {
                var x = 0, y = 0;
                while(elem){
                    x += elem.offsetLeft;
                    y += elem.offsetTop;
                    elem = elem.offsetParent;
                }
         
                console.log(elem, x, y);
                window.scrollTo(x,y-150);
            }
        }, 1);
    }
}

MaSha.prototype = {
    init: function(){ // domready
        this.selectable = (typeof this.options.selectable == 'string'?
                             document.getElementById(this.options.selectable):
                             this.options.selectable);
        var marker = (typeof this.options.marker == 'string'?
                      document.getElementById(this.options.marker):
                      this.options.marker);

        var this_ = this;

        if (!this.selectable) return;
    
        cleanWhitespace(this.selectable);
    
        // XXX translate comments
        // enumerate block elements containing a text
        this.enumerateElements();
    
        addEvent(document, 'mouseup', function(e) {
            /*
             * Show the marker if any text selected
             */
            // XXX it's a question: bind to document or to this.selectable
            // binding to document works better

            window.setTimeout(function(){
                var text = window.getSelection().toString();
                if (text == '' || !this_.options.regexp.test(text)) return;
                if (!this_.range_is_selectable()) return;
                marker.style.top = e.pageY-33 + 'px';
                marker.style.left = e.pageX+5 + 'px';
                addClass(marker, 'show');
            }, 1);
        });
    
    
    
        addEvent(marker, 'click', function(e){
            preventDefault(e);
            removeClass(marker, 'show');
            if (!this_.range_is_selectable()){
                return;
            }
            
            this_.addSelection();
            this_.updateHash();

            if (this_.options.onSelected){
                this_.options.onSelected(this_);
            }
        });
    
        addEvent(document, 'click', function(e){
            if (e.target != marker) {
                removeClass(marker, 'show');
            }
        });
    
        this.readHash();
    },

    // XXX sort methods logically
    // XXX choose btw camelCase and underscores!
    delete_selections: function(numclasses){
        //console.log('delete: ', numclasses)
        var ranges = [];
        for(var i=numclasses.length; i--;){
            var numclass = numclasses[i];
            var spans = this.selectable.getElementsByClassName(numclass);
            console.log(spans)
            var closewrap = spans[spans.length-1].getElementsByClassName('closewrap')[0];
            closewrap.parentNode.removeChild(closewrap);

            this.removeTextSelection(spans);
            ranges.push(this.ranges[numclass]);
            delete this.ranges[numclass];
        }
    },

    removeTextSelection: function(spans){
        for (var i=spans.length; i--;){
            var span = spans[i];
            for (var j=0; j<span.childNodes.length;j++){
                span.parentNode.insertBefore(span.childNodes[j], span);
            }
            span.parentNode.removeChild(span);
        }
    },

    is_internal: function(node){
        while (node.parentNode){
            if (node == this.selectable){
                return true
            }
            node = node.parentNode
        }
        return false;
    },

    _siblingNode: function(cont, prevnext, firstlast, offs, regexp){
        var regexp = regexp || this.options.regexp;
        //console.log('getting', prevnext, cont);
        while (cont.parentNode && this.is_internal(cont)){
            while (cont[prevnext + 'Sibling']){
                cont = cont[prevnext + 'Sibling'];
                while (cont.nodeType == 1 && cont.childNodes.length){
                    cont = cont[firstlast + 'Child'];
                }
                if(cont.nodeType == 3 && 
                   (cont.data.match(regexp) != null)){
                    //console.log('getting ' + prevnext +  ': _container:', cont.data,
                    //            '_offset:', offs * cont.data.length);
                    return {_container: cont, _offset: offs * cont.data.length};
                }
            }
            cont = cont.parentNode;
        }
    },

    prevNode: function(cont, regexp){
        return this._siblingNode(cont, 'previous', 'last', 1, regexp);
    },
    nextNode: function (cont, regexp){
        return this._siblingNode(cont, 'next', 'first', 0, regexp);
    },

    wordCount: function wordCount(node) {
        var _wcount = 0;
        //console.log('countingWord.wordCount: в wordCount func. node = ', node, '; nodeType = ', node.nodeType);
        if (node.nodeType == 3) { // Text only
            var match = node.nodeValue.match(this.options.regexp);
            if (match) { _wcount += match.length; }
            //console.log('countingWord.wordCount: эта нода', node, 'текстовая. Слов в ноде: '+ _wcount);
        } else if (node.childNodes && node.childNodes.length){ // Child element
            var alltxtNodes = textNodes(node);
            //console.log('countingWord.wordCount: рассматриваемая нода имеет '+alltxtNodes.length+' чайлд(ов)');
            //console.log('alltxtNodes: ', alltxtNodes);
            for (i=0; i<alltxtNodes.length; i++) {
                //console.log('countingWord.wordCount: Шаг №', i, '. Считаем кол-во слов в ноде', alltxtNodes[i], '. Слов = ', alltxtNodes[i].nodeValue.match(this.options.regexp).length);
                _wcount += alltxtNodes[i].nodeValue.match(this.options.regexp).length;
                //console.log('_wcount = ', _wcount);
            }
        }
        //console.log('countingWord.wordCount: возвращаю _wcount = ', _wcount);
        return _wcount;
    },

    // counting symbols/word functions
    words: function(container, _offset, pos){
        //console.log('countingWord: ––––––––––––––––––––––––––––––––––––––––––––––––');
        //console.log('countingWord: подсчет слов. аргументы: _container =', _container, '; _offset = ', _offset);
    
        if (container.nodeType == 1) {
            container = firstTextNode(container);
        }
        // вычитаем из start/end Container кусок текста, который входит в выделенное. Оставшееся разбиваем регекспом, и считаем кол-во слов.
        var wcount = container.data.substring(0, _offset).match(this.options.regexp);
        
        //console.log('wcount', wcount);
        if (wcount != null) { 
            if (pos=='start') wcount = wcount.length+1; 
            if (pos=='end') wcount = wcount.length;
        } else { 
            wcount = 1;
        }
        //console.log('countingWord: в '+pos+'Container ноде до начала выделения слов:', wcount);

        var node = container;
        var selection_index = this.getNum(container);
        var first_node = this.getFirstTextNode(selection_index);
        //console.log(first_node, node, selection_index)
        while(node && node != first_node){
            node = this.prevNode(node, /.*/)._container;
            var onei_ = this.wordCount(node);
            wcount += onei_;
            //node = node? node.container: null;
        }

        /*
        n = container.previousSibling;
        // FIXME! Требуется подсчет кол-ва слов и за пределами внутренних <b></b>
        while (n) {
            var onei = wordCount(n);
            wcount += onei;
            n = n.previousSibling;
        }
        */
        //console.log('countingWord: итог работы (кол-во слов до первого/последнего слова)', wcount);
        //console.log('countingWord: ––––––––––––––––––––––––––––––––––––––––––––––––');
        return selection_index + ':' + wcount;
    },

    symbols: function(_node){
        var _count = 0;
        if (_node.nodeType == 3) {
            _count = _node.nodeValue.length;
        } else if (_node.childNodes && _node.childNodes.length) {
            var allnodes = textNodes(_node);
            for (var i = allnodes.length; i--; ) {
                _count += allnodes[i].nodeValue.length;
            }
        }
        return _count;
    }, 

    updateHash: function(){
        var hashAr = [];
        
        for (key in this.ranges) { 
            hashAr.push(this.ranges[key]);
        }
        this.options.location.hash = 'sel='+hashAr.join(';');
    },

    readHash: function(){
        var hashAr = this.splittedHash();
        if (!hashAr){ return; }
        //console.log('readHash: из хэша получен массив меток выделений: ', hashAr);
    
        for (var i=0; i < hashAr.length; i++) {
            this.deserializeSelection(hashAr[i]);
        }
        this.updateHash();

        if (this.options.onHashRead){
            this.options.onHashRead(this);
        }

        //console.log('readHash: ––––––––––––––––––––––––––––––');

    },

    splittedHash: function(){
        var hash = this.options.location.hash;
        if (!hash) return;
    
        hash = hash.replace(/^#/, '').replace(/;+$/, '');

        if(! /^sel\=(?:\d+\:\d+\,\d+\:\d+;)*\d+\:\d+\,\d+\:\d+$/.test(hash)) return;

        hash = hash.substring(4, hash.length);
        return hash.split(';');
    },

    deserializeSelection: function(serialized) {
        var sel = window.getSelection();
        if(sel.rangeCount > 0){ sel.removeAllRanges(); }

        range = this.deserializeRange(serialized);
        if(range){
        //    sel.addRange(range);
            this.addSelection(range);
        }
    },

    deserializeRange: function(serialized){
        var result = /^([^,]+),([^,]+)({([^}]+)})?$/.exec(serialized);

        var start = this.deserializePosition(result[1], 'start'),
            end = this.deserializePosition(result[2], 'end');

        if (start.node && end.node){
            var range = document.createRange();
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            return range;
        }
        if (window.console && (typeof console['warn'] == 'function')){
            console['warn']('Cannot deserialize range: ' + serialized);
        }
    }, 

    deserializePosition: function(serialized, pos){
         var bits = serialized.split(":");
         var node = this.blocks[parseInt(bits[0], 10)];

         var pos_text;

         //console.log('deserializePosition: Осуществляем подсчет '+pos+'-овой позиции');
         //console.log('deserializePosition: выбран элемент = ', node, bits[0]);
         //console.log('deserializePosition: в выбранном элементе '+$(el).contents().length+' childNodes');


         var offset, stepCount = 0, exit = false;
         //console.log('deserializePosition: ищем по счету '+bits[1]+' слово. Запускаем цикл перебора всех слов родительского элемента.');
         while (node) {
             // XXX duplicating regexp!!!
             var re = new RegExp ('[^\\s,;:–.!?\xA0\\*]+', 'ig');
             while ((myArray = re.exec(node.data )) != null) {
                 stepCount++;
                 //console.log('deserializePosition: слово №'+stepCount+' = "', myArray[0], '"; (startoffset =', myArray.index, ', endoffset =', re.lastIndex, ')');
                 if (stepCount == bits[1]) {
                     if (pos=='start') offset = myArray.index;
                     if (pos=='end') offset = re.lastIndex;

                     return {node: node, offset: parseInt(offset, 10)};
                     //console.log('deserializePosition: '+pos+'овое слово найдено = ', myArray[0], '. Целевая нода = ', _allnodes[i], '. Символьный offset = ', offset);
                 }

             }
             node = this.nextNode(node, /.*/)
             node = node? node._container: null;
             if (this.isFirstTextNode(node)){
                 node = null;
             }
         }
         return {node: null, offset: 0};
    },

    serializeRange: function(range) {
        var start = this.words(range.startContainer, range.startOffset, 'start');
        var end = this.words(range.endContainer, range.endOffset, 'end');
        return start + "," + end;
    },

    checkSelection: function(range) {
        /*
         * Corrects selection.
         * Returns range object
         */
        //console.log('checkSelection: ––––––––––––––––––––––––––––––');
        //console.log('checkSelection: получен аргумент range = ', range);
        //console.log('checkSelection: range = ', range.endOffset, range.endContainer);
    
        //console.log('checkSelection: range = ', range);
        this.checkPosition(range, range.startOffset, range.startContainer, 'start');
        this.checkPosition(range, range.endOffset, range.endContainer, 'end');
        
        this.checkBrackets(range);
        this.checkSentence(range);

        //console.log('checkSelection: ––––––––––––––––––––––––––––––');
        return range;
    },


    checkPosition: function(range, offset, container, position) {
        var options = this.options;
        
        function is_word(str){
            return str.match(options.regexp) != null;
        }

        function is_not_word(str){
            return str.match(options.regexp) == null;
        }

        function stepBack(container, offset, condition) {
            var init_offset = offset;
            //console.log('checkSelection.stepBack: offset: ', offset);
            while (offset > 0 && condition(container.data.charAt(offset-1))){
                //console.log('checkSelection.stepBack: корректируем offset шагом назад. '+ 
                //            'Шаг #', init_offset - offset + 1, '; '+
                //            'Проверяем символ "', container.data[offset - 1], '"');
                offset--;
            }
            //console.log('checkSelection.stepBack: корректируем offset шагом назад. '+ 
            //            'Шаг #', init_offset - offset + 1, '; '+
            //            'Проверяем символ "', container.data[offset - 1], '"');
            return offset;
        }
        
        function stepForward(container, offset, condition) {
            var init_offset = offset;
            //console.log('checkSelection.stepForward: offset: ', offset);
            while (offset < container.data.length && condition(container.data.charAt(offset))){
                //console.log('checkSelection.stepForward: корректируем offset шагом назад. '+ 
                //            'Шаг #', offset - init_offset + 1, '; '+
                //            'Проверяем символ "', container.data[offset], '"');
                offset++;
            }
            //console.log('checkSelection.stepForward: корректируем offset шагом назад. '+ 
            //            'Шаг #', offset - init_offset + 1, '; '+
            //            'Проверяем символ "', container.data[offset], '"');
            return offset;
        }

        if (position == 'start') {
            
            if (container.nodeType == 1 && trim(textContent(container)) != '') {
                //console.log('в if-е.');
                container = firstTextNode(container);
                offset = 0;
                //console.log('новый container', container);
            }

            if (container.nodeType != 3 ||
                container.data.substring(offset).match(this.options.regexp) == null) {
                //console.log('in if nodeType=', container.nodeType);
                var newdata = this.nextNode(container);
                //range.setStart(newdata._container, newdata._offset);
                container = newdata._container;
                offset = newdata._offset;
                //console.log('offset', offset);
            }

            // Важно! Сначала сокращаем выделение, потом расширяем
            offset = stepForward(container, offset, is_not_word);
            //console.log('checkSelection: скорректированный offset = ', offset);
        
            offset = stepBack(container, offset, is_word);
            //console.log('checkSelection: скорректированный offset = ', offset);
            
            range.setStart(container, offset);
        }
        
        if (position == 'end') {
            
            if (container.nodeType == 1 && trim(textContent(container)) != '' && offset != 0) {
                //console.log('в end if-е.');
                container_txtnodes = textNodes(container); // XXX lastTextNode
                container = container_txtnodes[container_txtnodes.length-1];
                offset = container.data.length;
                //console.log('новый container', container, offset);
            }
            
            if (container.nodeType != 3 ||
                container.data.substring(0, offset).match(this.options.regexp) == null) {
                var newdata = this.prevNode(container);
                container = newdata._container;
                offset = newdata._offset;
                //console.log('offset', offset);
            }
            
            // Важно! Сначала сокращаем выделение, потом расширяем
            offset = stepBack(container, offset, is_not_word);
            //console.log('checkSelection: скорректированный offset = ', offset);

            offset = stepForward(container, offset, is_word);
            //console.log('checkSelection: скорректированный offset = ', offset);
            range.setEnd(container, offset);
        }
    },

    checkBrackets: function(range){
        this._checkBrackets(range, '(', ')', /\(|\)/g, /\(x*\)/g);
        this._checkBrackets(range, '«', '»', /\«|\»/g, /«x*»/g);
        // XXX Double brackets?
    },
    _checkBrackets: function(range, ob, cb, match_reg, repl_reg){
        // XXX Needs cleanup!
        var text = range.toString();//getTextNodes(range).map(function(x){return x.data;}).join('');
        var brackets = text.match(match_reg);
        if (brackets){
            brackets = brackets.join('');
            var l = brackets.length +1;
            while(brackets.length < l){
                l = brackets.length;
                brackets = brackets.replace(repl_reg, 'x');
            }
            if (brackets.charAt(brackets.length-1) == cb &&
                    text.charAt(text.length-1) == cb){
                if(range.endOffset == 1) {
                    var new_data = this.prevNode(range.endContainer);
                    range.setEnd(new_data.container, new_data.offset);
                } else {
                    range.setEnd(range.endContainer, range.endOffset-1);
                }
            }
            if (brackets.charAt(0) == ob &&
                    text.charAt(0) == ob){
                if(range.startOffset == range.startContainer.data.length) {
                    var new_data = this.nextNode(range.endContainer);
                    range.setStart(new_data.container, new_data.offset);
                } else {
                    range.setStart(range.startContainer, range.startOffset+1);
                }
            }
        }

    },

    checkSentence: function(range){
        if(range.endOffset == range.endContainer.data.length) {
            var data = this.nextNode(range.endContainer, /.*/);
            if(!data) {return;}
            var nextAfterRange = data._container.data.charAt(0);
        } else {
            var data = {_container: range.endContainer, _offset: range.endOffset};
            var nextAfterRange = range.endContainer.data.charAt(range.endOffset);
        }


        if (nextAfterRange.match(/\.|\?|\!/)){
            // sentence end detected
            // XXX rewrite
            var text = range.toString();
            if (text.match(/(\.|\?|\!)\s+[A-ZА-ЯЁ]/)){
                return apply();
            }

            if (range.startOffset == 0 &&
                range.startContainer.previousSibling &&
                range.startContainer.previousSibling.nodeType == 1 &&
                range.startContainer.previousSibling.className == 'selection_index'){
                return apply();
            }

            var node, iterator = range.getElementIterator()
            while (node=iterator()){
                if (node.nodeType == 1 && node.className == 'selection_index'){
                    return apply();
                }
            }

            if (text.charAt(0).match(/[A-ZА-ЯЁ]/)){
                var pre = range.startContainer.data.substring(0, range.startOffset)
                if(!pre.match(/\S/)) {
                    var pre_data = this.prevNode(range.startContainer, /\W*/);
                    pre = pre_data._container.data;
                }
                pre = trim(pre);
                if (pre.charAt(pre.length-1).match(/(\.|\?|\!)/)){
                    return apply();
                }
            }
        }
        
        function apply(){
            range.setEnd(data._container, data._offset+1)
        }
    },

    mergeSelections: function(range){
        var merges = []
        var iterator = range.getElementIterator();
        var node = iterator();
        var last = node;
        var parent_ = parentWithClass(node, 'user_selection_true');
        if (parent_){
            parent_ = /(num\d+)(?:$| )/.exec(parent_.className)[1];
            range.setStart(firstTextNode(firstWithClass(this.selectable, parent_)), 0);
            merges.push(parent_);
        }
        while (node){
            if (node.nodeType == 1 && hasClass(node, 'user_selection_true')){
               var cls = /(num\d+)(?:$|)/.exec(node.className)[0];
               if (inArray(cls, merges) == -1){
                   merges.push(cls);
               }
            }
            last = node;
            node = iterator();
        }
        var last = parentWithClass(last, 'user_selection_true');
        if (last){
            var last = /(num\d+)(?:$| )/.exec(last.className)[1];
            var tnodes = textNodes(lastWithClass(this.selectable, last)); // XXX lastTextNode
            var last_node = tnodes[tnodes.length-1];
            range.setEnd(last_node, last_node.length)
        }
        if (merges.length){
            // this breaks selection, so we need to dump a range and restore it after DOM changes
            var sc = range.startContainer, so=range.startOffset,
                ec = range.endContainer, eo = range.endOffset;
            this.delete_selections(merges);
            range.setStart(sc, so);
            range.setEnd(ec, eo);
        }
        return range;
    },

    addSelection: function(range) {
        range = range || this.getFirstRange();
    
        range = this.checkSelection(range);
        range = this.mergeSelections(range);


        //console.log('after checkSelection range = ', range);
        // генерируем и сохраняем якоря для выделенного
        var class_name = 'num'+this.counter;
        this.ranges[class_name] = this.serializeRange(range);

        range.wrapSelection(class_name+' user_selection_true');
        this.addSelectionEvents(class_name)
    },

    addSelectionEvents: function(class_name) {
        var timeout_hover=false;
        var this_ = this;

        var wrappers = this.selectable.getElementsByClassName(class_name);
        for (var i=wrappers.length;i--;){
            addEvent(wrappers[i], 'mouseover', function(){
                for (var i=wrappers.length;i--;){
                    addClass(wrappers[i], 'hover');
                }
                window.clearTimeout(timeout_hover);
            });
            addEvent(wrappers[i], 'mouseout', function(e){
                // mouseleave
                var t = e.relatedTarget;
                while (t && t.parentNode && t.className != this.className){
                    t = t.parentNode;
                }
                if (!t || t.className != this.className){
                    timeout_hover = window.setTimeout(function(){ 
                        for (var i=wrappers.length;i--;){
                            removeClass(wrappers[i], 'hover');
                        }
                    }, 2000);
                }
            });
        }

        var closer = document.createElement('a');
        closer.className = 'txtsel_close';
        closer.href = '#';
        var closer_span = document.createElement('span');
        closer_span.className = 'closewrap';
        closer_span.appendChild(closer);
        addEvent(closer, 'click', function(e){
            preventDefault(e);
            this_.delete_selections([class_name]);
            this_.updateHash();
            
            if (this_.options.onDeselected){
                this_.options.onDeselected(this_);
            }
        });
        wrappers[wrappers.length-1].appendChild(closer_span);
    
        this.counter++;
        window.getSelection().removeAllRanges();
    },

    getFirstRange: function(){
        var sel = window.getSelection();
        var res = sel.rangeCount ? sel.getRangeAt(0) : null;
        //console.log('getFirstRange func:', res);
        return res;
    },
    enumerateElements: function(){
        // Returns first text node in each visual block element
        var node = this.selectable;
        var captureCount=0;
        var this_ = this;

        enumerate(node);

        function enumerate(node){
            var children = node.childNodes;
            var has_blocks = false;
            var block_started = false;
            

            var len;
            for (var idx=0; idx<children.length; ++idx) {
                var child = children.item(idx);
                var nodeType = child.nodeType;
                if (nodeType==3 && !child.nodeValue.match(this_.options.regexp)) {
                    // ..if it is a textnode that is logically empty, ignore it
                    continue;
                } else if (nodeType==3) {
                    if (!block_started){
                        // remember the block
                        captureCount++;
                        //console.log('enumerating', child, captureCount)
                        var index_span = document.createElement('span');
                        // XXX prefix all class and id attributes with "masha"
                        index_span.id = 'selection_index' + captureCount;
                        index_span.className = 'selection_index';
                        child.parentNode.insertBefore(index_span, child)

                        idx++;
                        this_.blocks[captureCount] = child;
                        has_blocks = block_started = true;
                    }
                } else if (nodeType==1) {
                    // XXX check if this is correct
                    if (!this_.is_ignored(child)){
                        var is_block = inArray(getCompiledStyle(child, 'display'),
                                               ['inline', 'none']) == -1;

                        if (is_block){
                            var child_has_blocks = enumerate(child);
                            has_blocks = has_blocks || child_has_blocks;
                            block_started = false;
                        } else if (!block_started) {
                            block_started = enumerate(child);
                            has_blocks = has_blocks || block_started;
                        }
                    }
                }
            }
            return has_blocks;
        }
    },
    isFirstTextNode: function(text_node){
        var prevs = [text_node.previousSibling, text_node.parentNode.previousSibling];
        for (var i=prevs.length;i--;){
            if (prevs[i] && prevs[i].nodeType == 1 && prevs[i].className == 'selection_index'){
                return true
            }
        }
        return false;
    },
    getFirstTextNode: function(numclass){
        if(!numclass) { return; }
        var tnode = document.getElementById('selection_index'+numclass);
        if (tnode) {
            if (tnode.nextSibling.nodeType == 1){
                return tnode.nextSibling.childNodes[0];
            } else {
                return tnode.nextSibling;
            }
        }
    },
    getNum: function(cont){
        while (cont.parentNode){
            while (cont.previousSibling){
                cont = cont.previousSibling;
                while (cont.nodeType == 1 && cont.childNodes.length){
                    cont = cont.lastChild;
                }
                if (cont.nodeType == 1 && cont.className == 'selection_index'){
                    return cont.id.replace('selection_index', '')
                }
            }
            cont = cont.parentNode;
        }
    },

    is_ignored: function(node){
        return this.options.ignored && this.options.ignored(node);
    },

    range_is_selectable: function(){
        // getNodes() это от rangy вроде.
        var node, first_node, last_node, first=true;
        var range = this.getFirstRange();
        if (!range) { return false; }
        var iterator = range.getElementIterator();
        while (node = iterator()){
            if (node.nodeType == 3 && node.data.match(this.options.regexp) != null){
                // first and last TEXT nodes
                first_node = first_node || node;
                last_node = node;
            }
            // We need to check first element. Text nodes are not checked, so we replace
            // it for it's parent.
            node = (first && node.nodeType == 3)? node.parentNode : node;
            first = false;
            
            if (node.nodeType == 1){
                // Checking element nodes. Check if the element node and all it's parents
                // till selectable are not ignored
                var iter_node = node;
                while (iter_node != this.selectable && iter_node.parentNode){
                    if (this.is_ignored(iter_node)){
                        return false;
                    }
                    iter_node = iter_node.parentNode
                }
                if (iter_node != this.selectable){ return false; }
            }
        }
        var first_selection = parentWithClass(first_node, 'user_selection_true');
        var last_selection = parentWithClass(last_node, 'user_selection_true');
        if (first_selection && last_selection){
            var reg = /(?:^| )(num\d+)(?:$| )/;
            return (reg.exec(first_selection.className)[1] != 
                    reg.exec(last_selection.className)[1]);
        }
        return true;
    }
};

    var Range = window.Range || window.DOMRange;

    Range.prototype.splitBoundaries = function() {
        var sc = this.startContainer,
            so = this.startOffset,
            ec = this.endContainer,
            eo = this.endOffset;
        var startEndSame = (sc === ec);

        if (ec.nodeType == 3 && eo < ec.length) {
            ec.splitText(eo);
        }

        if (sc.nodeType == 3 && so > 0) {
            sc = sc.splitText(so);
            if (startEndSame) {
                eo -= so;
                ec = sc;
            }
            so = 0;
        }
        this.setStart(sc, so);
        this.setEnd(ec, eo);
    }

    Range.prototype.getTextNodes = function() {
        var iterator = this.getElementIterator();
        var textNodes = [], node;
        while (node = iterator()){
            // XXX was there a reason to check for empty string?
            // with this check selecting two sibling words separately
            // and then selecting them both in one range doesn't work properly
            if (node.nodeType == 3){// && !node.data.match(/^\s*$/)){
                textNodes.push(node);
            }
        }
        return textNodes
    }

    function elementIterator(parent, cont, end){
        cont = cont || parent.childNodes[0];
        var finished = !cont;
        var up = false;
        
        function next(){
            if (finished) {return null;} 
            var result = cont;
            if (cont.childNodes && cont.childNodes.length && !up){
                cont = cont.firstChild;
            } else if (cont.nextSibling){
                cont = cont.nextSibling;
                up = false;
            } else if (cont.parentNode){
                cont = cont.parentNode;
                if (cont === parent){ finished = true; }
                up = true;
                next();
            }
            if (result === end) { finished = true; };
            return result
        }
        return next;
    }

    Range.prototype.getElementIterator = function(){
        return elementIterator(null, this.startContainer, this.endContainer);
    }

    Range.prototype.wrapSelection = function(className){
        this.splitBoundaries();

        var textNodes = this.getTextNodes();
        for (var i=textNodes.length; i--;){
            // XXX wrap sibling text nodes together
            var span = document.createElement('span');
            span.className = className;
            textNodes[i].parentNode.insertBefore(span, textNodes[i]);
            span.appendChild(textNodes[i]);
        }
    }


// exposing
window.MaSha = MaSha;

if (window.jQuery){
    jQuery.fn.masha = function(options) {
        options = options || {};
        options = extend({'selectable': this[0]}, options);
        return new MaSha(options);
    }
}

// Shortcuts
function cleanWhitespace(elem) {
    // XXX Is this needed? According n0s, it's done for fix problems with whitespace nodes in IE
    // XXX Additionaly this will remove nodes with &nbsp; in browsers
    var node, iter = elementIterator(elem);
    while (node = iter()){
        if (node.nodeType == 3 && !/\S/.test(node.nodeValue)) {
            node.parentNode.removeChild(node);
        }
    }
}

function extend(obj){
    for(var i=1; i<arguments.length; i++){
        for (key in arguments[i]){
            obj[key] = arguments[i][key];
        }
    }
    return obj;
}

function trim(text) {
    return (text || "").replace(/^\s+|\s+$/g, "");
}

function getCompiledStyle(elem, strCssRule){
    // copypasted from Internets
	var strValue = "";
	if(document.defaultView && document.defaultView.getComputedStyle){
		strValue = document.defaultView.getComputedStyle(elem, "").getPropertyValue(strCssRule);
	}
	else if(elem.currentStyle){
		strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
			return p1.toUpperCase();
		});
		strValue = elem.currentStyle[strCssRule];
	}
	return strValue;
}

function textContent(elem){
    return elem.textContent || elem.innerText;
}

function parentWithClass(p, cls){
    while (p && !hasClass(p, cls)){p = p.parentNode}
    return p || null;
}
function firstWithClass(elem, cls){
    // XXX use getElementsByClassName?
    var iter = elementIterator(elem);
    var node;
    while (node = iter()){
        if (node.nodeType == 1 && hasClass(node, cls)) {return node;}
    }
}
function lastWithClass(elem, cls){
    var elems = elem.getElementsByClassName(cls);
    if (elems){
        return elems[elems.length-1]
    }
}
function firstTextNode(elem){
    var iter = elementIterator(elem);
    var node;
    while (node = iter()){
        if (node.nodeType == 3) {return node}
    }
}
function textNodes(elem) {
    var ret = [], node;
    var iter = elementIterator(elem);
    while (node = iter()){
        if (node.nodeType == 3) {
            ret.push(node);
        }
    }
    return ret;
}

function _classRegExp(cls){
    return new RegExp('(^|\\s+)'+cls+'(?:$|\\s+)', 'g');
}
function hasClass(elem, cls){
    var reg = _classRegExp(cls);
    return reg.test(elem.className);
}
function addClass(elem, cls){
    // XXX attention! NOT UNIVERSAL!
    // don't use for classes with non-literal symbols
    var reg = _classRegExp(cls);
    if (!reg.test(elem.className)){
        elem.className = elem.className + ' ' + cls
    }
}
function removeClass(elem, cls){
    // XXX attention! NOT UNIVERSAL!
    // don't use for classes with non-literal symbols
    var reg = _classRegExp(cls);
    if (reg.test(elem.className)){
        elem.className = trim(elem.className.replace(reg, '$1'));
    }
}

function inArray(elem, array) {
    // Hate IE
    for (var i = 0, length=array.length; i < length; i++){
        if (array[i] === elem){ return i; }
    }
    return -1;
}

function addEvent(elem, type, fn){
    if (elem.addEventListener) {
        elem.addEventListener(type, fn, false);
    } else if (elem.attachEvent) {
        elem.attachEvent("on" + type, fn);
    }    
}
function preventDefault(e){
    if (e.preventDefault) { e.preventDefault(); }
    else { e.returnValue = false }
}

})();
