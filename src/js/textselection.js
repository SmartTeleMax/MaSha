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
        regexp: /[^\s,;:«»–.!?]+/ig,
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
                console.log('countingWord.wordCount: в wordCount func. node = ', node, '; nodeType = ', node.nodeType);
                if (node.nodeType == 3) { // Text only
                    _wcount += node.nodeValue.match(options.regexp).length;
                    console.log('countingWord.wordCount: эта нода', node, 'текстовая. Слов в ноде: '+ _wcount);
                } else if (node.childNodes && node.childNodes.length){ // Child element
                    var alltxtNodes = getTextNodesIn(node);
                    console.log('countingWord.wordCount: рассматриваемая нода имеет '+alltxtNodes.length+' чайлд(ов)');
                    console.log('alltxtNodes: ', alltxtNodes);
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
                _count += _node.nodeValue.length;
            } else if (_node.childNodes && _node.childNodes.length) {
                var i = _node.childNodes.length;
                while (i--) {
                    _cnode = _node.childNodes[i];
                    if (_cnode.nodeType == 3) {
                        _count += _cnode.nodeValue.length;
                    } else if (_cnode.childNodes && _cnode.childNodes.length) {
                        var ci = _cnode.childNodes.length;
                        while (ci--) {
                            _ccnode = _cnode.childNodes[ci];
                            if (_ccnode.nodeType == 3) {
                                _count += _ccnode.nodeValue.length;
                            } else if (_ccnode.childNodes && _ccnode.childNodes.length) {
                                alert('АХТУНГ! Внутри есть еще ноды!!');
                            }
                        }
                    }
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
        updateHash: function(){
            var hash = '';
            for (key in $.MaSha._sel.ranges) { 
                hash += $.MaSha._sel.ranges[key] + ';';
                }
            hash = hash.substring(hash.length-1, 0);
        
            location.hash = options.hashStart+hash;
        
            console.log('updateHash: ––––––––––––––––––––––––––––––');
            console.log('updateHash: обновляем хэш: ', hash);
            console.log('updateHash: ––––––––––––––––––––––––––––––');
        
        },
        readHash: function(){
            console.log('readHash: ––––––––––––––––––––––––––––––');

            var hash = location.hash;
            if (hash == '' || !hash) return;
        
            hash = hash.split('#')[1];
            hash = hash.substring(4, hash.length);
        
            hashAr = hash.split(';');
            console.log('readHash: из хэша получен массив меток выделений: ', hashAr);
            // восстанавливаем первое выделение + скроллим до него.
        
            for (var i=0; i < hashAr.length; i++) {
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
            var range = rangy.deserializeSelection(stamp);
            console.log('$.MaSha._sel.restoreStamp: запускаем $.MaSha._sel.tSelection(false)');
            $.MaSha._sel.tSelection(false, range);
            $.MaSha._sel.count++;
            console.log('$.MaSha._sel.restoreStamp: ––––––––––––––––––––––––––––––');
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
            console.log('checkSelection: ––––––––––––––––––––––––––––––');
            console.log('checkSelection: получен аргумент range = ', range);
            range = range || rangy.getSelection();
            console.log('checkSelection: range = ', range._ranges[0].endOffset, range._ranges[0].endContainer);
            var checker = range._ranges[0],
                startDone = false, endDone = false;
            
            console.log('checker', checker.endContainer.data.length, checker.endOffset);
        
            function kernel(offset, container, piu) {
                
                
                function stepBack(maxStep, statement) {

                    statement = statement || 'null';
                    // maxStep должен равняться str.length
                    for (var step=1; step<=maxStep; step++) {
                        console.log('checkSelection.stepBack: корректируем offset шагом назад. Шаг #', step, '; Проверяем символ "', container.data[offset - step], '"');
                        if (statement == 'null') {
                            if (container.data[offset - step].match(options.regexp) == null) {
                                console.log('checkSelection.stepBack: скорректированный offset определен = ', (offset-step+1));
                                return (offset-step+1)
                            }
                        }

                        if (statement == '!null') {
                            if (container.data[offset - step].match(options.regexp) != null) {
                                console.log('checkSelection.stepBack: скорректированный offset определен = ', (offset-step+1));
                                return (offset-step+1)
                            }
                        }
                    }
                    

                    
                }
                
                function stepForward(maxStep, statement) {
                    statement = statement || 'null';
                    var _step = 0;
                    for (var step=offset; step<container.data.length; step++) {
                        console.log('checkSelection.stepForward: корректируем offset шагом вперед. Шаг #', _step++, '; Проверяем символ ('+step+') "', container.data[step], '"');
                        if (statement == 'null') {
                            if (container.data[step].match(options.regexp) == null) {
                                console.log('checkSelection.stepForward: скорректированный offset определен = ', (step));
                                return (step)
                            }
                        }
                        if (statement == '!null') {
                            if (container.data[step].match(options.regexp) != null) {
                                console.log('checkSelection.stepForward: скорректированный offset определен = ', (step));
                                return (step)
                            }
                        }
                    }
                }

                function prevNode(){
                    var n = container, prev = null, _prev = null;
                    console.log('prevNode: container', container);
                    while (prev == null) {
                        n = n.parentNode;
                        if (n.nodeType == 1) {
                            console.log('n = ', n);
                            var allnodes = $(n).textNodes();
                            console.log('allnodes', allnodes);
                            if ( $(allnodes).index(container) == 0) {
                                prev = n.previousSibling;
                            } else if ( $(allnodes).index(container) > 0 ){
                                _prev = $(allnodes)[$(allnodes).index(container) - 1];
                                break;
                            }
                            
                        }
                    }
                    
                    
                    if (_prev != null) {
                        console.log('checkSelection.prevNode: найдена предыдущая соседка – нода', _prev);
                        return {_container: _prev, _offset: _prev.data.length}
                    } else {
                        console.log('checkSelection.prevNode: найден родитель nodeType == 1', n);
                        console.log('checkSelection.prevNode: предыдущий от родителя элемент = ', prev);
                        var prevNodeChilds = $(prev).textNodes();
                        console.log('checkSelection.prevNode: все текстовые ноды предыдущего элемента = ', prevNodeChilds);
                        var lastChild = prevNodeChilds[prevNodeChilds.length-1]
                        return {_container: lastChild, _offset: lastChild.data.length}
                    }

                    
                    
                }

                
                if (piu == 'start') {
                    
                    if (container.data[offset].match(options.regexp) == null) {
                        console.log('checkSelection: offset указывает на запрещенный символ. пробуем скорректировать шагами вперед.');
                        offset = stepForward(container.data.length - offset, '!null');
                        console.log('checkSelection: скорректированный offset = ', offset);
                    }
                    
                    if (container.data[offset].match(options.regexp) != null && offset != 0) {
                        console.log('checkSelection: offset указывает на букву. пробуем округлить до слова.');
                        offset = stepBack(offset);
                        console.log('checkSelection: скорректированный offset = ', offset);
                    }
                    
                    return offset;
                }
                
                if (piu == 'end') {
                    
                    if (offset == 0) {
                        var newdata = prevNode();
                        checker.setEnd(newdata._container, newdata._offset);
                        container = newdata._container;
                        offset = newdata._offset;
                    }
                    
                    if (container.data[offset-1].match(options.regexp) == null) {
                        console.log('checkSelection: offset указывает на запрещенный символ ['+container.data[offset-1]+']. пробуем скорректировать шагами назад.');
                        var _offset = stepBack(offset, '!null');
                        console.log('_offset', _offset);
                        if (!_offset) {
                            console.log('checkSelection: в ноде нет "слов", нашли ноду из предыдущего элемента');
                            //если нет внутри ноды ниодного слова
                            var newdata = prevNode();
                            container = newdata._container;
                            offset = newdata._offset;
                            checker.setEnd(container, offset);
                        } else {
                            offset = _offset;
                        }
                        console.log('checkSelection: скорректированный offset = ', offset);
                    }
                    
                    //console.log('offset', offset, 'container.data[offset-1]', container.data[offset-1]);
                    
                    if (container.data[offset-1].match(options.regexp) != null && offset != container.data.length) {
                        console.log('checkSelection: offset указывает на букву ['+container.data[offset-1]+']. пробуем округлить до полного слова шагами вперед.');
                        offset = stepForward(container.data.length - offset);
                        console.log('checkSelection: скорректированный offset = ', offset);
                    }
                    
                    if (offset == container.data.length) {
                        console.log('checkSelection: endOffset равен длине ноды, т.е. остается прежним =', offset);
                    }
                    
                    return offset;
                    
                }
                
            }
            
            
            var newStartOffset = kernel(checker.startOffset, checker.startContainer, 'start');
            var newEndOffset = kernel(checker.endOffset, checker.endContainer, 'end');
            
        
            checker.setStart(checker.startContainer, newStartOffset);
            checker.setEnd(checker.endContainer, newEndOffset);


            /*
            var checker_endContainer_data = checker.endContainer.data || '';
        
            if (checker.endOffset < checker_endContainer_data.length) {
                for (var i=0; i<checker.endContainer.data.length-checker.endOffset; i++) {
                    console.log('checkSelection: корректируем endовый offset. Шаг #', i, '; Проверяем символ "', checker.endContainer.data[checker.endOffset + i], '"');
                    //console.log('CORRECTING END OFFSET. Loop #', i, '; Check = "', checker.endContainer.data[checker.endOffset + i], '"');
                    console.log('-!!!!!!!!!!', new RegExp(options.regexp).test(checker.endContainer.data[checker.endOffset + i]));
                    if (new RegExp(options.regexp).test(checker.endContainer.data[checker.endOffset + i]) ) {

                    } else {
                        console.log('---!!!!!!!!!!', new RegExp(options.regexp).test(checker.endContainer.data[checker.endOffset + i]));
                        console.log('для доп if-a', checker.endContainer.data[(checker.endOffset + i)-1]);
                        if (!(new RegExp(options.regexp).test(checker.endContainer.data[(checker.endOffset + i)-1])) ) {
                            console.log('in added if');
                            checker.setEnd(checker.endContainer, checker.endOffset+(i-1));
                        } else {
                            checker.setEnd(checker.endContainer, checker.endOffset+i);
                        }
                    
                        console.log('checkSelection: endOffset скорректирован, теперь он ', checker.endOffset);
                        //checker.endOffset = checker.endOffset+i;
                        endDone = true;
                        break;
                    }
                }
                if (!endDone) {
                    checker.setEnd(checker.endContainer, checker.endOffset+i);
                }
            } else if (checker.endOffset == checker_endContainer_data.length) {
                for (var i=1; i<checker_endContainer_data.length; i++) {
                    console.log('checkSelection: корректируем endовый offset. Шаг назад #', i, '; Проверяем символ "', checker.endContainer.data[checker.endOffset - i], '"');
                    if ( (new RegExp(options.regexp).test(checker.endContainer.data[checker.endContainer.data.length - i])) ) {
                        checker.setEnd(checker.endContainer, checker.endOffset-(i-1));
                        console.log('checkSelection: endOffset скорректирован, теперь он ', checker.endOffset);
                        endDone = true;
                        break;
                    }
                }
            }
            
            
            /*
                if (checker.startOffset > 0) {
                    console.log('checkSelection: startOffset больше 0, т.е. выделение начинается не в начале ноды. Пробуем откорректировать выделение до ближайшего пробела.');
                    for (var i=0; i<=checker.startOffset; i++) {
                        console.log('checkSelection: корректируем стартовый offset. Шаг #', i, '; Проверяем символ "', checker.startContainer.data[checker.startOffset - i], '"');
                        console.log('!!!!!!!', !(new RegExp(options.regexp).test(checker.startContainer.data[checker.startOffset - i])));
                        if ( !(new RegExp(options.regexp).test(checker.startContainer.data[checker.startOffset - i])) ) {
                            console.log('+!!!!!!!', !(new RegExp(options.regexp).test(checker.startContainer.data[checker.startOffset - i])));
                            //checker.startOffset = checker.startOffset-i+1;
                            checker.setStart(checker.startContainer, checker.startOffset-i+1);
                            console.log('checkSelection: startOffset скорректирован, теперь он ', checker.startOffset);
                            startDone = true;
                            break;
                        }
                    }
                    if (!startDone) {
                        checker.setStart(checker.startContainer, checker.startOffset-i+1);
                    }

                } else if (checker.startOffset == 0) {
                    for (var i=0; i<checker.startContainer.data.length; i++) {
                        console.log('checkSelection: корректируем startовый offset. Шаг вперед #', i, '; Проверяем символ "', checker.startContainer.data[checker.startOffset + i], '"');
                        if (new RegExp(options.regexp).test(checker.startContainer.data[checker.startOffset + i]) ) {
                            checker.setStart(checker.startContainer, checker.startOffset+(i));
                            console.log('checkSelection: startOffset скорректирован, теперь он ', checker.startOffset);
                            startDone = true;
                            break;
                        }
                    }
                }
                */
            //sel.setRanges(checker);
            console.log('checkSelection: checker = ', checker);
        
            console.log('checkSelection: ––––––––––––––––––––––––––––––');
        
            $.MaSha._sel.aftercheck = []; $.MaSha._sel.aftercheck.push(checker);
        
            return checker;

        },
        tSelection:function(hash, range) {
        
            range = range || false;
        
            range = $.MaSha._sel.checkSelection(range);
        
            if (!hash){
            // генерируем и сохраняем якоря для выделенного
            $.MaSha._sel.ranges['num'+$.MaSha._sel.count] = rangy.serializeSelection();
            }

            addSelection.toggleSelection();
            $('.user_selection')
                    .addClass('user_selection_true')
                    .addClass('num'+$.MaSha._sel.count)
                    .removeClass('user_selection');

            // сохраняем выделенное
            //console.log('сохраняем выделенное');
            $.MaSha._sel.savedSel['num'+$.MaSha._sel.count] = rangy.saveSelection();
            $.MaSha._sel.savedSelActiveElement['num'+$.MaSha._sel.count] = document.activeElement;
            //console.log($.MaSha._sel.savedSel['num'+selection.count], $.MaSha._sel.savedSelActiveElement['num'+selection.count]);

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

            rangy.getSelection().removeAllRanges();
        },
        getFirstRange: function(){
            var sel = rangy.getSelection();
            return sel.rangeCount ? sel.getRangeAt(0) : null;
        },
        restoreSelection: function(selector) {
            if ($.MaSha._sel.savedSel[selector]) {
                rangy.restoreSelection($.MaSha._sel.savedSel[selector], true);
                //savedSel = null;
                window.setTimeout(function() {
                    if ($.MaSha._sel.savedSelActiveElement[selector] && typeof $.MaSha._sel.savedSelActiveElement[selector].focus != "undefined") {
                        $.MaSha._sel.savedSelActiveElement[selector].focus();
                    }
                }, 1);
                return true;
            } else {
                return false;
            }
        },
        onlytSelection: function(obj){
            obj.toggleSelection();
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
    
        rangy.init();
        
        var range = rangy.createRangyRange();
    
        $.MaSha._sel.elNum();
    
        var marker = $(''+options.selectorMarker);
        var textselect_event = true, dontshow = false;
    
        $(document).bind('textselect', function(e) {
            if (e.text == '' || !options.regexp.test(e.text)) return;
            if (!textselect_event) return;

            var nodes = $.MaSha._sel.getFirstRange().getNodes();

            for (var i=0; i<nodes.length; i++) { 
                if (!$(nodes[i]).parents(''+options.selectorSelectable).length
                    || $(nodes[i]).parents('.user_selection_true').length
                    || $(nodes[i]).parents('div.b-multimedia').length
                    || $(nodes[i]).parents('div.inpost').length) { 
                        return; 
                        break; 
                    } 
                if (nodes[i].nodeType == 1) {
                    if ($(nodes[i]).hasClass('user_selection_true')
                     || $(nodes[i]).hasClass('inpost')
                     || $(nodes[i]).hasClass('b-multimedia')
                     || $(nodes[i]).hasClass('photo')) {
                         //alert('отказ');
                         //console.log('отказ! все из-за ', nodes[i]);
                         return;
                         break;
                     }
                }
            }
        
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
            
            dontshow = true;
        
            $.MaSha._sel.tSelection();
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
                var res = $.MaSha._sel.restoreSelection(numclass);
            
                if (res == true) {
                    ////console.log('res', res);
                    removeSelection2.cssClass = numclass;
                    $.MaSha._sel.onlytSelection(removeSelection2);
                    $.MaSha._sel.onlytSelection(removeSelection1);
                    $.MaSha._sel.count = $.MaSha._sel.count - 1;
                    delete $.MaSha._sel.ranges[numclass];
                    $.MaSha._sel.updateHash();

                    rangy.getSelection().removeAllRanges();
                }
            });

            return false;
        });



    



        var cssClassApplierModule = rangy.modules.CssClassApplier;
        if (rangy.supported && cssClassApplierModule && cssClassApplierModule.supported) {
            addSelection = rangy.createCssClassApplier("user_selection", true);
            removeSelection1 = rangy.createCssClassApplier("user_selection_true", true);
            removeSelection2 = rangy.createCssClassApplier("num", true);
        }
    
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
