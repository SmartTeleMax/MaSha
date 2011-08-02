$(document).ready(function(){

  $("#city").click(function () {
    $("#citylist").toggle();
  });
  
});

function changeCity(id, key) {
  $.ajax({ 
           type : "GET",
           url: "/users/changeCity.jsp", 
           data : key+"="+id,
           success: function(msg) {
               document.location.reload();
           }
  });
}

function showMovieVideo(iid) {
   tb_show(null,"/rest/movie/video/"+iid+"/?height=445&width=540",false);
}

function showMovieInfo(iid) {
   tb_show(null,"/rest/movie/info/"+iid+"/?height=400&width=600",false);
}

function showProgramInfo(shortcat) {
   tb_show(null,"/rest/program/info/"+shortcat+"/?height=445&width=540",false);
}

function printUserGreeting() {
    var info = NTVInfo.parseInfo();
    if(info.hasInfo()) {
        if(info.service == 'LOCAL') {
            $("#ident").html('<a href="/me">'+info.name+'</a> (<a href="http://s10.ntv.ru/logout?rurl='+Base64.encode(document.location.href)+'">выйти</a>)');
        } else {
            $("#ident").html('<a href="'+info.profileURL+'" class="'+info.getServiceName()+'_aname" style="padding-right: 5px;">'+info.name+'</a> (<a href="http://s10.ntv.ru/logout?rurl='+Base64.encode(document.location.href)+'">выйти</a>)');
        }
    } else {
        $("#ident").html('<a href="http://s10.ntv.ru/login?rurl='+Base64.encode(document.location.href)+'">Войти</a>');
    }
}
