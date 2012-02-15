$(document).ready(function(){
    MaSha.instance = new MaSha({
        'select_message': 'upmsg-selectable',
        ignored: function(arg){
            if ($(arg).attr('id') == 'projects' || $(arg).parents('#projects').length ||
                $(arg).attr('id') == 'plugins' || $(arg).parents('#plugins').length ||
                $(arg).attr('id') == 'download' || $(arg).parents('#download').length ||
                $(arg).hasClass('code') || $(arg).parents('.code:first').length) {
                return true;
            } else {
                return false;
            }
        }
    });

    var check = $(window).height() - 660;
    var stoped = false;
    $('#tweets').jTweetsAnywhere({
        searchParams: 'q=%23mashajs',
        count: 10,
        tweetProfileImagePresent: false,
        showTweetFeed: {
            showProfileImages: false,
            showGeoLocation: false,
            autorefresh: {
                mode: 'trigger-insert',
                interval: 60
            },
           	showTimestamp: false,
        },
        tweetFilter: function(bb){
            var ttweet = $('<li class="jta-tweet-list-item forremove"><div class="jta-tweet-body "><span class="jta-tweet-text">'+bb.text+'</span><span class="jta-tweet-attributes"></span></div><div class="jta-clear">&nbsp;</div></li>');
            $('.jta-tweet-list').append($(ttweet).css('visibility', 'hidden'));
            
            if (check - $('.jta-tweet-list').height() > 0 && !stoped) {
                return true;
            } else {
                stoped = true;
                $('.forremove').remove();
                return false;
            }
        }
    });
    
    
    $(window).resize(function(){
        
        function doit(){
            var trheight = $(window).height() - 565 - $('.jta-tweet-list').height();
            if (trheight < 0) {
                $('.jta-tweet-list-item:visible:last').hide().addClass('hidden').attr('px', $(window).height());
            } else {
                if ($(window).height() > parseFloat($('.hidden:first').attr('px'))) {
                    $('.hidden:first').show().removeClass('hidden');
                }
            }
        }
        
        doit();

    });
    
    $('.menu a').bind('click', function(){
        var _id = $(this).attr('href').split('#')[1];
        $(window).scrollTo( $('#'+_id), 800, {offset:-70} );
        return false;
    });
    
});
