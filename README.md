# MASHA (Mark + Share)

![MASHA Logo](http://mashajs.com/img/logoyellow.png "MASHA Logo")

## Introduction

This library allows users to mark page content fragments and get unique url to the page with marked fragments. Anybody can select chosen parts (paragraphs, sentences or words) and share these selection with others. Opening of that url will open the page with same content and restored marks.

This feature was developed for official site of President of Russia. After some months of active use it was published under MIT license.

## Synopsys

MASHA has been written in clean JavaScript and does not have any framework dependencies (except bundled ierange library that included to support Internet Explorer browser).

To enable MASHA on your page you need to add inside &lt;head/&gt; tag that code:

```html
<!--[IF IE]> 
    <script type="text/javascript" src="ierange.js"></script> 
<![ENDIF]-->
<script type="text/javascript" src="masha.js"></script>
<link rel="stylesheet" type="text/css" href="masha.css">
<script type="text/javascript">
// if jQuery is not available
if (window.addEventListener) {
  window.addEventListener('load', function() {
    // can be called by domready
    MaSha.instance = new MaSha();
  }, false);
} else {
  window.attachEvent('onload', function() {
    // can be called by domready
    MaSha.instance = new MaSha();
  });
}
// if jQuery available:
$(document).ready(function() {
  MaSha.instance = new MaSha();
});
</script>
```

MASHA uses three elements on the page:

* Element that contains selectable text (see also _selectable_ option below), **required**.
* Button that floats over selected text that acts as selection url getter (see also _marker_ option).
* Popup that floats when a text is selected and tells user that he can now share a link (see also _select_message_ option).

All options are defined by default, but you can override any of them on Masha object instance creation.

```javascript
new MaSha({ option: 'value' })
```

## Options and their defaults

```javascript
{
  'regexp': '[^\\s,;:–.!?<>…\\n\xA0\\*]+',
  'selectable': 'selectable-content',
  'marker': 'txtselect_marker',
  'ignored': null,
  'select_message': null,
  'location': new LocationHandler(),
  'validate': false,
  'onMark': null,
  'onUnmark': null,
  'onHashRead': function(){ … }
}
```

where

* 'regexp' — regular expression that describes word (not compiled, as string).
* 'selectable' — HTMLElement or its id, that contains selectable text.
* 'marker' — HTMLElement or its id, that contains marker icon to be displayed on text selection. If element with given id is not found, an &lt;a/&gt; element is created.
* 'select_message' — HTMLElement or its id with popup that floats when text is selected. If closed once, popup will be never displayed again in this browser (localStorage or cookies are used). If no value provided, the popup is not shown.
* 'ignored' — Either function or string.
  * Filter function, that allows to ignore specified HTMLElement as selection target. Should return true if element must be ignored; otherwise false.
  * Comma-separated tag names, classes or ids of ignored elements. For example: *'ul, .ignored-cls, #ignored-id'*.
* 'location' — an object used for get url hash from and write it to. The only significant methods are get_hash, set_hash and add_hashchange. You can redefine, for example, to write URL not in address bar but into a custom popup, or for handle address bar URL manually.
* 'validate' — If true, the checksum of each selection is written in hash and they are validated on page load. Attention! There is no checksum algorithm provided by default and you should provide it to use validation! See 'Validation' section below.
* 'enable_haschange' — If true, hashchange event is handled.
* 'onMark' — Callback function that fired on text selection.
* 'onUnmark' — Callback function that fired on text deselection.
* 'onHashRead' — Function that called on loading of the page with selected fragments. Function that set by default will scroll page to the first selected fragment.

## Internet Explorer support

MASHA uses custom bundled variant of [ierange](http://code.google.com/p/ierange/) script to support Internet Explorer.

If you use mainstream ierange library instead of bundled one please add this line to end of root function:

```javascript
window.DOMRange = DOMRange;
```

## Validation

Validation algorythm is not included in MaSha by default, because we didn't invent The Best Algorythm Ever yet. And we don't want to force users to use bad (draft) algorythms.

To use validation you should implement `MaSha.prototype.getPositionChecksum` method. This method accepts word sequence iterator (a function returning the next word of sequence on each call or null if words are) and returns a string checksum. The getPositionChecksum method is called twice for each range: one for start position and one for end position (with reversed iterator).

The checksum is included into hash and it is checked on page load. If calculated checksum doesn't one from url, the selection is not restored.

```javascript
    MaSha.prototype.getPositionChecksum = function(words_iterator){
        var word1 = words_iterator();
        var word2 = words_iterator();
        var sum = makeSomeCalculations(word1, word2);
        return sum;
    }
```
