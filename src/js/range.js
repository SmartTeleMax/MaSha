var _range = {};
_range.splitBoundaries = function(range) {
    var sc = range.startContainer, so = range.startOffset, ec = range.endContainer, eo = range.endOffset;
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
    range.setStart(sc, so);
    range.setEnd(ec, eo);
}

_range.getTextNodes = function(range) {
    var iterator = _range.getElementIterator(range);
    var textNodes = [], node;
    while (node = iterator()){
        if (node.nodeType == 3 && !node.data.match(/^\s*$/)){
            textNodes.push(node);
        }
    }
    return textNodes
}

_range.getElementIterator = function(range){
    var cont = range.startContainer;
    var end = range.endContainer;
    var finished = false;
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
            up = true;
            next();
        }
        finished = result === end;
        return result
    }
    return next;
}

_range.addSelection = function(className, range){
    _range.splitBoundaries(range);

    var textNodes = _range.getTextNodes(range);
    console.log('textNodes', textNodes)
    for (var i=textNodes.length; i--;){
        var span = document.createElement('span');
        span.className = className;
        textNodes[i].parentNode.insertBefore(span, textNodes[i]);
        span.appendChild(textNodes[i]);
    }
}

removeTextSelection = function(className){
    var spans = $(className);
    for (var i=spans.length; i--;){
        var span = spans[i];
        for (var j=0; j<span.childNodes.length;j++){
            span.parentNode.insertBefore(span.childNodes[j], span);
        }
        span.parentNode.removeChild(span);
    }
}

