/*
 * Mark and share text
 *
 * by SmartTeleMax team
 * Released under the MIT License
 */

;(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        var vars = factory();
        for (var k in vars) if (vars.hasOwnProperty(k)) {
            global[k] = vars[k];
        }
    }
}(this, function () {
    'use strict';

    var exports = {};
    var LocationHandler = function() {};

    LocationHandler.prototype = {
        setHash: function(hash) {
            window.location.hash = hash;
        },
        getHash: function() {
            return window.location.hash;
        },
        addHashchange: function(delegate) {
            this.callback = delegate;
            addEvent(window, 'hashchange', delegate);
        },
        destroy: function() {
            if (this.callback) {
                removeEvent(window, 'hashchange', this.callback);
            }
        },
        _removeHash: function() {
            if (window.history.pushState) {
                history.pushState('', document.title, window.location.pathname + window.location.search);
            }
            else {
                this.setHash('');
            }
        }
    };

    var MaSha = function(options) {
        options = options || {};

        if ('select_message' in options) {options.selectMessage = options.select_message;}
        if ('enable_haschange' in options) {options.enableHaschange = options.enable_haschange;}
        if ('is_block' in options) {options.isBlock = options.is_block;}

        this.options = extend({}, MaSha.defaultOptions, options);

        extend(this, {
            counter: 0,
            ranges: {},
            blocks: {}
        });

        this.init();
    };

    MaSha.version = "25.04.2013-09:55:11"; // filled automatically by hook
    MaSha.LocationHandler = LocationHandler;

    MaSha.defaultOptions = {
        'regexp': '[^\\s,;:\u2013.!?<>\u2026\\n\u00a0\\*]+',
        'selectable': 'selectable-content',
        'marker': 'txtselect_marker',
        'ignored': null,
        'selectMessage': null,
        'location': new LocationHandler(),
        'validate': false,
        'enableHaschange': true,
        'onMark': null,
        'onUnmark': null,
        'onHashRead': function() {
            var elem = firstWithClass(this.selectable, 'user_selection_true');
            if (elem && !this.hashWasRead) {
                this.hashWasRead = true;
                window.setTimeout(function() {
                    var x = 0, y = 0;
                    while (elem) {
                        x += elem.offsetLeft;
                        y += elem.offsetTop;
                        elem = elem.offsetParent;
                    }

                    window.scrollTo(x, y - 150);
                }, 1);
            }
        },
        'isBlock': function(el) {
          return el.nodeName == 'BR' || inArray(getCompiledStyle(el, 'display'),
                                                   ['inline', 'none']) == -1;
        }
    };

    MaSha.prototype = {
        init: function() { // domready
            this.selectable = (typeof this.options.selectable == 'string' ?
                                 document.getElementById(this.options.selectable) :
                                 this.options.selectable);
            if (typeof this.options.marker == 'string') {
                this.marker = document.getElementById(this.options.marker);
                if (this.marker === null) {
                    this.marker = document.createElement('a');
                    this.marker.setAttribute('id', this.options.marker);
                    this.marker.setAttribute('href', '#');
                    document.body.appendChild(this.marker);
                }
            } else {
                this.marker = this.options.marker;
            }

            if (typeof this.options.regexp != 'string') {
                throw 'regexp is set as string';
            }
            this.regexp = new RegExp(this.options.regexp, 'ig');

            if (!this.selectable) {return;}

            this.isIgnored = this.constructIgnored(this.options.ignored);

            if (this.options.selectMessage) {
                this.initMessage();
            }
            //cleanWhitespace(this.selectable);

            // enumerate block elements containing a text
            this.enumerateElements();

            var hasTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch; // from modernizr

            if (!hasTouch) {
                this.mouseUp = bind(this.mouseUp, this);
                addEvent(this.selectable, 'mouseup', this.mouseUp);
            } else {
                this.touchEnd = bind(this.touchEnd, this);
                addEvent(this.selectable, 'touchend', this.touchEnd);
            }

            this.markerClick = bind(this.markerClick, this);
            addEvent(this.marker, 'click', this.markerClick);
            addEvent(this.marker, 'touchend', this.markerClick);

            this.hideMarker = bind(this.hideMarker, this);
            addEvent(document, 'click', this.hideMarker);

            if (this.options.enableHaschange) {
                this.hashChange = bind(this.hashChange, this);
                this.options.location.addHashchange(this.hashChange);
            }

            this.readHash();
        },

        destroy: function() {
            removeClass(this.marker, 'show');
            if (this.options.selectMessage) {
                this.hideMessage();
            }

            removeEvent(this.selectable, 'mouseup', this.mouseUp);
            removeEvent(this.selectable, 'touchEnd', this.touchEnd);
            removeEvent(this.marker, 'click', this.markerClick);
            removeEvent(this.marker, 'touchend', this.markerClick);
            removeEvent(document, 'click', this.hideMarker);
            this.options.location.destroy();

            var spans = byClassName(this.selectable, 'user_selection_true');
            this.removeTextSelection(spans);
            var closes = byClassName(this.selectable, 'closewrap');
            for (var i = closes.length; i--;) {
                closes[i].parentNode.removeChild(closes[i]);
            }
            var indices = byClassName(this.selectable, 'masha_index');
            for (var i = indices.length; i--;) {
                indices[i].parentNode.removeChild(indices[i]);
            }

        },

        /*
         * Event handlers
         */

        mouseUp: function(e) {
            /*
             * Show the marker if any text selected
             */

            var markerCoord = getPageXY(e); // outside timeout function because of IE
            window.setTimeout(bind(function() {
                this.showMarker(markerCoord);
            }, this), 1);
        },

        touchEnd: function() {
            window.setTimeout(bind(function() {
                var s = window.getSelection();
                if (s.rangeCount) {
                    var rects = s.getRangeAt(0).getClientRects();
                    if (rects.length) {
                        var rect = rects[rects.length - 1],
                            body = document.body;
                        this.showMarker({x: rect.left + rect.width + body.scrollLeft,
                                         y: rect.top + rect.height/2 + body.scrollTop});
                    }
                }
            }, this), 1);
        },

        hashChange: function() {
            if (this.lastHash != this.options.location.getHash()) {
                 var numclasses = [];
                 for (var k in this.ranges) {
                     numclasses.push(k);
                 }
                 this.deleteSelections(numclasses);
                 this.readHash();
            }
        },

        hideMarker: function(e) {
            var target = e.target || e.srcElement;
            if (target != this.marker) {
                removeClass(this.marker, 'show');
            }
            this.lastRange = null;
        },

        markerClick: function(e) {
            preventDefault(e);
            stopEvent(e);

            var target = (e.target || e.srcElement);

            if (hasClass(this.marker, 'masha-marker-bar')) {
                if (!hasClass(target, 'masha-social') && !hasClass(target, 'masha-marker')) {
                    return;
                }
            }
            removeClass(this.marker, 'show');
            if (!this.rangeIsSelectable()) {
                return;
            }

            this.addSelection();
            this.updateHash();

            if (this.options.onMark) {
                this.options.onMark.call(this);
            }
            if (this.options.selectMessage) {
                this._showMessage();
            }

            if (hasClass(target, 'masha-social')) {
                var pattern = target.getAttribute('data-pattern');
                if (pattern) {
                    var newUrl = pattern.replace('{url}', encodeURIComponent(window.location.toString()));
                    this.openShareWindow(newUrl);
                }
            }
        },


        /*
         * Interface functions, safe to redefine
         */
        openShareWindow: function(url) {
            window.open(url, '', 'status=no,toolbar=no,menubar=no,width=800,height=400');
        },
        getMarkerCoords: function(marker, markerCoord) {
            return {'x': markerCoord.x, 'y': markerCoord.y, 'width': markerCoord.width};
        },
        getPositionChecksum: function(wordsIterator) {
            /*
             * Used in validation. This method accepts word sequence iterator (a function returning
             * the next word of sequence on each call or null if words are) and returns a string checksum.
             * The getPositionChecksum method is called twice for each range: one for start position and
             * one for end position (with reversed iterator).
             *
             * The checksum is included into hash and it is checked on page load. If calculated checksum
             * doesn't one from url, the selection is not restored.
             */
            var sum = '';
            for (var i = 0; i < 3; i++) {
                var part = (wordsIterator() || '').charAt(0);
                if (part) {
                    var allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
                    var integer = part.charCodeAt(0) % allowedChars.length;
                    part = allowedChars.charAt(integer);
                }
                sum += part;
            }
            return sum;
        },

        /*
         * Non-interface functions
         */

        showMarker: function(markerCoord) {
            var regexp = new RegExp(this.options.regexp, 'g');
            var text = window.getSelection().toString();

            if (text == '' || !regexp.test(text)) {return;}
            if (!this.rangeIsSelectable()) {return;}

            var coords = this.getMarkerCoords(this.marker, markerCoord);

            this.marker.style.top = coords.y + 'px';
    //        this.marker.style.left = coords.x + 'px';

            var sel = window.getSelection();
            if (sel.rangeCount){
                this.lastRange = new MaSha.Range(sel.getRangeAt(0), this);
            }

            addClass(this.marker, 'show');
        },


        // XXX sort methods logically
        deleteSelections: function(numclasses) {
            for (var i = numclasses.length; i--;) {
                var numclass = numclasses[i];
                var spans = byClassName(this.selectable, numclass);
                var closewrap = firstWithClass(spans[spans.length - 1], 'closewrap');
                closewrap.parentNode.removeChild(closewrap);

                this.removeTextSelection(spans);
                delete this.ranges[numclass];
            }
        },

        removeTextSelection: function(spans) {
            for (var i = spans.length; i--;) {
                var span = spans[i];
                for (var j = 0; j < span.childNodes.length; j++) {
                    span.parentNode.insertBefore(span.childNodes[j], span);
                }
                span.parentNode.removeChild(span);
            }
        },

        isInternal: function(node) {
            while (node.parentNode) {
                if (node == this.selectable) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        },

        _siblingNode: function(cont, reversed, regexp) {
            regexp = regexp || this.regexp;
            var node = cont;
            if (reversed && node.previousSibling) {
                node = node.previousSibling; // hack for Chrome triple click
            }

            var iter = elementIterator(this.selectable, node, undefined, reversed, this.isIgnored);
            node = iter();
            if (node == cont) { node = iter(); }

            while (node) {
                if (node.nodeType == 3 &&
                   (node.data.match(regexp) != null)) {
                    return {_container: node, _offset: reversed * node.data.length};
                }
                node = iter()
            }
            return null;
        },

        prevNode: function(cont, regexp) {
            return this._siblingNode(cont, 1, regexp);
        },
        nextNode: function(cont, regexp) {
            return this._siblingNode(cont, 0, regexp);
        },

        wordCount: function wordCount(node) {
            var _wcount = 0;
            if (node.nodeType == 3) {
                // counting words in text node
                var match = node.nodeValue.match(this.regexp);
                if (match) { _wcount += match.length; }
            } else if (node.childNodes && node.childNodes.length) { // Child element
                // counting words in element node with nested text nodes
                var alltxtNodes = textNodes(node);
                for (var i = alltxtNodes.length; i--;) {
                    _wcount += alltxtNodes[i].nodeValue.match(this.regexp).length;
                }
            }
            return _wcount;
        },

        words: function(container, offset, pos) {
            // counting words in container from/untill offset position

            // Skip ignored elements at the start and at the end
            var cont = elementIterator(this.selectable, container, undefined, pos === 'end', this.isIgnored)();
            if (cont !== container) {
                offset = pos == 'end' ? (cont.nodeType == 3? cont.textContent.length : 0) : 0;
                container = cont;
            }

            if (container.nodeType == 1) {
                container = firstTextNode(container, this.isIgnored);
            }

            //get content part, that isn't included in selection,
            //split it with regexp and count words in it
            var wcount = container.data.substring(0, offset).match(this.regexp);

            if (wcount != null) {
                if (pos == 'start') {wcount = wcount.length + 1;}
                if (pos == 'end') {wcount = wcount.length;}
            } else {
                wcount = 1;
            }

            var node = container;
            var selectionIndex = this.getNum(container);
            var firstNode = this.getFirstTextNode(selectionIndex);

            while (node && node != firstNode) {
                node = this.prevNode(node, /.*/)._container;
                wcount += this.wordCount(node);
                //node = node ? node.container: null;
            }

            /*
            n = container.previousSibling;
            // FIXME! Required word count outside of inner <b></b>
            while (n) {
                var onei = wordCount(n);
                wcount += onei;
                n = n.previousSibling;
            }
            */
            return selectionIndex + ':' + wcount;
        },

        symbols: function(_node) {
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

        updateHash: function() {
            var hashAr = [];

            for (var key in this.ranges) {
                hashAr.push(this.ranges[key]);
            }
            if (hashAr.length) {
                var newHash = '#sel=' + hashAr.join(';');
                this.lastHash = newHash;
                this.options.location.setHash(newHash);
            } else {
                this.options.location._removeHash();
            }
        },

        readHash: function() {
            /*
             * Reads Hash from URL and marks texts
             */
            var hashAr = this.splittedHash();
            if (!hashAr) { return; }

            for (var i = 0; i < hashAr.length; i++) {
                this.deserializeSelection(hashAr[i]);
            }
            this.updateHash();

            if (this.options.onHashRead) {
                this.options.onHashRead.call(this);
            }
        },

        splittedHash: function() {
            var hash = this.options.location.getHash();
            if (!hash) {return null;}

            hash = hash.replace(/^#/, '').replace(/;+$/, '');
            if (! /^sel\=(?:\d+\:\d+(?:\:[^:;]*)?\,|%2C\d+\:\d+(?:\:[^:;]*)?;)*\d+\:\d+(?:\:[^:;]*)?\,|%2C\d+\:\d+(?:\:[^:;]*)?$/.test(hash)) {return null;}

            hash = hash.substring(4, hash.length);
            return hash.split(';');
        },

        deserializeSelection: function(serialized) {
            var sel = window.getSelection();
            if (sel.rangeCount > 0) { sel.removeAllRanges(); }

            var range = this.deserializeRange(serialized);
            if (range) {
                this.addSelection(range);
            }
        },

        deserializeRange: function(serialized) {
            var result = /^([0-9A-Za-z:]+)(?:,|%2C)([0-9A-Za-z:]+)$/.exec(serialized);
            var bits1 = result[1].split(':');
            var bits2 = result[2].split(':');
            // XXX this if is ugly
            if (parseInt(bits1[0], 10) < parseInt(bits2[0], 10) ||
               (bits1[0] == bits2[0] && parseInt(bits1[1], 10) <= parseInt(bits2[1], 10))) {

                var start = this.deserializePosition(bits1, 'start'),
                    end = this.deserializePosition(bits2, 'end');

                if (start.node && end.node) {
                    var range = document.createRange();
                    range.setStart(start.node, start.offset);
                    range.setEnd(end.node, end.offset);
                    range = new MaSha.Range(range, this);
                    if (!this.options.validate || this.validateRange(range, bits1[2], bits2[2])) {
                        return range;
                    }
                }
            }

            if (window.console && (typeof window.console.warn == 'function')) {
                window.console.warn('Cannot deserialize range: ' + serialized);
            }
            return null;
        },

        validateRange: function(range, sum1, sum2) {
            var valid = true, sum;
            if (sum1) {
                sum = this.getPositionChecksum(range.getWordIterator(this.regexp));
                valid = valid && sum1 == sum;
            }
            if (sum2) {
                sum = this.getPositionChecksum(range.getWordIterator(this.regexp, true));
                valid = valid && sum2 == sum;
            }
            return valid;
        },

        getRangeChecksum: function(range) {
            return [this.getPositionChecksum(range.getWordIterator(this.regexp)),
                    this.getPositionChecksum(range.getWordIterator(this.regexp, true))];
        },

        deserializePosition: function(bits, pos) {
             // deserializes #OfBlock:#OfWord pair
             // getting block
             var node = this.blocks[parseInt(bits[0], 10)];

             var offset, stepCount = 0;
             // getting word in all text nodes
             while (node) {
                 var re = new RegExp(this.options.regexp, 'ig'),
                     myArray;
                 while ((myArray = re.exec(node.data )) != null) {
                     stepCount++;
                     if (stepCount == bits[1]) {
                         if (pos == 'start') {offset = myArray.index;}
                         if (pos == 'end') {offset = re.lastIndex;}

                         return {node: node, offset: parseInt(offset, 10)};
                     }

                 }
                 // word not found yet, trying next container
                 node = this.nextNode(node, /.*/);
                 node = node ? node._container : null;
                 if (node && this.isFirstTextNode(node)) {
                     node = null;
                 }
             }
             return {node: null, offset: 0};
        },

        serializeRange: function(range) {
            var start = this.words(range.startContainer, range.startOffset, 'start');
            var end = this.words(range.endContainer, range.endOffset, 'end');
            if (this.options.validate) {
                var sums = this.getRangeChecksum(range);
                start += ':' + sums[0];
                end += ':' + sums[1];
            }
            return start + ',' + end;
        },

        checkSelection: function(range) {
            /*
             * Corrects selection.
             * Returns range object
             */
            this.checkPosition(range, range.startOffset, range.startContainer, 'start');
            this.checkPosition(range, range.endOffset, range.endContainer, 'end');

            this.checkBrackets(range);
            this.checkSentence(range);

            return range;
        },


        checkPosition: function(range, offset, container, position) {
            var this_ = this, newdata;

            function isWord(str) {
                return str.match(this_.regexp) != null;
            }

            function isNotWord(str) {
                return str.match(this_.regexp) == null;
            }

            function stepBack(container, offset, condition) {
                // correcting selection stepping back and including symbols
                // that match a given condition
                while (offset > 0 && condition(container.data.charAt(offset - 1))) {
                    offset--;
                }
                return offset;
            }

            function stepForward(container, offset, condition) {
                // correcting selection stepping forward and including symbols
                // that match a given condition
                while (offset < container.data.length && condition(container.data.charAt(offset))) {
                    offset++;
                }
                return offset;
            }
            if (container.nodeType == 1 && offset > 0) {
                // Triple click handling for elements like <br>
                if (offset < container.childNodes.length) {
                    container = container.childNodes[offset];
                    offset = 0;
                } else {
                    // XXX what is the case for this code?
                    var containerTextNodes = textNodes(container); // XXX lastTextNode
                    if (containerTextNodes.length) { // this if fixes regressionSelectionStartsAtImage test
                        container = containerTextNodes[containerTextNodes.length - 1];
                        offset = container.data.length;
                    }
                }
            }

            if (position == 'start') {

                if (container.nodeType == 1 && trim(textContent(container)) != '') {
                    container = firstTextNode(container);
                    offset = 0;
                }
                if (container.nodeType != 3 ||
                    container.data.substring(offset).match(this.regexp) == null) {
                    newdata = this.nextNode(container);
                    container = newdata._container;
                    offset = newdata._offset;
                }

                // Important! Shorten the selection first and then extend it!
                offset = stepForward(container, offset, isNotWord);
                offset = stepBack(container, offset, isWord);

                range.setStart(container, offset);
            }

            if (position == 'end') {
                if (container.nodeType == 1 && trim(textContent(container)) != '' && offset != 0) {
                    container = container.childNodes[range.endOffset - 1];

                    var containerTextNodes = textNodes(container); // XXX lastTextNode
                    container = containerTextNodes[containerTextNodes.length - 1];

                    offset = container.data.length;
                }

                if (container.nodeType != 3 ||
                    container.data.substring(0, offset).match(this.regexp) == null) {
                    newdata = this.prevNode(container);
                    container = newdata._container;
                    offset = newdata._offset;
                }

                // Important! Shorten the selection first and then extend it!
                offset = stepBack(container, offset, isNotWord);
                offset = stepForward(container, offset, isWord);

                range.setEnd(container, offset);
            }
        },

        checkBrackets: function(range) {
            this._checkBrackets(range, '(', ')', /\(|\)/g, /\(x*\)/g);
            this._checkBrackets(range, '\u00ab', '\u00bb', /\\u00ab|\\u00bb/g, /\u00abx*\u00bb/g);
            // XXX Double brackets?
        },

        _checkBrackets: function(range, ob, cb, matchReg, replReg) {
            // XXX Needs cleanup!
            var text = range.toString();//getTextNodes(range).map(function(x){return x.data;}).join('');
            var brackets = text.match(matchReg);
            var newData;
            if (brackets) {
                brackets = brackets.join('');
                var l = brackets.length + 1;
                while (brackets.length < l) {
                    l = brackets.length;
                    brackets = brackets.replace(replReg, 'x');
                }
                if (brackets.charAt(brackets.length - 1) == cb &&
                        text.charAt(text.length - 1) == cb) {
                    if (range.endOffset == 1) {
                        newData = this.prevNode(range.endContainer);
                        range.setEnd(newData.container, newData.offset);
                    } else {
                        range.setEnd(range.endContainer, range.endOffset - 1);
                    }
                }
                if (brackets.charAt(0) == ob &&
                        text.charAt(0) == ob) {
                    if (range.startOffset == range.startContainer.data.length) {
                        newData = this.nextNode(range.endContainer);
                        range.setStart(newData.container, newData.offset);
                    } else {
                        range.setStart(range.startContainer, range.startOffset + 1);
                    }
                }
            }

        },

        checkSentence: function(range) {
            var data, nextAfterRange;
            if (range.endOffset == range.endContainer.data.length) {
                data = this.nextNode(range.endContainer, /.*/);
                if (!data) {return null;}
                nextAfterRange = data._container.data.charAt(0);
            } else {
                data = {_container: range.endContainer, _offset: range.endOffset};
                nextAfterRange = range.endContainer.data.charAt(range.endOffset);
            }

            if (nextAfterRange.match(/\.|\?|\!/)) {
                // sentence end detected
                // XXX rewrite
                var text = range.toString();
                // XXX support not only latin and russian?
                if (text.match(/(\.|\?|\!)\s+[A-Z\u0410-\u042f\u0401]/)) {
                    return apply();
                }

                if (range.startOffset == 0 &&
                    range.startContainer.previousSibling &&
                    range.startContainer.previousSibling.nodeType == 1 &&
                    hasClass(range.startContainer.previousSibling, 'masha_index')) {
                    return apply();
                }

                var node, iterator = range.getElementIterator();
                while ((node = iterator())) {
                    if (node.nodeType == 1 && hasClass(node, 'masha_index')) {
                        return apply();
                    }
                }

                if (text.charAt(0).match(/[A-Z\u0410-\u042f\u0401]/)) {
                    var pre = range.startContainer.data.substring(0, range.startOffset);
                    if (!pre.match(/\S/)) {
                        var preData = this.prevNode(range.startContainer, /\W*/);
                        pre = preData._container.data;
                    }
                    pre = trim(pre);
                    if (pre.charAt(pre.length - 1).match(/(\.|\?|\!)/)) {
                        return apply();
                    }
                }
                return null;
            }

            function apply() {
                range.setEnd(data._container, data._offset + 1);
            }
        },

        mergeSelections: function(range) {
            var merges = [];
            var iterator = range.getElementIterator();
            var node = iterator();
            var parent_ = parentWithClass(node, 'user_selection_true');
            if (parent_) {
                parent_ = /(num\d+)(?:$| )/.exec(parent_.className)[1];
                range.setStart(firstTextNode(firstWithClass(this.selectable, parent_)), 0);
                merges.push(parent_);
            }

            iterator = range.getElementIterator();
            node = iterator();
            var last = node;
            while (node) {
                if (node.nodeType == 1 && hasClass(node, 'user_selection_true')) {
                   var cls = /(num\d+)(?:$|)/.exec(node.className)[0];
                   if (inArray(cls, merges) == -1) {
                       merges.push(cls);
                   }
                }
                last = node;
                node = iterator();
            }
            last = parentWithClass(last, 'user_selection_true');
            if (last) {
                last = /(num\d+)(?:$| )/.exec(last.className)[1];
                var tnodes = textNodes(lastWithClass(this.selectable, last)); // XXX lastTextNode
                var lastNode = tnodes[tnodes.length - 1];
                range.setEnd(lastNode, lastNode.length);
            }
            if (merges.length) {
                // this breaks selection, so we need to dump a range and restore it after DOM changes
                var sc = range.startContainer, so = range.startOffset,
                    ec = range.endContainer, eo = range.endOffset;
                this.deleteSelections(merges);
                range.setStart(sc, so);
                range.setEnd(ec, eo);
            }
            return range;
        },

        addSelection: function(range) {
            range = range || this.getFirstRange();
            range = this.checkSelection(range);
            range = this.mergeSelections(range);

            var className = 'num' + this.counter;
            // generating hash part for this range
            this.ranges[className] = this.serializeRange(range);

            range.wrapSelection(className + ' user_selection_true');
            this.addSelectionEvents(className);
        },

        addSelectionEvents: function(className) {
            var timeoutHover = false;
            var this_ = this;

            var wrappers = byClassName(this.selectable, className);
            for (var i = wrappers.length; i--;) {
                addEvent(wrappers[i], 'mouseover', function() {
                    for (var i = wrappers.length; i--;) {
                        addClass(wrappers[i], 'hover');
                    }
                    window.clearTimeout(timeoutHover);
                });
                addEvent(wrappers[i], 'mouseout', function(e) {
                    // mouseleave
                    var t = e.relatedTarget;
                    while (t && t.parentNode && t.className != this.className) {
                        t = t.parentNode;
                    }
                    if (!t || t.className != this.className) {
                        timeoutHover = window.setTimeout(function() {
                            for (var i = wrappers.length; i--;) {
                                removeClass(wrappers[i], 'hover');
                            }
                        }, 2000);
                    }
                });
            }

            var closer = document.createElement('a');
            closer.className = 'txtsel_close';
            closer.href = '#';
            var closerSpan = document.createElement('span');
            closerSpan.className = 'closewrap';
            closerSpan.appendChild(closer);
            addEvent(closer, 'click', function(e) {
                preventDefault(e);
                this_.deleteSelections([className]);
                this_.updateHash();

                if (this_.options.onUnmark) {
                    this_.options.onUnmark.call(this_);
                }
            });
            wrappers[wrappers.length - 1].appendChild(closerSpan);

            this.counter++;
            window.getSelection().removeAllRanges();
        },

        getFirstRange: function() {
            var sel = window.getSelection();
            var res = sel.rangeCount ? sel.getRangeAt(0) : null;
            if (res === null) {
                return null;
            }
            if (this.lastRange && res &&
                    res.endContainer == res.startContainer &&
                    res.endOffset == res.startOffset) {
                return this.lastRange
            }

            return new MaSha.Range(res, this);
        },
        enumerateElements: function() {
            // marks first text node in each visual block element:
            // inserts a span with special class and ID before it
            var node = this.selectable;
            this.captureCount = this.captureCount || 0;
            var this_ = this;

            enumerate(node);

            function enumerate(node) {
                var children = node.childNodes;
                var hasBlocks = false;
                var blockStarted = false;

                for (var idx = 0; idx < children.length; ++idx) {
                    var child = children.item(idx);
                    var nodeType = child.nodeType;
                    if (nodeType == 3 && !child.nodeValue.match(this_.regexp)) {
                        // ..if it is a textnode that is logically empty, ignore it
                        continue;
                    } else if (nodeType == 3) {
                        if (!blockStarted) {
                            // remember the block
                            this_.captureCount++;
                            var indexSpan = document.createElement('span');
                            // XXX prefix all class and id attributes with "masha"
                            indexSpan.className = 'masha_index masha_index' + this_.captureCount;
                            indexSpan.setAttribute('rel', this_.captureCount);
                            child.parentNode.insertBefore(indexSpan, child);

                            idx++;
                            this_.blocks[this_.captureCount] = child;
                            hasBlocks = blockStarted = true;
                        }
                    } else if (nodeType == 1) {
                        // XXX check if this is correct
                        if (!this_.isIgnored(child)) {
                            var isBlock = this_.options.isBlock(child);

                            if (isBlock) {
                                var childHasBlocks = enumerate(child);
                                hasBlocks = hasBlocks || childHasBlocks;
                                blockStarted = false;
                            } else if (!blockStarted) {
                                blockStarted = enumerate(child);
                                hasBlocks = hasBlocks || blockStarted;
                            }
                        }
                    }
                }
                return hasBlocks;
            }
        },
        isFirstTextNode: function(textNode) {
            var prevs = [textNode.previousSibling, textNode.parentNode.previousSibling];
            for (var i = prevs.length; i--;) {
                if (prevs[i] && prevs[i].nodeType == 1 && prevs[i].className == 'masha_index') {
                    return true;
                }
            }
            return false;
        },
        getFirstTextNode: function(numclass) {
            if (!numclass) { return null; }
            var tnode = byClassName(this.selectable, 'masha_index' + numclass)[0];
            if (tnode) {
                var iter = elementIterator(document.body, tnode, undefined, false, this.isIgnored);
                var node;
                while (node = iter()) {
                    if (node.nodeType === 3) { return node; }
                }
            }
            return null;
        },
        getNum: function(cont) {
            while (cont.parentNode) {
                while (cont.previousSibling) {
                    cont = cont.previousSibling;
                    while (cont.nodeType == 1 && cont.childNodes.length) {
                        cont = cont.lastChild;
                    }
                    if (cont.nodeType == 1 && hasClass(cont, 'masha_index')) {
                        return cont.getAttribute('rel');
                    }
                }
                cont = cont.parentNode;
            }
            return null;
        },

        constructIgnored: function(selector) {
            if (typeof selector == 'function') {
                return selector;
            } else if (typeof selector == 'string') {
                // supports simple selectors by class, by tag and by id
                var byId = [], byClass = [], byTag = [];
                var selectors = selector.split(',');
                for (var i = 0; i < selectors.length; i++) {
                  var sel = trim(selectors[i]);
                  if (sel.charAt(0) == '#') {
                    byId.push(sel.substr(1));
                  } else if (sel.charAt(0) == '.') {
                    byClass.push(sel.substr(1));
                  } else {
                    byTag.push(sel);
                  }
                }

                return function(node) {
                    var i;
                    for (i = byId.length; i--;) {
                        if (node.id == byId[i]) { return true; }
                    }
                    for (i = byClass.length; i--;) {
                        if (hasClass(node, byClass[i])) { return true; }
                    }
                    for (i = byTag.length; i--;) {
                        if (node.tagName == byTag[i].toUpperCase()) { return true; }
                    }
                    return false;
                };
            } else {
                return function() { return false; };
            }
        },

        rangeIsSelectable: function() {
            var range = this.getFirstRange();
            if (!range) { return false; }

            var iterator = range.getElementIterator();
            var firstNode = iterator();
            // XXX is this needed?
            //while ((node = iterator())) {
            //    hasNodes = true;
            //    if (node.nodeType == 3 && node.data.match(this.regexp) != null) {
            //        // first and last TEXT nodes
            //        firstNode = firstNode || node;
            //        lastNode = node;
            //    }
            //    // We need to check first element. Text nodes are not checked, so we replace
            //    // it for it's parent.
            //    node = (first && node.nodeType == 3) ? node.parentNode : node;
            //    first = false;

            //    if (node.nodeType == 1) {
            //        // Checking element nodes. Check if the element node and all it's parents
            //        // till selectable are not ignored
            //        var iterNode = node;
            //        while (iterNode != this.selectable && iterNode.parentNode) {
            //            iterNode = iterNode.parentNode;
            //        }
            //        if (iterNode != this.selectable) { return false; }
            //    }
            //}
            if (! firstNode) { return false; }


            var firstSelection = parentWithClass(firstNode, 'user_selection_true');
            var lastNode = range.getElementIterator(true)();
            var lastSelection = parentWithClass(lastNode, 'user_selection_true');
            if (firstSelection && lastSelection) {
                var reg = /(?:^| )(num\d+)(?:$| )/;

                var cls1 = reg.exec(firstSelection.className)[1];
                var cls2 = reg.exec(lastSelection.className)[1];
                return cls1 !== cls2;
            }
            return true;
        },

        /*
         * message.js - popup message
         */

        initMessage: function() {
            this.msg = (typeof this.options.selectMessage == 'string' ?
                        document.getElementById(this.options.selectMessage) :
                        this.options.selectMessage);
            this.closeButton = this.getCloseButton();
            this.msgAutoclose = null;

            this.closeMessage = bind(this.closeMessage, this);
            addEvent(this.closeButton, 'click', this.closeMessage);
        },

        closeMessage: function(e) {
            preventDefault(e);
            this.hideMessage();
            this.saveMessageClosed();
            clearTimeout(this.msgAutoclose);
        },

        /*
         * message.js pubplic methods, safe to redefine
         */

        showMessage: function() {
            addClass(this.msg, 'show');
        },
        hideMessage: function() {
            removeClass(this.msg, 'show');
        },
        getCloseButton: function() {
            return this.msg.getElementsByTagName('a')[0];
        },

        /*
         * non-public functions
         */

        getMessageClosed: function() {
            if (window.localStorage) {
                return !!localStorage.masha_warning;
            } else {
                return !!document.cookie.match(/(?:^|;)\s*masha-warning=/);
            }
        },
        saveMessageClosed: function() {
            if (window.localStorage) {
                localStorage.masha_warning = 'true';
            } else {
                // XXX need to be tested under IE
                if (!this.getMessageClosed()) {
                    document.cookie += '; masha-warning=true';
                }
            }
        },

        _showMessage: function() {
            var this_ = this;
            if (this.getMessageClosed()) {return;}

            this.showMessage();

            clearTimeout(this.msgAutoclose);
            this.msgAutoclose = setTimeout(function() {
                this_.hideMessage();
            }, 10000);
        }

    };

    /*
     * Range object
     */

    // support browsers and IE, using ierange with Range exposed
    // XXX why this doesn't work without Range exposed
    var Range = window.Range || document.createRange().constructor;

    MaSha.Range = function(range, masha) {
        this.range = range;
        this.masha = masha;

        this.startContainer = this.range.startContainer;
        this.startOffset = this.range.startOffset;
        this.endContainer = this.range.endContainer;
        this.endOffset = this.range.endOffset;

        this.nodes = null;
    }

    MaSha.Range.prototype.setEnd = function(container, offset) {
        this.range.setEnd(container, offset);
        this.endContainer = this.range.endContainer;
        this.endOffset = this.range.endOffset;
        this.nodes = null;
    }

    MaSha.Range.prototype.setStart = function(container, offset) {
        this.range.setStart(container, offset);
        this.startContainer = this.range.startContainer;
        this.startOffset = this.range.startOffset;
        this.nodes = null;
    }

    MaSha.Range.prototype.toString = function() {
        return this.range.toString();
    }

    MaSha.Range.prototype.fillNodes = function() {
        this.nodes = [];
        var iter = elementIterator(document.body, this.startContainer, this.endContainer, false, this.masha.isIgnored);

        var node = iter();
        while (node) {
            this.nodes.push(node);
            node = iter();
        }
    }

    MaSha.Range.prototype.splitBoundaries = function() {
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
    };

    MaSha.Range.prototype.getTextNodes = function() {
        var iterator = this.getElementIterator();
        var textNodes = [], node;
        while ((node = iterator())) {
            // XXX was there a reason to check for empty string?
            // with this check selecting two sibling words separately
            // and then selecting them both in one range doesn't work properly
            if (node.nodeType == 3) {// && !node.data.match(/^\s*$/)){
                textNodes.push(node);
            }
        }
        return textNodes;
    };

    function elementIterator(parent, cont, end, reversed, isIgnored) {
        reversed = !!reversed;
        cont = cont || parent[reversed ? 'lastChild' : 'firstChild'];
        var finished = !cont;
        var up = false;

        var ignoredParent = null;
        var iterNode = cont;
        
        while (iterNode && iterNode.parentNode != document.body) {
            if (isIgnored && isIgnored(iterNode)) {
                ignoredParent = iterNode;
            }
            iterNode = iterNode.parentNode;
        }

        function getNext() {
            if (cont.childNodes && cont.childNodes.length && !up) {
                cont = cont[reversed ? 'lastChild' : 'firstChild'];
            } else if (cont[reversed ? 'previousSibling' : 'nextSibling']) {
                cont = cont[reversed ? 'previousSibling' : 'nextSibling'];
                up = false;
            } else if (cont.parentNode) {
                cont = cont.parentNode;
                if (cont === parent) { finished = true; }
                if (cont === ignoredParent) { ignoredParent = null; }
                up = true;
                getNext();
            }
        }

        function next() {
            do {
                if (finished) {return null;}

                var result = cont;
                var resultIgnored = !!ignoredParent;


                getNext();


                if (isIgnored && isIgnored(result) && !resultIgnored) { ignoredParent = result; }
                if (result === end) { finished = true; }
            } while ((resultIgnored || ignoredParent) && result !== document && result);
            return result;
        }
        return next;
    }

    MaSha.Range.prototype.getElementIterator = function(reversed) {
        if (!this.nodes) { this.fillNodes(); }

        if (reversed) {
            var i = this.nodes.length;
            return function() { if (i>0) { i--; return this.nodes[i]; } }.bind(this);
        } else {
            var i = 0;
            return function() { if (i<this.nodes.length) { i++; return this.nodes[i-1]; } }.bind(this);
        }
    };

    MaSha.Range.prototype.getWordIterator = function(regexp, reversed) {
        var elemIter = this.getElementIterator(reversed);
        var node;
        var counterAim = 0, i = 0;
        var finished = false, match, this_ = this;
        function next() {
            if (counterAim == i && !finished) {
                do {
                    do {
                        node = elemIter();
                    } while (node && node.nodeType != 3);
                    finished = !node;
                    if (!finished) {
                        var value = node.nodeValue;
                        if (node == this_.endContainer) {
                            value = value.substr(0, this_.endOffset);
                        }
                        if (node == this_.startContainer) {
                            value = value.substr(this_.startOffset);
                        }
                        match = value.match(regexp);
                    }
                } while (node && !match);
                if (match) {
                    counterAim = reversed ? 0 : match.length - 1;
                    i = reversed ? match.length - 1 : 0;
                }
            } else {
                if (reversed) {i--;} else {i++;}
            }
            if (finished) { return null; }
            return match[i];
        }
        return next;
    };

    MaSha.Range.prototype.wrapSelection = function(className) {
        this.splitBoundaries();
        var textNodes = this.getTextNodes();
        for (var i = textNodes.length; i--;) {
            // XXX wrap sibling text nodes together
            var span = document.createElement('span');
            span.className = className;
            textNodes[i].parentNode.insertBefore(span, textNodes[i]);
            span.appendChild(textNodes[i]);
        }
    };

    /*
     * MaSha Multi
     */
    // XXX here on in separate file?

    var MultiLocationHandler = function(prefix) {
        this.prefix = prefix;
    };

    MultiLocationHandler.prototype = {
        setHash: function(hash) {
            hash = hash.replace('sel', this.prefix).replace(/^#/, '');

            if (hash.length == this.prefix.length + 1) {hash = '';}

            var oldHash = this.getHashPart(),
                newHash;
            if (oldHash) {
                newHash = window.location.hash.replace(oldHash, hash);
            } else {
                newHash = window.location.hash + '|' + hash;
            }
            newHash = '#' + newHash.replace('||', '').replace(/^#?\|?|\|$/g, '');
            window.location.hash = newHash;
        },
        addHashchange: MaSha.LocationHandler.prototype.addHashchange,
        getHashPart: function() {
            var parts = window.location.hash.replace(/^#\|?/, '').split(/\||%7C/);
            for (var i = 0; i < parts.length; i++) {
                if (parts[i].substr(0, this.prefix.length + 1) == this.prefix + '=') {
                    return parts[i];
                }
            }
            return '';
        },
        getHash: function() {
            return this.getHashPart().replace(this.prefix, 'sel');
        }
    };


    var MultiMaSha = function(elements, getPrefix, options) {

        getPrefix = getPrefix || function(element) {return element.id;};

        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var prefix = getPrefix(element);

            if (prefix) {
                var initOptions = extend({}, options || {}, {
                    'selectable': element,
                    'location': new MultiLocationHandler(prefix)
                });

                new MaSha(initOptions);
            }
        }
    }


    /*
     * Exposing
     */

    exports.MaSha = MaSha;

    if (window.jQuery) {
        window.jQuery.fn.masha = function(options) {
            options = options || {};
            options = extend({'selectable': this[0]}, options);
            return new MaSha(options);
        };
    }
    exports.MultiMaSha = MultiMaSha;


    /*
     * Shortcuts
     */

    var $M = MaSha.$M = {};
    // XXX collect all auxillary methods in $M

    function extend(obj) {
        for (var i = 1; i < arguments.length; i++) {
            for (var key in arguments[i]) {
                obj[key] = arguments[i][key];
            }
        }
        return obj;
    }
    $M.extend = extend;

    function trim(text) {
        return (text || '').replace(/^\s+|\s+$/g, '');
    }

    function getCompiledStyle(elem, strCssRule) {
        // copypasted from Internets
        var strValue = '';
        if (document.defaultView && document.defaultView.getComputedStyle) {
            strValue = document.defaultView.getComputedStyle(elem, '').getPropertyValue(strCssRule);
        }
        else if (elem.currentStyle) {
            strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
                return p1.toUpperCase();
            });
            strValue = elem.currentStyle[strCssRule];
        }
        return strValue;
    }

    function textContent(elem) {
        return elem.textContent || elem.innerText;
    }

    function parentWithClass(p, cls) {
        while (p && !hasClass(p, cls)) {p = p.parentNode;}
        return p || null;
    }
    function firstWithClass(elem, cls) {
        var iter = elementIterator(elem);
        var node = null;
        while ((node = iter())) {
            if (node.nodeType === 1 && hasClass(node, cls)) {return node;}
        }
        return null;
    }
    function lastWithClass(elem, cls) {
        var elems = byClassName(elem, cls);
        if (elems) {
            return elems[elems.length - 1];
        }
        return null;
    }
    function firstTextNode(elem, isIgnored) {
        var iter = elementIterator(elem, undefined, undefined, undefined, isIgnored);
        var node = null;
        while ((node = iter())) {
            if (node.nodeType === 3) {return node;}
        }
        return node;
    }
    function byClassName(elem, cls) {
        if (elem.getElementsByClassName) {
            return elem.getElementsByClassName(cls);
        } else {
            var ret = [], node;
            var iter = elementIterator(elem);
            while ((node = iter())) {
                if (node.nodeType == 1 && hasClass(node, cls)) {
                    ret.push(node);
                }
            }
            return ret;
        }
    }
    $M.byClassName = byClassName;

    function textNodes(elem) {
        var ret = [], node;
        var iter = elementIterator(elem);
        while ((node = iter())) {
            if (node.nodeType === 3) {
                ret.push(node);
            }
        }
        return ret;
    }

    function _classRegExp(cls) {
        return new RegExp('(^|\\s+)' + cls + '(?:$|\\s+)', 'g');
    }
    function hasClass(elem, cls) {
        var reg = _classRegExp(cls);
        return reg.test(elem.className);
    }
    function addClass(elem, cls) {
        // XXX attention! NOT UNIVERSAL!
        // don't use for classes with non-literal symbols
        var reg = _classRegExp(cls);
        if (!reg.test(elem.className)) {
            elem.className = elem.className + ' ' + cls;
        }
    }
    $M.addClass = addClass;
    function removeClass(elem, cls) {
        // XXX attention! NOT UNIVERSAL!
        // don't use for classes with non-literal symbols
        var reg = _classRegExp(cls);
        if (reg.test(elem.className)) {
            elem.className = trim(elem.className.replace(reg, '$1'));
        }
    }
    $M.removeClass = removeClass;

    function inArray(elem, array) {
        // from jQuery
        // Hate IE
        for (var i = 0, length = array.length; i < length; i++) {
            if (array[i] === elem) { return i; }
        }
        return -1;
    }

    function addEvent(elem, type, fn) {
        if (elem.addEventListener) {
            elem.addEventListener(type, fn, false);
        } else if (elem.attachEvent) {
            elem.attachEvent('on' + type, fn);
        }
    }
    $M.addEvent = addEvent;

    function removeEvent(elem, type, fn) {
        if (elem.removeEventListener) {
            elem.removeEventListener(type, fn, false);
        } else if (elem.detachEvent) {
            elem.detachEvent('on' + type, fn);
        }
    }
    $M.removeEvent = removeEvent;

    function preventDefault(e) {
        if (e.preventDefault) { e.preventDefault(); }
        else { e.returnValue = false; }
    }
    function stopEvent(e) {
        if (e.stopPropagation) { e.stopPropagation(); }
        else { e.cancelBubble = true; }
    }
    function getPageXY(e) {
        // from jQuery
        // Calculate pageX/Y if missing
        if (e.pageX == null) {
            var doc = document.documentElement, body = document.body;
            var x = e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0);
            var y = e.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0);
            return {x: x, y: y};
        }
        return {x: e.pageX, y: e.pageY};
    }

    var nativeBind = Function.prototype.bind;
    var slice = Array.prototype.slice;

    var bind = function(func, context) {
        // Based on Underscore (see http://stackoverflow.com/q/23341577/168352)
        if (func.bind === nativeBind && nativeBind) {
            return nativeBind.apply(func, slice.call(arguments, 1));
        }
        var args = slice.call(arguments, 2);
        return function() {
            return func.apply(context, args.concat(slice.call(arguments)));
        };
    };
    $M.bind = bind;

    return exports;

}));
