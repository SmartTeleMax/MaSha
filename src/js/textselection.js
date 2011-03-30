var getTextNodesIn = (function() {
    function textNodeFilter() {
        return (this.nodeType == 3 && this.nodeValue.length > 0 && (/[^\s,;:«».!?]+/ig.test(this.nodeValue)));
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
      if ( this.nodeType == 3 ) 
        ret.push( this );
      else $(this).contents().each(fn);
  });
  return $(ret);
}

jQuery.fn.cleanWhitespace = function() {
    textNodes = this.contents().filter(
        function() { return (this.nodeType == 3 && !/\S/.test(this.nodeValue)); })
        .remove();
    }
    
$.fn.hasAttr = function(name) {  
    return this.attr(name) !== undefined;
};

var addSelection, removeSelection1, removeSelection2, logger_count = 0;
var rrr = [];

var _len = {
    words: function(_container, _offset, pos){
        console.log('countingWord: ––––––––––––––––––––––––––––––––––––––––––––––––');
        console.log('countingWord: подсчет слов. аргументы: _container =', _container, '; _offset = ', _offset);

        function wordCount(node) {
            var _wcount = 0;
            console.log('countingWord.wordCount: в wordCount func. node = ', node, '; nodeType = ', node.nodeType);
            if (node.nodeType == 3) { // Text only
                _wcount += node.nodeValue.match(/[^\s,;:«».!?]+/ig).length;
                console.log('countingWord.wordCount: эта нода', node, 'текстовая. Слов в ноде: '+ _wcount);
            } else if (node.childNodes && node.childNodes.length){ // Child element
                var alltxtNodes = getTextNodesIn(node);
                console.log('countingWord.wordCount: рассматриваемая нода имеет '+alltxtNodes.length+' чайлд(ов)');
                console.log('alltxtNodes: ', alltxtNodes);
                for (i=0; i<alltxtNodes.length; i++) {
                    console.log('countingWord.wordCount: Шаг №', i, '. Считаем кол-во слов в ноде', alltxtNodes[i], '. Слов = ', alltxtNodes[i].nodeValue.match(/[^\s,;:«».!?]+/ig).length);
                    _wcount += alltxtNodes[i].nodeValue.match(/[^\s,;:«».!?]+/ig).length;
                    console.log('_wcount = ', _wcount);
                }
                
                /*
                while (i--) {
                    // assign node variable to childs object
                    cnode = node.childNodes[i];
                    // text node found, do the replacement
                    if (cnode.nodeType == 3) {
                        if (cnode.nodeValue != null || cnode.nodeValue != ''){
                            var __temp = cnode.nodeValue.match(/[^\s,;:.!?]+/ig);
                            rrr.push(cnode);
                            console.log('countingWord.wordCount: cnode = ', cnode, ';  __temp = ', __temp);
                            if (__temp != null) {
                                _wcount += __temp.length;
                            } else {
                                __temp = [];
                            }
                            console.log('countingWord.wordCount: чайлд текстовый. кол-во слов: '+__temp.length);
                            console.log('countingWord.wordCount: теперь в _wcount', _wcount);
                        }
                    } else if (cnode.childNodes && cnode.childNodes.length) {
                        console.log('countingWord.wordCount: чайлд ', cnode, 'имеет своих чайлдов. обработаем их');
                        _wcount = wordCount(cnode);
                    }
                }
                */
            }
            console.log('countingWord.wordCount: возвращаю _wcount = ', _wcount);
            return _wcount;
        }
        
        
        if (_container.nodeType == 1) {
            _container = getTextNodesIn(_container)[0];
        }
        // вычитаем из start/end Container кусок текста, который входит в выделенное. Оставшееся разбиваем регекспом, и считаем кол-во слов.
        var wcount = _container.data.substring(0, _offset).match(/[^\s,;:«».!?]+/ig);
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

var _sel = {
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
        for (key in _sel.ranges) { 
            hash += _sel.ranges[key] + ';';
            }
        hash = hash.substring(hash.length-1, 0);
        
        location.hash = 'sel='+hash;
        
        console.log('_sel.updateHash: ––––––––––––––––––––––––––––––');
        console.log('_sel.updateHash: обновляем хэш: ', hash);
        console.log('_sel.updateHash: ––––––––––––––––––––––––––––––');
        
    },
    readHash: function(){
        console.log('_sel.readHash: ––––––––––––––––––––––––––––––');

        var hash = location.hash;
        if (hash == '' || !hash) return;
        
        hash = hash.split('#')[1];

        hash = hash.substring(4, hash.length);
        
        
        
        hashAr = hash.split(';');
        console.log('_sel.readHash: из хэша получен массив меток выделений: ', hashAr);
        // восстанавливаем первое выделение + скроллим до него.
        //selection.restoreStamp(hashAr[0], true);
        
        for (var i=0; i < hashAr.length; i++) {
            //console.log('i', i, 'hashAr', hashAr, 'hashAr.length', hashAr.length);
            console.log('_sel.readHash: восстанавливаем метку [запускаем _sel.restoreStamp('+hashAr[i]+');]');
            _sel.restoreStamp(hashAr[i]);
            
        }
        

        // Вычисляем кол-во px от верха до первого выделенного участка текста, далее - скроллим до этого места.
        var scrollTo = $('.user_selection_true:first').offset().top - 150;
        $('html,body').animate({
            scrollTop:scrollTo
            }, 1500,  "easeInOutQuint");
        
        
        
        console.log('_sel.readHash: ––––––––––––––––––––––––––––––');

    },
    restoreStamp: function(stamp){
        //scrolled = scrolled || false;
        console.log('_sel.restoreStamp: ––––––––––––––––––––––––––––––');
        console.log('_sel.restoreStamp: запускаем rangy.deserializeSelection('+stamp+')');
        var range = rangy.deserializeSelection(stamp);
        console.log('_sel.restoreStamp: запускаем _sel.tSelection(false)');
        _sel.tSelection(false, range);
        _sel.count++;
        console.log('_sel.restoreStamp: ––––––––––––––––––––––––––––––');
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
        console.log('checkSelection: range = ', range);
        var checker = range._ranges[0],
            startDone = false, endDone = false;
        
        if (checker.startOffset > 0) {
            console.log('checkSelection: startOffset больше 0, т.е. выделение начинается не в начале ноды. Пробуем откорректировать выделение до ближайшего пробела.');
            for (var i=0; i<=checker.startOffset; i++) {
                console.log('checkSelection: корректируем стартовый offset. Шаг #', i, '; Проверяем символ "', checker.startContainer.data[checker.startOffset - i], '"');
                if ( !(/[^\s,;:«».!?]+/ig.test(checker.startContainer.data[checker.startOffset - i])) ) {
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
                if ( (/[^\s,;:«».!?]+/ig.test(checker.startContainer.data[checker.startOffset + i])) ) {
                    checker.setStart(checker.startContainer, checker.startOffset+(i));
                    console.log('checkSelection: startOffset скорректирован, теперь он ', checker.startOffset);
                    startDone = true;
                    break;
                }
            }
        }
        
        var checker_endContainer_data = checker.endContainer.data || '';
        
        if (checker.endOffset < checker_endContainer_data.length) {
            
            for (var i=0; i<checker.endContainer.data.length-checker.endOffset; i++) {
                console.log('checkSelection: корректируем endовый offset. Шаг #', i, '; Проверяем символ "', checker.endContainer.data[checker.endOffset + i], '"');
                //console.log('CORRECTING END OFFSET. Loop #', i, '; Check = "', checker.endContainer.data[checker.endOffset + i], '"');
                if ( !(/[^\s,;:«».!?]+/ig.test(checker.endContainer.data[checker.endOffset + i])) ) {
                    console.log('для доп if-a', checker.endContainer.data[(checker.endOffset + i)-1]);
                    if (!(/[^\s,;:«».!?]+/ig.test(checker.endContainer.data[(checker.endOffset + i)-1])) ) {
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
                if ( (/[^\s,;:«».!?]+/ig.test(checker.endContainer.data[checker.endContainer.data.length - i])) ) {
                    checker.setEnd(checker.endContainer, checker.endOffset-(i-1));
                    console.log('checkSelection: endOffset скорректирован, теперь он ', checker.endOffset);
                    endDone = true;
                    break;
                }
            }
        }
        //sel.setRanges(checker);
        console.log('checkSelection: checker = ', checker);
        
        console.log('checkSelection: ––––––––––––––––––––––––––––––');
        
        _sel.aftercheck = []; _sel.aftercheck.push(checker);
        
        return checker;

    },
    tSelection:function(hash, range) {
        
        range = range || false;
        
        range = _sel.checkSelection(range);
        
        if (!hash){
        // генерируем и сохраняем якоря для выделенного
        _sel.ranges['num'+_sel.count] = rangy.serializeSelection();
        }

        addSelection.toggleSelection();
        $('.user_selection')
                .addClass('user_selection_true')
                .addClass('num'+_sel.count)
                .removeClass('user_selection');

        // сохраняем выделенное
        //console.log('сохраняем выделенное');
        _sel.savedSel['num'+_sel.count] = rangy.saveSelection();
        _sel.savedSelActiveElement['num'+_sel.count] = document.activeElement;
        //console.log(_sel.savedSel['num'+selection.count], _sel.savedSelActiveElement['num'+selection.count]);

        var timeout_hover, timeout_hover_b = false;
        var _this;

        function unhover() { 
            if (timeout_hover_b) $("."+_this.className.split(' ')[1]).removeClass("hover"); 
        }

        $(".num"+_sel.count).mouseover(function(){
            _this = this;
            //console.log($(this), this.classList[1], $("."+this.classList[1]));
            $("."+this.className.split(' ')[1]).addClass('hover');
            timeout_hover_b = false;
            clearTimeout(timeout_hover);
        });

        $(".num"+_sel.count).mouseleave(function(){
            timeout_hover_b = true;
            var timeout_hover = setTimeout(unhover, 2000);
        });

        $('.num'+_sel.count+':last').append('<span class="closewrap"><a href="#" class="txtsel_close"></a></span>');
        
        hash = hash || true;
        if (hash) _sel.updateHash();

        rangy.getSelection().removeAllRanges();
    },
    getFirstRange: function(){
        var sel = rangy.getSelection();
        return sel.rangeCount ? sel.getRangeAt(0) : null;
    },
    restoreSelection: function(selector) {
        if (_sel.savedSel[selector]) {
            rangy.restoreSelection(_sel.savedSel[selector], true);
            //savedSel = null;
            window.setTimeout(function() {
                if (_sel.savedSelActiveElement[selector] && typeof _sel.savedSelActiveElement[selector].focus != "undefined") {
                    _sel.savedSelActiveElement[selector].focus();
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
        $('#selectable-content *').each(function(){
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




window.onload = function() {
    
    if (!$('#selectable-content').length) return;
    
    $('#selectable-content').cleanWhitespace();
    $('#selectable-content *').cleanWhitespace();
    
    rangy.init();
    var range = rangy.createRangyRange();
    $('div.b-entry > p, div.b-entry > div.imp, div.b-entry > div.imp p, div.b-entry blockquote').each(function(){
        range.selectNodeContents(this);
        //$(this).addClass('selectable');
    });
    
    _sel.elNum();
    
    $marker = $('#txtselect_marker');
    var textselect_event = true, dontshow = false;
    
    $(document).bind('textselect', function(e) {
        
        if (!textselect_event) return;
        
        
        var nodes = _sel.getFirstRange().getNodes();
        //_sel.logger(nodes);
        
        for (var i=0; i<nodes.length; i++) { 
            if (!$(nodes[i]).parents('#selectable-content').length
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
                $marker.css({'top':e.pageY-33, 'left': e.pageX});
                if ($.browser.msie) {
                    $marker.addClass('show');
                } else {
                    $marker.fadeIn('fast', function(){
                        $marker.addClass('show');
                    });
                }
            }
        }, 1);
        

    });
    
    
    
    $marker.click(function(){
        
        dontshow = true;
        
        _sel.tSelection();
        _sel.count++;
        
        
        
        if ($.browser.msie) {
            $marker.removeClass('show');
            _sel.upmsg();
		    dontshow = false;
        } else {
            $marker.fadeOut('fast', function(){
    		    $(this).removeClass('show');
    		    _sel.upmsg();
    		    dontshow = false;
    		});
        }
		
		return false;
		
    });
    
    $('.closewrap a.txtsel_close').live('click', function(){
        var parent = this.parentNode.parentNode;
        var numclass = parent.className.split(' ')[1];
        $('.'+numclass).removeClass('hover');
        $(this).fadeOut('slow', function(){
            $(this).parent('span.closewrap').remove();
            var res = _sel.restoreSelection(numclass);
            
            if (res == true) {
                ////console.log('res', res);
                removeSelection2.cssClass = numclass;
                _sel.onlytSelection(removeSelection2);
                _sel.onlytSelection(removeSelection1);
                _sel.count = _sel.count - 1;
                delete _sel.ranges[numclass];
                _sel.updateHash();

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
  	_sel.readHash();
  }


