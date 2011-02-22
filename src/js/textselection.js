// TEXT SELECTION

/*
function my(){
    var mrkr = {
        e: null,
        ev: null,
        main: function(ev){
            console.log(ev);
            $(ev.target).filter(':contains("'+ev.text+'")').each(function(){
                
                console.log(ev.target);
                
                if($(this).children().length < 1) {
                    $(this).html( 
                        $(this).text().replace(ev.text, '<span class="user_selection">'+ev.text+'<span class="closewrap"><a href="#" class="txtsel_close"></a></span></span>')
                    );

                    mrkr.addevent();

                } else {
                    console.log(ev.target.childNodes[0]);

                    var _w = {
                        foundinNodes: [],
                        start: [],
                        end: [],
                        selectedTxt: ev.text,
                        txt: ev.text,
                        target: ev.target,
                        originNodes: ev.target.childNodes,
                        endwhile: false,
                        childnum: 0,
                        symcount: 0,
                        nodeSearch: function(nodenum){
                            console.log('Начинаем поиск в ноде № ', nodenum, '. Текст ноды: "', _w.originNodes[nodenum].textContent, '"');
                            console.log('Ищем текст: ', _w.txt);
                            for (var i=0; i<_w.txt.length; i++) {
                                _w.symcount ++;
                                console.log('Ищем '+_w.symcount+' символов = "'+_w.txt.slice(0,_w.symcount)+'"');
                                var res = _w.originNodes[nodenum].textContent.indexOf(_w.txt.slice(0,_w.symcount));
                                console.log('res = ', res);
                                if (res >= 0) {
                                    console.log('Найдено "'+_w.txt.slice(0,_w.symcount)+'" в ноде №'+nodenum+', кол-во символов: '+_w.symcount);
                                    _w.foundinNodes['_'+nodenum] = _w.txt.slice(0,_w.symcount);
                                    _w.foundinNodes['_'+nodenum+'_length'] = _w.foundinNodes['_'+nodenum].length;

                                    console.log('_w.txt.length', _w.txt.length, '_w.symcount', _w.symcount);
                                    if (_w.txt.length == _w.symcount) {
                                        console.log('текста для поиска не осталось');
                                        console.log('поиск завершен');
                                        _w.endwhile = true;
                                        _w.finish();
                                        break;
                                    }


                                } else {
                                    console.log('Перстаем искать в '+nodenum+' ноде.')
                                    _w.txt = _w.txt.substring(_w.symcount-1);
                                    console.log('Осталось найти: "', _w.txt, '"');
                                    console.log(_w);
                                    console.log('nodenum & childn.length', nodenum, _w.originNodes.length-1);
                                    if (nodenum < _w.originNodes.length-1) {
                                        nodenum = nodenum+1;
                                        _w.symcount = 0;
                                        console.log('nodenum++, symcount=0, запускаем nodeSearch еще раз, _w.endwhile:', _w.endwhile);
                                        if (!_w.endwhile) _w.nodeSearch(nodenum);
                                    } else {
                                        console.log('поиск заверенш');
                                        _w.endwhile = true;
                                        _w.finish();
                                        break;
                                    }

                                }
                            }

                        },
                        prefinish: function(){
                            // функция, расставляющая "координаты" расположения найденных слов в нодах

                            console.log('prefinish start work');
                            for (var f=0; f< _w.originNodes.length; f++) {
                                start = _w.originNodes[f].textContent.indexOf(_w.foundinNodes['_'+f]);
                                txtlength = _w.foundinNodes['_'+f].length;
                                end = start + txtlength;
                                _w.start['_'+f] = start;
                                _w.end['_'+f] = end;
                            }

                            console.log('after prefinish result', _w);
                            return;
                        },
                        separateText: function(html){
                            console.log('separateText func start');
                            var maxnode = _w.originNodes.length - 1;
                            if (_w.originNodes[0].nodeType == 3 && _w.originNodes[maxnode].nodeType == 3) {
                                // первый и последний нод выделенного фрагмента не явлюятся элементами, т.к. оборачиваем все.

                                var htmlstring = html;
                                var htmlstring_edit = htmlstring
                                    .replace(_w.foundinNodes['_0'], '<span class="user_selection">'+_w.foundinNodes['_0'])
                                    .replace(_w.foundinNodes['_'+maxnode], _w.foundinNodes['_'+maxnode]+'<span class="closewrap"><a href="#" class="txtsel_close"></a></span></span>');
                                //console.log(htmlstring_edit);
                                html = htmlstring_edit;
                                //htmlstring = htmlstring;
                                //console.log(htmlstring); 
                            }

                            return html;
                        },
                        finish: function() {

                            var shtml = _w.separateText($(ev.target).html());
                            console.log(shtml);
                            $(ev.target).html(shtml);
                            mrkr.addevent();
                            return false;


                        }
                    };


                    // проверка на полное совпадение
                    for (var i=0; i<_w.originNodes.length; i++) {

                       console.log('i', i, '_w.originNodes', _w.originNodes);

                       if (_w.originNodes[i].textContent.indexOf(_w.selectedTxt) >= 0) {
                           console.log('Ура! Нашелся весь текст в '+i+' ноде');
                           _w.endwhile = true;
                       }
                    }
                    
                    console.log(_w);
                    

                }
                

                
            });
            
            // Поиск элементов, в которых произошло выделение.
            console.log('mrkr.findElement();');
            mrkr.findElement();
        },
        handler: function(e){
            $marker = $('#txtselect_marker');
            $marker.css({'top':e.pageY-33, 'left': e.pageX}).fadeIn('fast', function(){
                $marker.addClass('show');
            });

            mrkr.ev = e;

            $marker.click(mrkr.markerclick);
            
        },
        markerclick: function(){
            mrkr.main(mrkr.ev);
            console.log('MARKER CKICK');
            $('#txtselect_marker').fadeOut('fast', function(){
                $(this).removeClass('show');
            });

             return false;
        },
        findElement: function(){
            console.log('in end');
            if (!$(mrkr.ev.target).filter(':contains("'+mrkr.ev.text+'")').length) {
                console.log('Выделенный текст не найден в target.');
                
                var _s = {
                    textlen: mrkr.ev.text.length,
                    prevEl: [],
                    nextEl: [],
                    prevElFound: [],
                    nextElFound: [],
                    curfound: '',
                    txt: mrkr.ev.text,
                    selectedTxt: mrkr.ev.text,
                };
                
                
                //var _s.textlen = mrkr.ev.text.length;
                
                var ttemp = mrkr.ev.target;
                var piupiu = false;
                var counter = 0;
                var symcounter = ttemp.previousElementSibling.textContent.length;
                
                while (!piupiu) {
                    if (symcounter > _s.textlen) {
                        _s.prevEl['_'+counter] = ttemp.previousElementSibling.textContent;
                        piupiu = true;
                        console.log('piupiu', piupiu, '_s.prevEl[_'+counter+']', _s.prevEl['_'+counter]);
                    } else {
                        //console.log('else', 'counter', counter, 'symcounter', symcounter);
                        _s.prevEl['_'+counter] = ttemp.previousElementSibling.textContent;
                        
                        counter++;
                        ttemp = ttemp.target;
                        symcounter = symcounter + ttemp.previousElementSibling.textContent.length;
                    }
                    
                }
                
                var prevEl = mrkr.ev.target.previousElementSibling;
                var nextEl = mrkr.ev.target.nextElementSibling;
                console.log('prevEl', prevEl, 'nextEl', nextEl);
                
                
                for (var f=0; f<_s.selectedTxt.length; f++) {
                    var res = prevEl.textContent.indexOf(_s.selectedTxt.slice(0,f));
                    if (res < 0) {
                        _s.prevfound = _s.selectedTxt.slice(0,f-1);
                        _s.txt = _s.txt.substring(f-1);
                        _s.txt = $.trim(_s.txt);
                        console.log('prevfound: ', _s.prevfound, '; _s.txt: ', _s.txt);
                        break;
                    }
                }
                
                for (var f=0; f<=_s.txt.length; f++) {
                    //console.log(_s.txt, f);
                    fortest = _s.txt;
                    var res = mrkr.ev.target.textContent.indexOf(_s.txt.slice(0,f));
                    console.log('res', res, 'f', f, '_s.txt.length-1', _s.txt.length);
                    if (res < 0 || f==_s.txt.length) {
                        _s.curfound = _s.txt.slice(0,f);
                        _s.txt = _s.txt.substring(f);
                        console.log('curfound: ', _s.curfound, '; _s.txt: ', _s.txt);
                        break;
                    }
                }
                
                
            }
            
        },
        addevent: function(){
            $('span.user_selection').mouseenter(function(){
                $(this).addClass('hover');
            });
            $('span.user_selection').mouseleave(function(){
                $(this).removeClass('hover');
            });
        }
    }



}
*/


