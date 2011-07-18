$.MaSha.default_options.onSelected = function(){
    $.TextSelectorMessage.getInstance().show();
}

$.TextSelectorMessage = function() {
    // XXX make a callback, do not include to standart package
    var $msg = $('#upmsg-selectable');
    var autoclose;

    this.show = function(){
        if (get_closed()) return;
        //if ($msg.hasClass('show')) return;
    
        $msg.addClass('show');
    
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

        clearTimeout(autoclose);
        autoclose = setTimeout(closemsg, 10000);
    }


    $msg.find('.upmsg_closebtn').click(function(){
        closemsg();
        save_closed();
        clearTimeout(autoclose);
        return false;
    });

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
                'opacity': 0
            }, 500,  "easeInQuint", function(){ 
                $msg.removeClass('show');
            });
        }
        return false;
    }

    function save_closed(){
        if (window.localStorage){
            localStorage.selectable_warning = 'true';
        } else {
            $.cookie('selectable-warning', 'true');
        }
    }
    function get_closed(){
        if (window.localStorage){
            return !!localStorage.selectable_warning;
        } else {
            return !!$.cookie('selectable-warning');
        }
    }
}

$.TextSelectorMessage.getInstance = function(){
    if (!$.TextSelectorMessage.instance){
        $.TextSelectorMessage.instance = new TextSelectorMessage();
    }
    return $.TextSelectorMessage.instance;
}
