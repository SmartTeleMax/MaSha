/**
 * @license CSS Class Applier module for Rangy.
 * Adds, removes and toggles CSS classes on Ranges and Selections
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Depends on Rangy core.
 *
 * Copyright %%build:year%%, Tim Down
 * Licensed under the MIT license.
 * Version: %%build:version%%
 * Build date: %%build:date%%
 */
/*(function(api, module) {
    var log;// = log4javascript.getLogger("rangy.cssclassapplier");

    var tagName = "span";


    function hasClass(el, cssClass) {
        return el.className && new RegExp("(?:^|\\s)" + cssClass + "(?:\\s|$)").test(el.className);
    }

    function addClass(el, cssClass) {
        if (el.className) {
            if (!hasClass(el, cssClass)) {
                el.className += " " + cssClass;
            }
        } else {
            el.className = cssClass;
        }
    }

    var removeClass = (function() {
        function replacer(matched, whitespaceBefore, whitespaceAfter) {
            return (whitespaceBefore && whitespaceAfter) ? " " : "";
        }

        return function(el, cssClass) {
            if (el.className) {
                el.className = el.className.replace(new RegExp("(?:^|\\s)" + cssClass + "(?:\\s|$)"), replacer);
            }
        };
    })();

    function getSortedClassName(el) {
        return el.className.split(/\s+/).sort().join(" ");
    }

    function hasSameClasses(el1, el2) {
        return getSortedClassName(el1) == getSortedClassName(el2);
    }

    function replaceWithOwnChildren(el) {
        var parent = el.parentNode;
        while (el.hasChildNodes()) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    }

    function elementsHaveSameNonClassAttributes(el1, el2) {
        if (el1.attributes.length != el2.attributes.length) return false;
        for (var i = 0, len = el1.attributes.length, attr1, attr2, name; i < len; ++i) {
            attr1 = el1.attributes[i];
            name = attr1.name;
            if (name != "class") {
                attr2 = el2.attributes.getNamedItem(name);
                if (attr1.specified != attr2.specified) return false;
                if (attr1.specified && attr1.nodeValue !== attr2.nodeValue) return false;
            }
        }
        return true;
    }

    function elementHasNonClassAttributes(el) {
        for (var i = 0, len = el.attributes.length; i < len; ++i) {
            if (el.attributes[i].specified && el.attributes[i].name != "class") {
                return true;
            }
        }
        return false;
    }

    function isSplitPoint(node, offset) {
        if (dom.isCharacterDataNode(node)) {
            if (offset == 0) {
                return !!node.previousSibling;
            } else if (offset == node.length) {
                return !!node.nextSibling;
            } else {
                return true;
            }
        }

        return offset > 0 && offset < node.childNodes.length;
    }

    function splitNodeAt(node, descendantNode, descendantOffset) {
        //log.debug("splitNodeAt", dom.inspectNode(node), dom.inspectNode(descendantNode), descendantOffset);
        var newNode;
        if (dom.isCharacterDataNode(descendantNode)) {
            if (descendantOffset == 0) {
                descendantOffset = dom.getNodeIndex(descendantNode);
                descendantNode = descendantNode.parentNode;
            } else if (descendantOffset == descendantNode.length) {
                descendantOffset = dom.getNodeIndex(descendantNode) + 1;
                descendantNode = descendantNode.parentNode;
            } else {
                newNode = dom.splitDataNode(descendantNode, descendantOffset);
            }
        }
        if (!newNode) {
            newNode = descendantNode.cloneNode(false);
            if (newNode.id) {
                newNode.removeAttribute("id");
            }
            var child;
            while ((child = descendantNode.childNodes[descendantOffset])) {
                //log.debug("Moving node " + dom.inspectNode(child) + " into " + dom.inspectNode(newNode));
                newNode.appendChild(child);
            }
            dom.insertAfter(newNode, descendantNode);
        }
        return (descendantNode == node) ? newNode : splitNodeAt(node, newNode.parentNode, dom.getNodeIndex(newNode));
    }

    function areElementsMergeable(el1, el2) {
        return el1.tagName == el2.tagName && hasSameClasses(el1, el2) && elementsHaveSameNonClassAttributes(el1, el2);
    }

    function getAdjacentMergeableTextNode(node, forward) {
        var isTextNode = (node.nodeType == 3);
        var el = isTextNode ? node.parentNode : node;
        var adjacentNode;
        var propName = forward ? "nextSibling" : "previousSibling";
        if (isTextNode) {
            // Can merge if the node's previous/next sibling is a text node
            adjacentNode = node[propName];
            if (adjacentNode && adjacentNode.nodeType == 3) {
                return adjacentNode;
            }
        } else {
            // Compare element with its sibling
            adjacentNode = el[propName];
            if (adjacentNode && areElementsMergeable(node, adjacentNode)) {
                return adjacentNode[forward ? "firstChild" : "lastChild"];
            }
        }
        return null;
    }

    function Merge(firstNode) {
        this.isElementMerge = (firstNode.nodeType == 1);
        this.firstTextNode = this.isElementMerge ? firstNode.lastChild : firstNode;
        if (this.isElementMerge) {
            this.sortedCssClasses = getSortedClassName(firstNode);
        }
        this.textNodes = [this.firstTextNode];
    }

    Merge.prototype = {
        doMerge: function() {
            var textBits = [], textNode, parent, text;
            for (var i = 0, len = this.textNodes.length; i < len; ++i) {
                textNode = this.textNodes[i];
                parent = textNode.parentNode;
                textBits[i] = textNode.data;
                if (i) {
                    parent.removeChild(textNode);
                    if (!parent.hasChildNodes()) {
                        parent.parentNode.removeChild(parent);
                    }
                }
            }
            this.firstTextNode.data = text = textBits.join("");
            return text;
        },

        getLength: function() {
            var i = this.textNodes.length, len = 0;
            while (i--) {
                len += this.textNodes[i].length;
            }
            return len;
        },

        toString: function() {
            var textBits = [];
            for (var i = 0, len = this.textNodes.length; i < len; ++i) {
                textBits[i] = "'" + this.textNodes[i].data + "'";
            }
            return "[Merge(" + textBits.join(",") + ")]";
        }
    };

    function CssClassApplier(cssClass) {
        this.cssClass = cssClass;
        this.applyToAnyTagName = false;
    }
    window.CssClassApplier = CssClassApplier;

    CssClassApplier.prototype = {
        getAncestorWithClass: function(textNode) {
            return $(node).parents('.' + this.cssClass)[0];
            var node = textNode.parentNode;
            while (node) {
                if (node.nodeType == 1 && hasClass(node, this.cssClass)) {
                    return node;
                }
                node = node.parentNode;
            }
            return false;
        },

        createContainer: function(doc) {
            var el = doc.createElement(tagName);
            el.className = this.cssClass;
            return el;
        },

        applyToTextNode: function(textNode) {
            //log.group("Apply CSS class. textNode: " + textNode.data);
            //log.info("Apply CSS class. textNode: " + textNode.data);
            var parent = textNode.parentNode;
            if (parent.childNodes.length == 1) {
                addClass(parent, this.cssClass);
            } else {
                var el = this.createContainer(document);
                textNode.parentNode.insertBefore(el, textNode);
                el.appendChild(textNode);
            }
            //log.groupEnd();
        },

        isRemovable: function(el) {
            return el.tagName.toLowerCase() == tagName && trim(el.className) == this.cssClass && !elementHasNonClassAttributes(el);
        },

        undoToTextNode: function(textNode, range, ancestorWithClass) {
            //log.info("undoToTextNode", dom.inspectNode(textNode), range.inspect(), dom.inspectNode(ancestorWithClass), range.containsNode(ancestorWithClass));
            if (!range.containsNode(ancestorWithClass)) {
                // Split out the portion of the ancestor from which we can remove the CSS class
                //var parent = ancestorWithClass.parentNode, index = dom.getNodeIndex(ancestorWithClass);
                var ancestorRange = range.cloneRange();
                ancestorRange.selectNode(ancestorWithClass);
                //log.info("range end in ancestor " + ancestorRange.isPointInRange(range.endContainer, range.endOffset) + ", isSplitPoint " + isSplitPoint(range.endContainer, range.endOffset));
                if (ancestorRange.isPointInRange(range.endContainer, range.endOffset) && isSplitPoint(range.endContainer, range.endOffset)) {
                    splitNodeAt(ancestorWithClass, range.endContainer, range.endOffset);
                    range.setEndAfter(ancestorWithClass);
                }
                if (ancestorRange.isPointInRange(range.startContainer, range.startOffset) && isSplitPoint(range.startContainer, range.startOffset)) {
                    ancestorWithClass = splitNodeAt(ancestorWithClass, range.startContainer, range.startOffset);
                }
            }
            //log.info("isRemovable", this.isRemovable(ancestorWithClass), dom.inspectNode(ancestorWithClass), ancestorWithClass.innerHTML, ancestorWithClass.parentNode.innerHTML);
            if (this.isRemovable(ancestorWithClass)) {
                replaceWithOwnChildren(ancestorWithClass);
            } else {
                removeClass(ancestorWithClass, this.cssClass);
            }
        },

        applyToRange: function(range) {
            //log.info("applyToRange split boundaries ");
            console.log('!!!', range)
            range.splitBoundaries();
            console.log('!!!', range)
            __range = range;
            


            var textNodes = range.getTextNodes(document.body);

            //var textNodes = range.getTextNodes();
            //var textNodes = range.startContainer
            //log.info("applyToRange got text nodes " + textNodes);

            if (textNodes.length) {
                var textNode;

                for (var i = 0, len = textNodes.length; i < len; ++i) {
                    textNode = textNodes[i];
                    if (!this.getAncestorWithClass(textNode)) {
                        this.applyToTextNode(textNode);
                    }
                }
                range.setStart(textNodes[0], 0);
                textNode = textNodes[textNodes.length - 1];
                range.setEnd(textNode, textNode.length);
            }
        },

        applyToSelection: function() {
            //log.group("applyToSelection");
            var sel = window.getSelection();
            //log.info("applyToSelection " + sel.inspect());
            //var range, ranges = sel.getAllRanges();
            var range, ranges = $.MaSha._sel.aftercheck || sel.getAllRanges();
            sel.removeAllRanges();
            var i = ranges.length;
            while (i--) {
                range = ranges[i];
                this.applyToRange(range);
                sel.addRange(range);
            }
            //log.groupEnd();
        },

        undoToRange: function(range) {
            //log.info("undoToRange " + range.inspect());
            range.splitBoundaries();
            var textNodes = range.getTextNodes(), textNode, ancestorWithClass;

            if (textNodes.length) {
                for (var i = 0, len = textNodes.length; i < len; ++i) {
                    textNode = textNodes[i];
                    ancestorWithClass = this.getAncestorWithClass(textNode);
                    if (ancestorWithClass) {
                        this.undoToTextNode(textNode, range, ancestorWithClass);
                    }
                }

                range.setStart(textNodes[0], 0);
                textNode = textNodes[textNodes.length - 1];
                range.setEnd(textNode, textNode.length);
                //log.info("Undo set range to '" + textNodes[0].data + "', '" + textNode.data + "'");

            }
        },

        undoToSelection: function() {
            var sel = window.getSelection();
            var ranges = sel.getAllRanges(), range;
            sel.removeAllRanges();
            for (var i = 0, len = ranges.length; i < len; ++i) {
                range = ranges[i];
                this.undoToRange(range);
                sel.addRange(range);
            }
        },

        getTextSelectedByRange: function(textNode, range) {
            var textRange = range.cloneRange();
            textRange.selectNodeContents(textNode);

            var intersectionRange = textRange.intersection(range);
            var text = intersectionRange ? intersectionRange.toString() : "";
            textRange.detach();

            return text;
        },

        isAppliedToRange: function(range) {
        return false;
            var textNodes = range.getTextNodes();
            for (var i = 0, len = textNodes.length, selectedText; i < len; ++i) {
                selectedText = this.getTextSelectedByRange(textNodes[i], range);
                //log.warn("text node: '" + textNodes[i].data + "', selectedText: '" + selectedText + "'");
                if (selectedText != "" && !this.getAncestorWithClass(textNodes[i])) {
                    return false;
                }
            }
            return true;
        },


    };
})();
*/




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
    var textNodes = this.getTextNodes();
    for (var i=textNodes.length; i--){
        var span = document.createElement('span');


    }
}

Range.removeTextSelection = function(className){

}