var addSelection, removeSelection1, removeSelection2, logger_count = 0;

var selection = {
    count: 0,
    savedSel: [],
    savedSelActiveElement: [],
    ranges: {},
    logger: function(str){
        logger_count++;
        $('#logger').append('<p style="font-size:12px;text-align: left;">#'+logger_count+' | '+str+'</p>');
    },
    getChilds: function(){
        selection.childs = $('#selectable-content > *');
        return selection.childs;
    },
    childs: [],
    updateHash: function(){
        var hash = '';
        for (key in selection.ranges) { 
            hash += selection.ranges[key] + ';';
            }
        hash = hash.substring(hash.length-1, 0);
        
        location.hash = 'sel='+hash;
    },
    readHash: function(){
        
        var hash = location.hash;
        //console.log(hash);
        if (hash == '' || !hash) return;
        
        hash = hash.split('#')[1];
        //console.log(hash);
        //if (hash.substring(0, 3) != 'sel') return;

        hash = hash.substring(4, hash.length);
        //console.log(hash);
        hashAr = hash.split(';');
        console.log(hashAr);
        
        // восстанавливаем первое выделение + скроллим до него.
        //selection.restoreStamp(hashAr[0], true);
        
        for (var i=0; i < hashAr.length; i++) {
            //console.log('i', i, 'hashAr', hashAr, 'hashAr.length', hashAr.length);
            selection.restoreStamp(hashAr[i]);
        }
        

        // Вычисляем кол-во px от верха до первого выделенного участка текста, далее - скроллим до этого места.
        var scrollTo = $('.user_selection_true:first').offset().top - 150;
        $('html,body').animate({
            scrollTop:scrollTo
            }, 1500,  "easeInOutQuint");
        

    },
    restoreStamp: function(stamp){
        //scrolled = scrolled || false;
        rangy.deserializeSelection(stamp);
        toggleSelection();
        selection.count++;
    },
    upmsg: function(){
        $msg = $('#upmsg-selectable');
        
        if ($.cookie('selectable-warning') == 'notshow') return;
        if ($msg.hasClass('show')) return;
        
        $msg.addClass('show');
        
        clearTimeout(autoclose);
        
        $msg.animate({
            'top': '0px',
            'opacity': '1'
        }, { duration: 1000, easing: 'easeOutQuint' });
        
        function closemsg(){
            $msg.animate({
                'top': '-57px',
                'opacity': '0'
            }, 500,  "easeInQuint", function(){ 
                $msg.removeClass('show');
            });
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
    getNodeIndex: function(el) {
        //console.log($(selection.childs));
        return $(selection.childs).index($(el));
    }
}



function getFirstRange() {
    var sel = rangy.getSelection();
    return sel.rangeCount ? sel.getRangeAt(0) : null;
}

function saveSelection() {
    if (selection.savedSel[selection.count]) {
        rangy.removeMarkers(savedSel);
    }
    savedSel = rangy.saveSelection();
    savedSelActiveElement = document.activeElement;
    }
    
function restoreSelection(selector) {
    if (selection.savedSel[selector]) {
        rangy.restoreSelection(selection.savedSel[selector], true);
        //savedSel = null;
        window.setTimeout(function() {
            if (selection.savedSelActiveElement[selector] && typeof selection.savedSelActiveElement[selector].focus != "undefined") {
                selection.savedSelActiveElement[selector].focus();
            }
        }, 1);
        return true;
    } else {
        return false;
    }
}


function onlytoggleSelection(obj) {
    obj.toggleSelection();
    
}


function toggleSelection(scrolled) {
    
    //scrolled = scrolled || false;
    
    // генерируем и сохраняем якоря для выделенного
    selection.ranges['num'+selection.count] = rangy.serializeSelection();
    
    
    
    addSelection.toggleSelection();
    $('.user_selection')
            .addClass('user_selection_true')
            .addClass('num'+selection.count)
            .removeClass('user_selection');
    
    
    
    // сохраняем выделенное
    console.log('сохраняем выделенное');
    selection.savedSel['num'+selection.count] = rangy.saveSelection();
    selection.savedSelActiveElement['num'+selection.count] = document.activeElement;
    console.log(selection.savedSel['num'+selection.count], selection.savedSelActiveElement['num'+selection.count]);
    
    
    
    
    var timeout_hover, timeout_hover_b = false;
    var _this;
    
    function unhover() { 
        if (timeout_hover_b) $("."+_this.className.split(' ')[1]).removeClass("hover"); 
    }
    
    
    $(".num"+selection.count).mouseover(function(){
        _this = this;
        //console.log($(this), this.classList[1], $("."+this.classList[1]));
        $("."+this.className.split(' ')[1]).addClass('hover');
        timeout_hover_b = false;
        clearTimeout(timeout_hover);
    });

    $(".num"+selection.count).mouseleave(function(){
        timeout_hover_b = true;
        var timeout_hover = setTimeout(unhover, 2000);
    });
    
    $('.num'+selection.count+':last').append('<span class="closewrap"><a href="#" class="txtsel_close"></a></span>');
    
    selection.updateHash();
    
    rangy.getSelection().removeAllRanges();
    
}


function insertNodeAtRange() {
    var range = getFirstRange();
    if (range) {
        var els = document.createElement("span");
        els.className = 'closewrap';
        var ela = document.createElement("a");
        els.appendChild(ela);

        range.insertNode(els);
        rangy.getSelection().setSingleRange(range);
    }
}




window.onload = function() {
    rangy.init();
    var range = rangy.createRangyRange();
    $('div.b-entry > p, div.b-entry > div.imp p, div.b-entry blockquote').each(function(){
        range.selectNodeContents(this);
        //$(this).addClass('selectable');
    });
    
    
    $marker = $('#txtselect_marker');
    
    $('div.b-entry > p, div.b-entry > div.imp p, div.b-entry blockquote').bind('textselect', function(e) {
        var nodes = getFirstRange().getNodes();
        for (var i=0; i<nodes.length; i++) { 
            if ($(nodes[i]).hasClass('user_selection_true') || 
                $(nodes[i]).hasClass('b-multimedia') ||
                $(nodes[i]).hasClass('inpost')) {
                    console.log('отказ');
                    return;
                    break;
                }
        }
        
        window.setTimeout(function(){
            $marker.css({'top':e.pageY-33, 'left': e.pageX}).fadeIn('fast', function(){
                $marker.addClass('show');
            });        
        }, 1);
    });
    
    
    
    $marker.click(function(){
        console.log('click');
        toggleSelection();
        selection.count++;
        
        
        
        $marker.fadeOut('fast', function(){
		    $(this).removeClass('show');
		    selection.upmsg();
		});
		
		return false;
		
    });
    
    $('.closewrap a.txtsel_close').live('click', function(){
        var parent = this.parentNode.parentNode;
        var numclass = parent.className.split(' ')[1];
        $('.'+numclass).removeClass('hover');
        $(this).fadeOut('slow', function(){
            $(this).parent('span.closewrap').remove();
            var res = restoreSelection(numclass);
            
            if (res == true) {
                //console.log('res', res);
                removeSelection2.cssClass = numclass;
                onlytoggleSelection(removeSelection2);
                onlytoggleSelection(removeSelection1);
                selection.count = selection.count - 1;
                console.log('удаляю запись в selection.ranges['+numclass+']');
                delete selection.ranges[numclass];
                selection.updateHash();
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
  		if($('#txtselect_marker').hasClass('show') && tar.attr('id') != 'txtselect_marker'){
  			$('#txtselect_marker').fadeOut('fast', function(){
  			    $(this).removeClass('show');
  			});
  		}
  	});
  	
    $('body').append('<div id="logger" style="position:fixed; bottom:0; left:0; width: 100%; height: auto; background: white; max-height: 150px; overflow: auto;"></div>');
  	selection.getChilds();
  	selection.readHash();
  	
  	
  	
  	


    
    
}


