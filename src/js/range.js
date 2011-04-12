Range.prototype.splitBoundaries = function() {
    var sc = this.startContainer, so = this.startOffset, ec = this.endContainer, eo = this.endOffset;
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
        if (node.nodeType == 3 && !node.data.match(/^\s*$/)){
            textNodes.push(node);
        }
    }
    return textNodes
}

Range.prototype.getElementIterator = function(){
    var cont = this.startContainer;
    var end = this.endContainer;
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

Range.prototype.addSelection = function(className){
    this.splitBoundaries();

    var textNodes = this.getTextNodes();
    console.log('textNodes', textNodes)
    for (var i=textNodes.length; i--;){
        var span = document.createElement('span');
        span.className = className;
        textNodes[i].parentNode.insertBefore(span, textNodes[i]);
        span.appendChild(textNodes[i]);
    }
}

Range.removeTextSelection = function(className){
    var spans = $(className);
    for (var i=spans.length; i--;){
        var span = spans[i];
        for (var j=0; j<span.childNodes.length;j++){
            span.parentNode.insertBefore(span.childNodes[j], span);
        }
        span.parentNode.removeChild(span);
    }
}

