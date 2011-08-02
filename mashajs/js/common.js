$(document).ready(function(){
    var check = $(window).height() - 480;
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
            console.log(bb);
            var ttweet = $('<li class="jta-tweet-list-item forremove"><div class="jta-tweet-body "><span class="jta-tweet-text">'+bb.text+'</span><span class="jta-tweet-attributes"></span></div><div class="jta-clear">&nbsp;</div></li>');
            $('.jta-tweet-list').append($(ttweet).css('visibility', 'hidden'));
            
            console.log('height', $('.jta-tweet-list').height());
            console.log(check - $('.jta-tweet-list').height());
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
            var trheight = $(window).height() - 525 - $('.jta-tweet-list').height();
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
        $(window).scrollTo( $('#'+_id), 800 );
        return false;
    });
    
})