// Event text-selection handler
(function($) {
	$.event.special.textselect = {
		setup: function(data, namespaces) {
			$(this).data("textselected",false);
			$(this).bind('mouseup', $.event.special.textselect.handler);
		},
		teardown: function(data) {
			$(this).unbind('mouseup', $.event.special.textselect.handler);
		},
		handler: function(event) { 
			var text = $.event.special.textselect.getSelectedText().toString(); 
			if (text != '') {
				$(this).data("textselected",true);
				event.type = "textselect";
				event.text = text;
				$.event.handle.apply(this, arguments);
			}
		},
		getSelectedText: function() {
			var text = '';
				if (window.getSelection) {
				 text = window.getSelection();
				} else if (document.getSelection) {
					text = document.getSelection();
					} else if (document.selection) {
					text = document.selection.createRange().text;
				}
			return text;
		}
	};
})(jQuery);


jQuery.MaSha = function(options) {
        
    var defaults = {
        regexp: /[^\s,;:«»–.!?<>…\n]+/ig,
        hashStart: 'sel=',
        selectorSelectable: '#selectable-content',
        selectorMarker: '#txtselect_marker',
        ellipsisText: "..."
    };
    
    var options = $.extend(defaults, options);
    
    jQuery.MaSha.options = options;
    
    //get text nodes in element function (old)
    var getTextNodesIn = (function() {
        function textNodeFilter() {
            return (this.nodeType == 3 && this.nodeValue.length > 0 && (options.regexp.test(this.nodeValue)));
        }

        return function(el) {
            var $el = $(el);
            return $el
                .contents()
                .filter(textNodeFilter)
                .add(
                    $el
                       .find("*")
                       .contents()
                       .filter(textNodeFilter)
                );
        };
    })();

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
    }
    
    $.fn.hasAttr = function(name) {  
        return this.attr(name) !== undefined;
    };

    // init base var
    var addSelection, removeSelection1, removeSelection2, logger_count = 0;


    // init counting symbols/word functions
    $.MaSha._len = {
        words: function(_container, _offset, pos){
            console.log('countingWord: ––––––––––––––––––––––––––––––––––––––––––––––––');
            console.log('countingWord: подсчет слов. аргументы: _container =', _container, '; _offset = ', _offset);
            
            
            
            function wordCount(node) {
                var _wcount = 0;
                //console.log('countingWord.wordCount: в wordCount func. node = ', node, '; nodeType = ', node.nodeType);
                if (node.nodeType == 3) { // Text only
                    _wcount += node.nodeValue.match(options.regexp).length;
                    //console.log('countingWord.wordCount: эта нода', node, 'текстовая. Слов в ноде: '+ _wcount);
                } else if (node.childNodes && node.childNodes.length){ // Child element
                    var alltxtNodes = getTextNodesIn(node);
                    //console.log('countingWord.wordCount: рассматриваемая нода имеет '+alltxtNodes.length+' чайлд(ов)');
                    //console.log('alltxtNodes: ', alltxtNodes);
                    for (i=0; i<alltxtNodes.length; i++) {
                        console.log('countingWord.wordCount: Шаг №', i, '. Считаем кол-во слов в ноде', alltxtNodes[i], '. Слов = ', alltxtNodes[i].nodeValue.match(options.regexp).length);
                        _wcount += alltxtNodes[i].nodeValue.match(options.regexp).length;
                        console.log('_wcount = ', _wcount);
                    }
                }
                console.log('countingWord.wordCount: возвращаю _wcount = ', _wcount);
                return _wcount;
            }
        
        
            if (_container.nodeType == 1) {
                _container = getTextNodesIn(_container)[0];
            }
            // вычитаем из start/end Container кусок текста, который входит в выделенное. Оставшееся разбиваем регекспом, и считаем кол-во слов.
            testu2 = $(_container).clone();
            var wcount = _container.data.substring(0, _offset).match(options.regexp);
            
            console.log('wcount', wcount);
            if (wcount != null) { 
                if (pos=='start') wcount = wcount.length+1; 
                if (pos=='end') wcount = wcount.length;
            } else { 
                wcount = 1;
            }
            console.log('countingWord: в '+pos+'Container ноде до начала выделения слов:', wcount);

            n = _container.previousSibling;

            while (n) {
                if (pos=='end') {
                    console.log('countingWord: подсчитываем слова в одной из предыдущих от '+pos+'Container ноде[n] = ', n);
                } else {
                    console.log('countingWord: подсчитываем слова в '+pos+'Container ноде[n] = ', n);
                }
                var onei = wordCount(n);
                wcount += onei;
                console.log('countingWord: в ноде ', n, ' подсчитано ', onei, 'слов. Теперь в общей копилке ', wcount, 'слов');
                n = n.previousSibling;
            }

            console.log('countingWord: итог работы (кол-во слов до первого/последнего слова)', wcount);
            console.log('countingWord: ––––––––––––––––––––––––––––––––––––––––––––––––');

            return wcount;
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
        }
    }

    // init main object
    $.MaSha._sel = {
        count: 0,
        savedSel: [],
        savedSelActiveElement: [],
        ranges: {},
        rootNode: 'selectable-content',
        aftercheck: [],
        logger: function(str){
            logger_count++;
            $('#logger').append('<p style="font-size:12px;text-align: left;">#'+logger_count+' | '+str+'</p>');
        },
        childs: [],
        updateHash: function(_delete){
            _delete = _delete || false;
            var hash = '';
            var nowhash = location.hash;
            
            
            if (_delete) {
                nowhash = nowhash.replace(_delete+';', '');
                location.hash = nowhash;
            } else {
                for (key in $.MaSha._sel.ranges) { 
                    if (nowhash.indexOf($.MaSha._sel.ranges[key]) == -1) {
                        hash += $.MaSha._sel.ranges[key] + ';';
                    }
                }
                if (nowhash.indexOf('sel=') == -1) {
                    nowhash = options.hashStart;
                    nowhash = nowhash+hash;
                } else {
                    nowhash = nowhash+hash;
                }
                location.hash = nowhash;
            }
            

        
            
        
            console.log('updateHash: ––––––––––––––––––––––––––––––');
            console.log('updateHash: обновляем хэш: ', hash);
            console.log('updateHash: ––––––––––––––––––––––––––––––');
        
        },
        readHash: function(){
            console.log('readHash: ––––––––––––––––––––––––––––––');

            var hash = location.hash;
            if (!hash) return;
        
            hash = hash.split('#')[1];

            if(! /sel\=(?:\d+\:\d+\,\d+\:\d+;)*\d+\:\d+\,\d+\:\d+/.test(hash)) return;

            hash = hash.substring(4, hash.length);
        
            hashAr = hash.split(';');
            console.log('readHash: из хэша получен массив меток выделений: ', hashAr);
            // восстанавливаем первое выделение + скроллим до него.
        
            for (var i=0; i < hashAr.length-1; i++) {
                console.log('readHash: восстанавливаем метку [запускаем $.MaSha._sel.restoreStamp('+hashAr[i]+');]');
                $.MaSha._sel.restoreStamp(hashAr[i]);
            }

            // Вычисляем кол-во px от верха до первого выделенного участка текста, далее - скроллим до этого места.
            var scrollTo = $('.user_selection_true:first').offset().top - 150;
            $('html,body').animate({
                scrollTop:scrollTo
                }, 1500,  "easeInOutQuint");

            console.log('readHash: ––––––––––––––––––––––––––––––');

        },
        restoreStamp: function(stamp){
            console.log('$.MaSha._sel.restoreStamp: ––––––––––––––––––––––––––––––');
            console.log('$.MaSha._sel.restoreStamp: запускаем rangy.deserializeSelection('+stamp+')');
            var range = $.MaSha._sel.deserializeSelection(stamp);
            console.log('$.MaSha._sel.restoreStamp: запускаем $.MaSha._sel.tSelection(false)');
            $.MaSha._sel.tSelection(false, range);
            $.MaSha._sel.count++;
            console.log('$.MaSha._sel.restoreStamp: ––––––––––––––––––––––––––––––');
        },
        deserializeSelection: function(stamp) {
            
            rootNode = document.getElementById($.MaSha._sel.rootNode);
            //console.log('deserializeSelection', rootNode);
            if (rootNode) {
                win = win || window;
            } else {
                win = win || window;
                rootNode = win.document.documentElement;
            }

            var serializedRanges = serialized.split("|");
            var sel = window.getSelection();
            console.log('deserializeSelection: sel=', sel)
            var ranges = [];
            if(sel.rangeCount > 0) sel.removeAllRanges();

            for (var i = 0, len = serializedRanges.length; i < len; ++i) {
                sel.addRange(deserializeRange(serializedRanges[i], rootNode, win.document));
            }
            
            function deserializePosition(serialized, rootNode, doc, pos){
                 var bits = serialized.split(":");
                 var node = rootNode;
                 var el = $('.nodeNum_'+bits[0]);

                 var pos_text;

                 console.log('deserializePosition: Осуществляем подсчет '+pos+'-овой позиции');
                 console.log('deserializePosition: выбран элемент = ', el);
                 console.log('deserializePosition: в выбранном элементе '+$(el).contents().length+' childNodes');

                 var re = new RegExp ('[^\\s,;:«»–.!?]+', 'ig');

                 var offset, stepCount = 0, exit = false;
                 console.log('deserializePosition: ищем по счету '+bits[1]+' слово. Запускаем цикл перебора всех слов родительского элемента.');
                 var _allnodes = $(el).textNodes();
                 for (i=0; i<_allnodes.length; i++) {
                     while ((myArray = re.exec( _allnodes[i].data )) != null) {
                         stepCount++;
                         console.log('deserializePosition: слово №'+stepCount+' = "', myArray[0], '"; (startoffset =', myArray.index, ', endoffset =', re.lastIndex, ')');
                         if (stepCount == bits[1]) {
                             if (pos=='start') offset = myArray.index;
                             if (pos=='end') offset = re.lastIndex;

                             console.log('deserializePosition: '+pos+'овое слово найдено = ', myArray[0], '. Целевая нода = ', _allnodes[i], '. Символьный offset = ', offset);
                             node = _allnodes[i];
                             break;
                         } else {
                             //console.log('пустой проход.', stepCount, '|', bits[1]);
                         }

                     }
                 }
                 return {node: node, offset: parseInt(offset, 10)};
            }
            function deserializeRange(serialized, rootNode, doc){
                rootNode = rootNode || document.getElementById($.MaSha._sel.rootNode);
                if (rootNode) {
                    doc = doc || document;
                } else {
                    doc = doc || document;
                    rootNode = doc.documentElement;
                }
                var result = /^([^,]+),([^,]+)({([^}]+)})?$/.exec(serialized);

                var start = deserializePosition(result[1], rootNode, doc, 'start'), end = deserializePosition(result[2], rootNode, doc, 'end');
                var range = document.createRange();
                range.setStart(start.node, start.offset);
                range.setEnd(end.node, end.offset);
                return range;
            }

            return sel;
        },
        serializeSelection: function(selection, rootNode) {
            rootNode = document.getElementById($.MaSha._sel.rootNode);
            console.log('serializeSelection: selection = ', selection);

            selection = selection || window.getSelection();

            var ranges = $.MaSha._sel.aftercheck, serializedRanges = [];
            //var ranges = selection.getAllRanges(), serializedRanges = [];

            for (var i = 0, len = ranges.length; i < len; ++i) {
                serializedRanges[i] = serializeRange(ranges[i], rootNode);
            }
            
            
            function serializeRange(range, rootNode) {
                var serialized = serializeWord(range.startContainer, range, 'start', rootNode) + "," +
                    serializeWord(range.endContainer, range, 'end', rootNode);
                return serialized;
            }
            function serializeWord(node, range, piu, rootNode) {

                offset = 0;
                var pathBits = [], n = node;
                var nodeNum;

                if ($(node).hasAttr('nodeNum')) {
                    nodeNum = $(node).attr('nodeNum');
                } else if ($(node.parentNode).hasAttr('nodeNum')){
                    nodeNum = $(node.parentNode).attr('nodeNum');
                }

                if (piu=='start'){
                    offset = $.MaSha._len.words(range.startContainer, range.startOffset, piu);
                } else {
                    offset = $.MaSha._len.words(range.endContainer, range.endOffset, piu);
                }
                return nodeNum + ':' + offset;
            }
            
            return serializedRanges.join("|");
        },

        upmsg: function(){
            $msg = $('#upmsg-selectable');
        
            if ($.cookie('selectable-warning') == 'notshow') return;
            if ($msg.hasClass('show')) return;
        
            $msg.addClass('show');
        
            clearTimeout(autoclose);
        
            var opacity_start = 0;
        
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
                        'opacity': opacity_start
                    }, 500,  "easeInQuint", function(){ 
                        $msg.removeClass('show');
                    });
                }
                clearTimeout(autoclose);
                return false;
            }
        
            var autoclose = setTimeout(closemsg, 10000);
            $('.upmsg_closebtn', $msg).click(function(){
                $.cookie("selectable-warning", 'notshow');
                closemsg();
                return false;
            });
        
        },
        checkSelection: function(range) {
            /*
             * Corrects selection.
             * Returns checker object
             */
            console.log('checkSelection: ––––––––––––––––––––––––––––––');
            console.log('checkSelection: получен аргумент range = ', range);
            range = range || $.MaSha._sel.getFirstRange();
            console.log('checkSelection: range = ', range.endOffset, range.endContainer);
            var checker = range,
                startDone = false, endDone = false;
            
        
            var newStartOffset = kernel(checker.startOffset, checker.startContainer, 'start');
            var newEndOffset = kernel(checker.endOffset, checker.endContainer, 'end');
            
        
            checker.setStart(checker.startContainer, newStartOffset);
            checker.setEnd(checker.endContainer, newEndOffset);
            console.log('checkSelection: checker = ', checker);
        
            console.log('checkSelection: ––––––––––––––––––––––––––––––');
        
            $.MaSha._sel.aftercheck = []; $.MaSha._sel.aftercheck.push(checker);
        
            return checker;

            function kernel(offset, container, position) {
                
                function is_word(str){
                    return str.match(options.regexp) != null;
                }

                function is_not_word(str){
                    return str.match(options.regexp) == null;
                }

                function stepBack(container, offset, condition) {
                    var init_offset = offset;
                    console.log('checkSelection.stepBack: offset: ', offset);
                    while (offset > 0 && condition(container.data[offset-1])){
                        console.log('checkSelection.stepBack: корректируем offset шагом назад. '+ 
                                    'Шаг #', init_offset - offset + 1, '; '+
                                    'Проверяем символ "', container.data[offset - 1], '"');
                        offset--;
                    }
                    console.log('checkSelection.stepBack: корректируем offset шагом назад. '+ 
                                'Шаг #', init_offset - offset + 1, '; '+
                                'Проверяем символ "', container.data[offset - 1], '"');
                    return offset;
                }
                
                function stepForward(container, offset, condition) {
                    var init_offset = offset;
                    console.log('checkSelection.stepForward: offset: ', offset);
                    while (offset < container.data.length && condition(container.data[offset])){
                        console.log('checkSelection.stepForward: корректируем offset шагом назад. '+ 
                                    'Шаг #', offset - init_offset + 1, '; '+
                                    'Проверяем символ "', container.data[offset], '"');
                        offset++;
                    }
                    console.log('checkSelection.stepForward: корректируем offset шагом назад. '+ 
                                'Шаг #', offset - init_offset + 1, '; '+
                                'Проверяем символ "', container.data[offset], '"');
                    return offset;
                }

                function _siblingNode(cont, prevnext, firstlast, offs){
                    console.log('getting', prevnext, cont);
                    while (cont.parentNode && $(cont).parents(options.selectorSelectable).length){
                        while (cont[prevnext + 'Sibling']){
                            cont = cont[prevnext + 'Sibling'];
                            while (cont.nodeType == 1 && cont.childNodes.length){
                                cont = cont[firstlast + 'Child'];
                            }
                            if (cont.nodeType == 3 && cont.data.match(options.regexp) != null){
                                console.log('getting ' + prevnext +  ': _container:', cont.data,
                                            '_offset:', offs * cont.data.length);
                                return {_container: cont, _offset: offs * cont.data.length};
                            }
                        }
                        cont = cont.parentNode;
                    }
                }

                function prevNode(cont){
                    return _siblingNode(cont, 'previous', 'last', 1);
                }
                function nextNode(cont){
                    return _siblingNode(cont, 'next', 'first', 0);
                }
                
                if (position == 'start') {
                    if (container.nodeType != 3 ||
                        container.data.substring(offset).match(options.regexp) == null) {
                        var newdata = nextNode(container);
                        checker.setStart(newdata._container, newdata._offset);
                        container = newdata._container;
                        offset = newdata._offset;
                        console.log('offset', offset);
                    }

                    // Важно! Сначала сокращаем выделение, потом расширяем
                    offset = stepForward(container, offset, is_not_word);
                    console.log('checkSelection: скорректированный offset = ', offset);
                
                    offset = stepBack(container, offset, is_word);
                    console.log('checkSelection: скорректированный offset = ', offset);
                    
                    return offset;
                }
                
                if (position == 'end') {
                    if (container.nodeType != 3 ||
                        container.data.substring(0, offset).match(options.regexp) == null) {
                        var newdata = prevNode(container);
                        checker.setEnd(newdata._container, newdata._offset);
                        container = newdata._container;
                        offset = newdata._offset;
                        console.log('offset', offset);
                    }
                    
                    // Важно! Сначала сокращаем выделение, потом расширяем
                    offset = stepBack(container, offset, is_not_word);
                    console.log('checkSelection: скорректированный offset = ', offset);

                    offset = stepForward(container, offset, is_word);
                    console.log('checkSelection: скорректированный offset = ', offset);

                    return offset;
                    
                }
                
            }
        },
        addSelection:function(hash, range) {
        
            range = range || false;
        
            range = $.MaSha._sel.checkSelection(range);
        
            if (!hash){
                // генерируем и сохраняем якоря для выделенного
                $.MaSha._sel.ranges['num'+$.MaSha._sel.count] = $.MaSha._sel.serializeSelection();
            }


            /* ВМЕСТО ЭТОГО ДОЛЖНА БЫТЬ ФУНКЦИЯ ОБОРАЧИВАНИЯ
            addSelection.toggleSelection();
            $('.user_selection')
                    .addClass('user_selection_true')
                    .addClass('num'+$.MaSha._sel.count)
                    .removeClass('user_selection');
            */

            var timeout_hover, timeout_hover_b = false;
            var _this;

            function unhover() { 
                if (timeout_hover_b) $("."+_this.className.split(' ')[1]).removeClass("hover"); 
            }

            $(".num"+$.MaSha._sel.count).mouseover(function(){
                _this = this;
                //console.log($(this), this.classList[1], $("."+this.classList[1]));
                $("."+this.className.split(' ')[1]).addClass('hover');
                timeout_hover_b = false;
                clearTimeout(timeout_hover);
            });

            $(".num"+$.MaSha._sel.count).mouseleave(function(){
                timeout_hover_b = true;
                var timeout_hover = setTimeout(unhover, 2000);
            });

            $('.num'+$.MaSha._sel.count+':last').append('<span class="closewrap"><a href="#" class="txtsel_close"></a></span>');
        
            hash = hash || true;
            if (hash) $.MaSha._sel.updateHash();

            window.getSelection().removeAllRanges();
        },
        getFirstRange: function(){
            var sel = window.getSelection();
            return sel.rangeCount ? sel.getRangeAt(0) : null;
        },
        onlytSelection: function(obj){
            /* Здесь вызов функции оборачивалки (удаление выделения)
            obj.toggleSelection();
            */
        },
        elNum: function(){
            var counter = 0;
            $(options.selectorSelectable+' *').each(function(){
                if (!$(this).is('img') ||
                    !$(this).is('script')) {
                        $(this).attr('nodeNum', counter);
                        $(this).addClass('nodeNum_'+counter);
                        counter ++;
                }
            });
            var tt = counter - 100;
            //alert($('.nodeNum_'+tt).text());
        
            return counter;
        }
    }

    
    $(function(){

        if (!$(''+options.selectorSelectable).length) return;
    
        $(''+options.selectorSelectable).cleanWhitespace();
        $(options.selectorSelectable+' *').cleanWhitespace();
    
        
    
        $.MaSha._sel.elNum();
    
        var marker = $(''+options.selectorMarker);
        var textselect_event = true, dontshow = false;

        function range_is_selectable(){
            // getNodes() это от rangy вроде.
            var nodes = $($.MaSha._sel.getFirstRange()).contents();

            for (var i=0; i<nodes.length; i++) { 
                if (!$(nodes[i]).parents(''+options.selectorSelectable).length
                    || $(nodes[i]).parents('.user_selection_true').length
                    || $(nodes[i]).parents('div.b-multimedia').length
                    || $(nodes[i]).parents('div.inpost').length) { 
                        return false; 
                    } 
                if (nodes[i].nodeType == 1) {
                    if ($(nodes[i]).hasClass('user_selection_true') // XXX merge selections?
                     || $(nodes[i]).hasClass('inpost')
                     || $(nodes[i]).hasClass('b-multimedia')
                     || $(nodes[i]).hasClass('photo')) {
                         //alert('отказ');
                         //console.log('отказ! все из-за ', nodes[i]);
                         return false;
                     }
                }
            }
            return true;
        }
    
        $(document).bind('textselect', function(e) {
            if (e.text == '' || !options.regexp.test(e.text)) return;
            if (!textselect_event) return;
            if (!range_is_selectable()) return;

       
            window.setTimeout(function(){
                if (!dontshow) {
                    $(marker).css({'top':e.pageY-33, 'left': e.pageX+5});
                    if ($.browser.msie) {
                        $(marker).addClass('show');
                    } else {
                        $(marker).fadeIn('fast', function(){
                            $(marker).addClass('show');
                        });
                    }
                }
            }, 1);
        });
    
    
    
        $(marker).click(function(e){
            e.preventDefault();
            if (!range_is_selectable()){
                $(marker).removeClass('show').css('display', 'none');
                console.log('Range is not selectable')
                return;
            }
            
            dontshow = true;
        
            $.MaSha._sel.addSelection();
            $.MaSha._sel.count++;
        
            if ($.browser.msie) {
                $(marker).removeClass('show');
                $.MaSha._sel.upmsg();
                dontshow = false;
            } else {
                $(marker).fadeOut('fast', function(){
                    $(this).removeClass('show');
                    $.MaSha._sel.upmsg();
                    dontshow = false;
                });
            }
        
        });
    
        $('.closewrap a.txtsel_close').live('click', function(){
            var parent = this.parentNode.parentNode;
            var numclass = parent.className.split(' ')[1];
            $('.'+numclass).removeClass('hover');
            $(this).fadeOut('slow', function(){
                $(this).parent('span.closewrap').remove();
                
                // ЗДЕСЬ ДОЛЖНА БЫТЬ ФУНКЦИЯ УДАЛЕНИЯ ВЫДЕЛЕНИЯ
                // И ОБНОВЛЕНИЕ ХЭША
                
            });

            return false;
        });



    




        $(document).click(function(e){
            tar = $(e.target);
            if (tar.attr('id') != 'txtselect_marker') {
                dontrun = false;
                if($('#txtselect_marker').hasClass('show')){
                    if ($.browser.msie) {
                        $('#txtselect_marker').removeClass('show');
                    } else {
                        $('#txtselect_marker').fadeOut('fast', function(){
                            $(this).removeClass('show');
                        });
                    }
                }
            }
        });
    
        $('body').append('<div id="logger" style="position:fixed; bottom:0; left:0; width: 100%; height: auto; background: white; max-height: 150px; overflow: auto;"></div>');
        $.MaSha._sel.readHash();
    });

  

};
