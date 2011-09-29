(function(){
    function to_latin(ch){
        if (ch){
            var allowed_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
            var integer = ch.charCodeAt(0) % allowed_chars.length;
            return allowed_chars.charAt(integer);
        }
        return '';
    }

    MaSha.prototype.getPositionChecksum = function(words_iterator){
        var sum = '';
        for (var i=0; i<3;i++){
            var part = (words_iterator() || '').charAt(0);
            sum += to_latin(part);
        }
        return sum;
    }
})();

