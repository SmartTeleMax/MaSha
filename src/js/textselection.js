
$.TextSelector = function(options) {
    var this_ = this;
        
    this.options = $.extend({}, $.TextSelector.default_options, options);
    
    $.extend(this, {
        count: 0,
        savedSel: [],
        ranges: {},
        rootNode: 'selectable-content', // XXX what is this??
        childs: [],
        blocks: {}
    });

    $(function(){ this_.init() });
}

$.TextSelector.default_options = {
    'regexp': new RegExp('[^\\s,;:–.!?<>…\\n\xA0\\*]+', 'ig'),
    'selectable': 'selectable-content',
    'selectorMarker': '#txtselect_marker',
    'ignored': default_selection_ignored,
    'location': window.location
}

// XXX rename to MaSha
$.TextSelector.prototype = {
    init: function(){ // domready
        //console.log('domready');
        this.selectable = (typeof this.options.selectable == 'string'?
                             document.getElementById(this.options.selectable):
                             this.options.selectable);
        // XXX make a callback
        var selectableMessage = new $.TextSelectorMessage();
        var this_ = this;

        if (!this.selectable) return;
    
        $(this.selectable).cleanWhitespace().find('*').cleanWhitespace();
    
        
        // нумерация блочных элементов, которые содержат текст
        this.enumerateElements();
    
        var marker = $(this.options.selectorMarker);

        $(document).bind('textselect', function(e) {
            /*
             * Show the marker if any text selected
             */
            window.setTimeout(function(){
                if (e.text == '' || !this_.options.regexp.test(e.text)) return;
                if (!this_.range_is_selectable()) return;
                marker.css({'top':e.pageY-33, 'left': e.pageX+5});
                marker.addClass('show');
            }, 1);
        });
    
    
    
        marker.click(function(e){
            //console.log('marker click')
            e.preventDefault();
            if (!this_.range_is_selectable()){
                marker.removeClass('show');
                return;
            }
            
            this_.addSelection();
            this_.updateHash();
            this_.count++;

            marker.removeClass('show');
            selectableMessage.show();
        });
    
        $('.closewrap a.txtsel_close').live('click', function(){
            var parent = this.parentNode.parentNode;
            var numclass = parent.className.split(' ')[0];
            $('.'+numclass).removeClass('hover');
            $(this).fadeOut('slow', function(){
                this_.delete_selections([numclass]);
                this_.updateHash();
            });

            return false;
        });

        $(document).click(function(e){
            tar = $(e.target);
            if (tar.attr('id') != 'txtselect_marker') {
                dontrun = false;
                if($('#txtselect_marker').hasClass('show')){
                    // fade in/out is imlemented 
                    $('#txtselect_marker').removeClass('show');
                }
            }
        });
    
        this.readHash();
    },

    delete_selections: function(numclasses){
        //console.log('delete: ', numclasses)
        var ranges = [];
        for(var i=numclasses.length; i--;){
            var numclass = numclasses[i];
            $('.'+numclass+' span.closewrap').remove();
            removeTextSelection('.'+numclass+'.user_selection_true');
            ranges.push(this.ranges[numclass]);
            delete this.ranges[numclass];
        }
        //this.updateHash(ranges);
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
            var alltxtNodes = $(node).textNodes();
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
            container = $(container).textNodes()[0];
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
            var allnodes = $(_node).textNodes();
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
        //console.log('updateHash: обновляем хэш: ', hash);
    },

    readHash: function(){
        var hashAr = this.splittedHash();
        if (!hashAr){ return; }
        //console.log('readHash: из хэша получен массив меток выделений: ', hashAr);
    
        for (var i=0; i < hashAr.length; i++) {
            this.deserializeSelection(hashAr[i]);
        }

        // Вычисляем кол-во px от верха до первого выделенного участка текста, далее - скроллим до этого места.
        var scrollTo = $('.user_selection_true:first').offset().top - 150;
        $('html,body').animate({
            // XXX remove dependency from easing
            scrollTop:scrollTo
            }, 1500,  "easeInOutQuint");

        this.updateHash();
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
            this.count++;
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
            
            if (container.nodeType == 1 && $.trim($(container).text()) != '') {
                //console.log('в if-е.');
                container = $(container).textNodes()[0];
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
            
            if (container.nodeType == 1 && $.trim($(container).text()) != '' && offset != 0) {
                //console.log('в end if-е.');
                container_txtnodes = $(container).textNodes();
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
            //console.log('Sentence end detected: ', nextAfterRange);

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

            var node, iterator = _range.getElementIterator(range)
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
                pre = $.trim(pre);
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
        var iterator = _range.getElementIterator(range);
        var node = iterator();
        var last = node;
        var parent_ = $(node).parents('.user_selection_true')[0];
        if (parent_){
            parent_ = /(num\d+)(?:$| )/.exec(parent_.className)[1];
            //console.log(range, 'parent', parent_, $('.' + parent_ + ':first').textNodes())
            range.setStart($('.' + parent_ + ':first').textNodes()[0], 0) // XXX
            //console.log(range.startContainer)
            //sd.fsd.fsd.fs.d
            merges.push(parent_);
        }
        while (node){
            if (node.nodeType == 1 && $(node).hasClass('user_selection_true')){
               var cls = /(num\d+)(?:$|)/.exec(node.className)[0];
               if ($.inArray(cls, merges) == -1){
                   merges.push(cls);
               }
            }
            last = node;
            node = iterator();
        }
        var last = $(last).parents('.user_selection_true')[0];
        if (last){
            //console.log('last')
            var last = /(num\d+)(?:$| )/.exec(last.className)[1];
            var tnodes = $('.' + last + ':last').textNodes() // XXX
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
    
        //console.log('addSelection func: range', range );
    
        range = this.checkSelection(range);
        range = this.mergeSelections(range);


        //console.log('after checkSelection range = ', range);
        // генерируем и сохраняем якоря для выделенного
        this.ranges['num'+this.count] = this.serializeRange(range);

        _range.wrapSelection('num'+this.count+' user_selection_true', range);

        var timeout_hover, timeout_hover_b = false;
        var _this;

        function unhover() { 
            if (timeout_hover_b) $("."+_this.className.split(' ')[0]).removeClass("hover"); 
        }

        $(".num"+this.count).mouseover(function(){
            _this = this;
            //console.log($(this), this.classList[1], $("."+this.classList[1]));
            $("."+this.className.split(' ')[0]).addClass('hover');
            timeout_hover_b = false;
            clearTimeout(timeout_hover);
        });

        $(".num"+this.count).mouseleave(function(){
            timeout_hover_b = true;
            var timeout_hover = setTimeout(unhover, 2000);
        });

        $('.num'+this.count+':last').append('<span class="closewrap"><a href="#" class="txtsel_close"></a></span>');
    
        //this.updateHash();

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
                        //console.log('block start',child)
                        // remember the block
                        captureCount++;
                        //console.log('enumerating', child, captureCount)
                        $(child).before('<span class="selection_index" id="selection_index' + captureCount +'"></span>');
                        idx++;
                        this_.blocks[captureCount] = child;
                        has_blocks = block_started = true;
                    }
                } else if (nodeType==1) {
                    // XXX check if this is correct
                    if (!this_.is_ignored(child)){
                        var is_block = $.inArray($(child).getCompiledStyle('display'),
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
        return this.options.ignored(node);
    },

    range_is_selectable: function(){
        // getNodes() это от rangy вроде.
        var node, first_node, last_node, first=true;
        var range = this.getFirstRange();
        if (!range) { return false; }
        var iterator = _range.getElementIterator(range);
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
        var first_selection = $(first_node).parents('.user_selection_true')[0];
        var last_selection = $(last_node).parents('.user_selection_true')[0];
        if (first_selection && last_selection){
            var reg = /(?:^| )(num\d+)(?:$| )/;
            return (reg.exec(first_selection.className)[1] != 
                    reg.exec(last_selection.className)[1]);
        }
        return true;
    }
}

function default_selection_ignored(node){
    // remove out from here
    node = $(node);
    return (node.hasClass('inpost')
            || node.hasClass('b-multimedia')
            || node.hasClass('photo')
            || node.is('script'));
}


$.TextSelectorMessage = function() {
    // XXX make a callback, do not include to standart package
    var $msg = $('#upmsg-selectable');
    var autoclose;

    this.show = function(){
        if (get_closed()) return;
        //if ($msg.hasClass('show')) return;
    
        $msg.addClass('show');
    
        if ($.browser.msie) {
            $msg.animate({
                'top': '0px'
            }, { duration: 1000, easing: 'easeOutQuint' });
        } else {
            $msg.animate({
                'top': '0px',
                'opacity': '1'
            }, { duration: 1000, easing: 'easeOutQuint' });
        }

        clearTimeout(autoclose);
        autoclose = setTimeout(closemsg, 10000);
    }


    $msg.find('.upmsg_closebtn').click(function(){
        closemsg();
        save_closed();
        clearTimeout(autoclose);
        return false;
    });

    function closemsg(){
        if ($.browser.msie) {
            $msg.animate({
                'top': '-57px'
            }, 500,  "easeInQuint", function(){ 
                $msg.removeClass('show');
            });
        } else {
            $msg.animate({
                'top': '-57px',
                'opacity': 0
            }, 500,  "easeInQuint", function(){ 
                $msg.removeClass('show');
            });
        }
        return false;
    }

    function save_closed(){
        if (window.localStorage){
            localStorage.selectable_warning = 'true';
        } else {
            $.cookie('selectable-warning', 'true');
        }
    }
    function get_closed(){
        if (window.localStorage){
            return !!localStorage.selectable_warning;
        } else {
            return !!$.cookie('selectable-warning');
        }
    }
}











// jQuery Extensions
$.fn.textNodes = function() {
    var ret = [];
    this.contents().each( function() {
        var fn = arguments.callee;
        if ( this.nodeType == 3 && $.trim(this.nodeValue) != '') 
            ret.push( this );
        else $(this).contents().each(fn);
    });
    return $(ret);
}

$.fn.cleanWhitespace = function() {
    textNodes = this.contents()
                    .filter(
                        function() { 
                            return (this.nodeType == 3 && !/\S/.test(this.nodeValue)); 
                        }
                    ).remove();
    return this;
}

$.fn.hasAttr = function(name) {  
    return this.attr(name) !== undefined;
};

$.fn.getCompiledStyle = function(strCssRule){
    // copypasted from Internets
    var elem = this[0];
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

