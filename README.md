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
</script>
```

MASHA requires two elements on the page:

* Element that contains selectable text (see also _selectable_ option below).
* Button that floats over selected text that acts as selection url getter (see also _marker_ option).

All options are defined by default, but you can override any of them on Masha object instance creation.

```javascript
new MaSha({ option: 'value' })
```

## Options and their defaults

```javascript
{
  'regexp': new RegExp('[^\\s,;:–.!?<>…\\n\xA0\\*]+', 'ig'),
  'selectable': 'selectable-content',
  'marker': 'txtselect_marker',
  'ignored': null,
  'onMark': null,
  'onUnmark': null,
  'onHashRead': function(){ &hellip; }
}
```

where

* 'regexp' — regular expression that describes word.
* 'selectable' — HTMLElement or its id, that contains selectable text.
* 'marker' — HTMLElement or its id, that contains marker icon to be displayed on text selection.
* 'ignored' - Filter function, that allows to ignore specified HTMLElement as selection target. Should return true if element must be ignored; otherwise false.
* 'onMark' — Callback function that fired on text selection.
* 'onUnmark' — Callback function that fired on text deselection.
* 'onHashRead' — Function that called on loading of the page with selected fragments. Function that set by default will scroll page to the first selected fragment.

## Internet Explorer support

MASHA uses custom bundled variant of **ierange** script to support Internet Explorer.

If you use mainstream ierange library instead of bundled one please add this line to end of root function:

```javascript
window.DOMRange = DOMRange;
```

## See also

[![President of Russia](http://eng.news.kremlin.ru/static/img/eng/logo/rect.gif "President of Russia")](http://eng.kremlin.ru/ "President of Russia")

