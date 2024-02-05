﻿var SERVER_HOSTNAME = location.hostname;

var platform = {
    'dailymotion': 'https://www.dailymotion.com/embed/video/%eng%',
    'hitbox': 'https://www.hitbox.tv/embed/%eng%',
    'youtube': '//www.youtube.com/embed/%eng%',
    'majorleaguegaming': 'https://www.majorleaguegaming.com/player/embed/%eng%',
    'azubu': 'https://embed.azubu.tv/%eng%',
    'dingit': 'https://www.dingit.tv/embed/%eng%',
    'huomao': 'https://www.huomao.com/outplayer/index/%eng%',
    'douyu': '/inc/douyu.php?room_id=%eng%',
    'twitch': 'https://player.twitch.tv/?channel=%eng%&parent=' + SERVER_HOSTNAME,
    'twitch_vod': 'https://player.twitch.tv/?video=v&parent=' + SERVER_HOSTNAME,
    'vk': 'https://vk.com/video_ext.php?oid=%eng%',
    'youku': 'https://player.youku.com/embed/%eng%',
    'ya': 'https://frontend.vh.yandex.ru/player/%eng%',
    'vk': '//vk.com/video_ext.php?oid=-%eng%&id=%sub%&hash=%hash%'
};

var recaptchaV2;

function sform(name) {
    const reCaptchaForms = ['login', 'reg', 'pwd'];
    if (reCaptchaForms.includes(name) && typeof $('#captcha > div').html() === "undefined") {
        return sFormReCaptcha(name);
    }

    return sendForm(name);
}
function sFormReCaptcha(name) {
    grecaptcha.ready(function() {
        grecaptcha.execute(recaptcha_site_key, {action: name}).then(function(token) {
            sendForm(name, token);
        });
    });
}
function sendForm(name, token = null) {
    var rid = $('form[name='+name+']').attr('action');
    block($('form[name='+name+']'),0.4);
    $.ajax({
        type: "POST",
        data: {
            rid: rid,
            ajax: name,
            data: form_data(name, token)
        }
    }).done(function(txt) {
        block($('form[name='+name+']'),1.0);
        var data = jQuery.parseJSON(txt);
        if (data && data.err && data.err.recaptcha === 'v2' && form_error(name,data.err)) {
            grecaptcha.ready(() => {
                if (recaptchaV2 === undefined) {
                    recaptchaV2 = grecaptcha.render('captcha', {
                        'sitekey': recaptcha_v2_site_key
                    });
                }
            });
        }

        if (data && form_error(name,data.err)) {
            if ($('#ferr').offset()) {
                $('html, body').animate({
                    scrollTop: $('#ferr').offset().top - 100
                }, 500);
            }

            grecaptcha.ready(() => {
                if (recaptchaV2 !== undefined) {
                    grecaptcha.reset(recaptchaV2)
                }
            });

            return false;
        }
        if (data.callback) return window[data.callback](data);
        else if (data.url) window.location.href = data.url;
        else if (data.wms) wms('',data.wms);
        else wmsc();
    });
}
function form_data(name, token) {
    var data = {};
    var n = 0;
    var k = '';
    var v = '';
    $('form[name='+name+'] .input').each(function(){
        n = $(this).attr('rel')-0;
        k = $(this).attr('name');
        if ($(this).prop('type') == 'checkbox') {
            v = ($(this).prop('checked') ? $(this).val() : 0);
            if (!v) return;
        }
        else if ($(this).prop('type') == 'radio') {
            v = ($(this).prop('checked') ? $(this).val() : 0);
            if (!v) return;
        }
        else {
            if ($(this).hasClass('tiny')) {
                v = tinyMCE.get(k).getContent()
            }
            else {
                v = $(this).val();
            }
        }
        if (n > 0) {
            if (!data[n]) data[n] = {};
            if (data[n][k]) {
                if (typeof data[n][k] == 'string') data[n][k] = [data[n][k]];
                data[n][k].push(v);
            }
            else {
                data[n][k] = v;    
            }
        }
        else {
            if (data[k]) {
                if (typeof data[k] == 'string') data[k] = [data[k]];
                data[k].push(v);
            }
            else {
                data[k] = v;    
            }
        }
    });
    if (token != null) {
        data['captcha'] = token;
        data['recaptcha_v'] = 'v3';
    }
    if ($('#captcha > div').html()) {
        data['captcha'] = grecaptcha.getResponse();
        data['recaptcha_v'] = 'v2';
    }
    return data;
}
function form_error(name, err) {
    $('form[name='+name+'] div').removeClass('has-error');
    $('form[name='+name+']').find('p.help-block').remove();
    if (!err) return false;
    var j = 0;
    for(var i in err) {
        $('form[name='+name+'] div[rel="'+i+'"]').addClass('has-error').append('<p'+(j==0 ? ' id="ferr"' : '')+' class="help-block">'+err[i]+'</p>');
        $('form[name='+name+'] div[rel="'+i+'"] .input').shake();
        j = 1;
    }
    return true;
}
function block(e, k) {
    $(e).css('opacity',k);
}

function nst() {
    return false;
} 

function wms(title, text) {
    var txt = '';
    if (title != '') txt += '<div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><h4 class="modal-title">'+(title != '' ? title : SERVER_HOSTNAME)+'</h4></div>';
    txt += '<div class="modal-body">'+text+'</div>';
    $('#wms .modal-content').html(txt);
    $('#wms').modal();
}
function wmsc() {
    $('#wms .modal-content').html('');
    $('#wms').modal('hide');
}

function tips() {
    $('.odtip').tooltip();
}

function get_time() {
    $.ajax({type:'POST',data:{rid:'account',ajax:'wms_utime',data:{}}}).done(function(txt){
        wms(i18n.acc_timezone,txt);
        $('#wms').find('select[name=act]').val(tz);
    });
}
function wms_bets(mid,t1,t2) {
    $.ajax({type:'POST',data:{game:game_eng,rid:'bets',ajax:'wms_bets',data:{'mid':mid}}}).done(function(txt){
        wms(i18n.bets_wms, txt);
    });
}
function wms_forecaster(id, game_id) {
    $.ajax({type:'POST',data:{game:game_eng,rid:'bets',ajax:'wms_forecaster',data:{'id':id}}}).done(function(txt){
        wms(i18n.pr_wms, txt);
        convert_ago();
        $('.oop').click(function() {
            $(this).siblings('.openme').toggleClass('meopen');
            $(this).toggleClass('active');
        });
        $('.btxt').on('contextmenu', function(e){
            e.preventDefault();
        });
    });
}

function forecasts_pages(id,game_id,s) {
    $.ajax({type:'POST',data:{game:game_eng,rid:'bets',ajax:'block_forecasts',data:{'id':id,'s':s}}}).done(function(txt){
        $('#block_forecasts').html(txt);
        $('.oop').click(function() {
            $(this).siblings('.openme').toggleClass('meopen');
            $(this).toggleClass('active');
        });
        $('.btxt').on('contextmenu', function(e){
            e.preventDefault();
        });
    });
}
function subscribe(id,mid) {
    $.ajax({type:'POST',data:{rid:'bets',ajax:'subscribe',data:{'id':id,'mid':mid}}}).done(function(txt){
        var data = jQuery.parseJSON(txt);
        if (data.err) {
            if (mid) $('#frc'+id).html(data.err);
            else $('#data_end').html(data.err);
        }
        else {
            if (mid) {
                if (data.team && data.team != '//') {
                    data.team = '<span class="userbet"><b>'+data.team+'</b></span>';
                    $('#frct'+id).html(data.team);
                }
                $('#frc'+id).html(data.txt);
            }
            else $('#data_end').html(data.txt);
        }
    });
}

function comments(data) {
    if ($('#comments .nomsg')) $('#comments .nomsg').remove();
    for(i in data.data) {
        var txt = '<li>';
        txt += '<div class="com-b">';
        txt += '<span class="uavatar"><img src="/media/user/_60/'+(data.data[i].logo ? data.data[i].logo : 'no.jpg')+'" class="img-circle"></span>';
        txt += '<div class="com-bc">';
        txt += '<div class="com-autor"><b>'+data.data[i].nick+'</b> • <time>'+data.data[i].data+'</time></div>';
        txt += '<div class="com-body">'+data.data[i].txt+'</div>';
        txt += '</div></div></li>';
        $('#comments').append(txt);
    }
    $('form[name=comment] textarea').val('');
}

function predictions(type,title) {
    if ($('#filter_current').length) {
        $('#filter_current input[name=type]').val(type);
        var s = $('#filter_current input[name=s]').val();
        match_pages('current',s);
    }
    if ($('#filter_past').length) {
        $('#filter_past input[name=type]').val(type);
        var s = $('#filter_past input[name=s]').val();
        match_pages('past',s);
    }
    $('#matches span[rel=bet_title]').html(title);
}
function show_score(e,val) {
    if (val) {
        var txt = $(e).attr('data-score');
        $(e).addClass('rshow');
    }
    else {
        var txt = $(e).attr('data-txt');
        $(e).removeClass('rshow');
    }
    var time = $(e).attr('data-time');
    $(e).html(txt);
    if (time != '') {
        var mid = $(e).attr('data-mid');
        $('#live_time_'+mid).find('.scd').attr('data-time',time);
        convert_duration();
    }
    return false;
}
function score(mid,e) {
    $.ajax({type:'POST',data:{rid:'matches',ajax:'score',data:{'mid':mid}}}).done(function(txt){
        $(e).html(txt).addClass('rshow');
    });
    return false;
}
function scores(id,val) {
    $('#filter_'+id+' input[name=score]').val((val ? 1 : 0));
    var s = $('#filter_'+id+' input[name=s]').val();
    match_pages(id,s);
}
function show_scores(id,val) {
    $('#filter_'+id+' input[name=score]').val((val ? 1 : 0));
    var s = $('#filter_'+id+' input[name=s]').val();
    $('#block_matches_'+id+' span.tresult').each(function(){
        show_score(this,val);
    });
}
function live_score(mid,e) {
    $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:'live_score',data:{'mid':mid}}}).done(function(txt){
        var data = jQuery.parseJSON(txt);
        $(e).html(data.score);
        if (data.time > 0) {
	        $('#live_time_'+mid).find('.scd').attr('data-time',data.time);
			convert_duration();
        }
    });
    return false;
}
function live_build(mid) {
    $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:'live_build',data:{'mid':mid}}}).done(function(txt){
        wms('Статус башен и бараков',txt);
    });
}

function match_pages(id,s) {
    if (s == 0) s = $('#filter_'+id+' input[name=s]').val();
    else $('#filter_'+id+' input[name=s]').val(s);
    var f = 'block_matches_'+id;
    var data = {'s':s};
    if ($('#filter').length) {
        $('#filter input').each(function(){
            if ($(this).val()) {
                var n = $(this).attr('name');
                if (n) data[n] = $(this).val();
            }
        });
    }
    $('#filter_'+id+' input').each(function(){
        if ($(this).val()) {
            var n = $(this).attr('name');
            if (n) {
                data[n] = $(this).val();
            }
        }
    });
    $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:f,data:data}}).done(function(txt){
        $('#'+f).html(txt);
        tips();
        if ($('#scrorecur').prop('checked') == true) show_scores('current',1);
        if ($('#scrorepast').prop('checked') == true) show_scores('past',1);
        convert_time();
        convert_duration();
    });
}
function match_upd() {
    if ($('#block_matches_current').length) match_pages('current',0);
    if ($('#block_matches_past').length) match_pages('past',0);
}

function index_stream() {
    var id = $('#srteamslider').attr('rel');
    $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:'block_stream',data:{'id':id,'lang':'','sig_stream':sig_stream}}}).done(function(txt){
        var data = jQuery.parseJSON(txt);
        var txt = '';
        if (data.rows != null) {
	        for(var i in data.rows) {
	            txt += '<li rel="'+data.rows[i].site+'" data-original-title="'+data.rows[i].eng+'" data-original-sub="'+data.rows[i].sub+'" data-sid="'+data.rows[i].id+'" data-id="'+data.rows[i].mid+'" data-original-hash="'+data.rows[i].hash+'" class="odtip streamselect'+(data.rows[i].mid > 0 ? ' livebut' : '')+'"><div class="streamli">';
	            txt += '<div class="spic"><div class="slang">'+data.rows[i].lang+'</div><div class="speople">'+data.rows[i].viewers+'</div><img class="simg" src="'+data.rows[i].logo+'"></div>';
	            txt += '<div class="sinfo"><u>'+data.rows[i].title+'</u></div>';
	            txt += '</div><div class="sich"><input type="checkbox"></div></li>';
	        }
	        $('#index_stream').html(txt);
	        stream_current();
        }
        sig_stream = data.sig_stream;
        tips();
    });
}
function stream_current() {
    $('#mainstream [rel=stream]').each(function(){
        var main = $(this).attr('title');
        var site = $(this).attr('site');
        $('#index_stream li[rel='+site+'][data-original-title='+main+']').addClass('active');
        $('#index_stream li[rel='+site+'][data-original-title='+main+'] input').prop('checked',true);
    });
}

function mfilter(f,eng,title) {
    $('#filter input').each(function(){
        if ($(this).attr('name') == f) {
            $(this).val(eng);
            if (title != undefined && $('#filter input.'+f).length) {
	            $('#filter input.'+f).val(title);
            }
        }
    });
    $('#filter').submit();
}

var i_stream = '';

function set_time(val) {
    var c = new Date().getTimezoneOffset()*(-1);
    var time = Math.floor(Date.now() / 1000) - c*60 + val*60;
    var d = new Date(time*1000);
    tz = val;
    utime = tz*60;
    $('.utime').html(('0' + d.getHours()).slice(-2)+':'+('0' + d.getMinutes()).slice(-2)+(timezone[tz].length < 5 ? ' '+timezone[tz] : ''));
    convert_time();
}

function convert_duration() {
    $('.scd').each(function(){
        var dur = $(this).attr('data-time');
        if (dur != '') {
	        if (dur == 1) {
		        $(this).html('00:00');
	        } else {
		        var z = '';
			    if (dur < 0) {
			        z = '-';
			        dur = Math.abs(dur);
				}
				var h = Math.floor(dur/3600);
				var m = Math.floor((dur-h*3600)/60);
				var s = dur-h*3600-m*60;
				$(this).html(z+(h ? h+':' : '')+('0'+m).slice(-2)+':'+('0'+s).slice(-2));
	        }
        }
    });
}
function unixtime(a) {
    if (a == 0 || a == undefined) {
        return 0;
    }
    var ut = 0;
    if (a.match(/^\d+$/)) {
        ut = a-0;
    } else if (a = a.match(/^(\d{4})-(\d{2})-(\d{2})( (\d{2}):(\d{2}):(\d{2}))?$/)) {
        if (a[1] == '0000') {
            return 0;
        }
        if (a[4] == undefined) {
            a[5] = 0;
            a[6] = 0;
            a[7] = 0;
        }
        ut = Math.floor(Date.UTC(a[1],a[2]-1,a[3],a[5],a[6],a[7])/1000);
    } else {
        ut = 0;
    }
    return ut;
}
function convert_time() {
    var reg = /^\d+$/;
    var y = new Date().getFullYear();
    $('.sct').each(function(){
        var time = $(this).attr('data-format');
        var tmp = time.match(/%\w+%/ig);
        var a = unixtime($(this).attr('data-time'));
        if (a == 0) return;
        a = new Date((a-0+utime)*1000);
        if (tmp) {
            for(var j in tmp) {
                if (tmp[j] == '%j%') {
	                time = time.replace(tmp[j], ('0' + a.getUTCDate()).slice(-2));
                } else if (tmp[j] == '%m%') {
                    if (tmp.indexOf('%j%') != -1) {
	                    time = time.replace(tmp[j], i18n.month[a.getUTCMonth()]);
                    } else {
	                    time = time.replace(tmp[j], i18n.month2[a.getUTCMonth()]);
	                }
                } else if (tmp[j] == '%ms%') {
                    if (lang == 'cn') {
                        time = time.replace(tmp[j], i18n.month[a.getUTCMonth()]);
                    } else {
                        time = time.replace(tmp[j], i18n.month[a.getUTCMonth()].substr(0,3));
                    }
                } else if (tmp[j] == '%y%') {
                    if (a.getUTCFullYear() != y) {
	                    time = time.replace(tmp[j], ', '+a.getUTCFullYear());
                    } else {
	                    time = time.replace(tmp[j], '');
	                }
                } else if (tmp[j] == '%Y%') {
	                time = time.replace(tmp[j], a.getUTCFullYear());
                } else if (tmp[j] == '%h%') {
	                time = time.replace(tmp[j], ('0' + a.getUTCHours()).slice(-2));
                } else if (tmp[j] == '%i%') {
	                time = time.replace(tmp[j], ('0' + a.getUTCMinutes()).slice(-2));
                } else if (tmp[j] == '%s%') {
	                time = time.replace(tmp[j], ('0' + a.getUTCSeconds()).slice(-2));
                } else if (tmp[j] == '%tz%') {
	                time = time.replace(tmp[j], timezone[tz]);
	            }
            }
        }
        $(this).html(time);
    });
}
function mtime() {
	convert_time();
	convert_duration();
}
function convert_ago() {
    var reg = /^\d+$/;
    $('.sca').each(function(){
        var a = $(this).attr('data-time');
        var type = $(this).attr('data-format');
        if (a == 0) {
	        $(this).html('&ndash;');
	        return;
        }
        if (!a.match(reg)) {
	        a = new Date(a);
	    }
	    var cur = Math.round(new Date().getTime()/1000);
        var diff = cur - a;
        if (diff > 0) {
	        var x = Math.floor(diff/31536000);
			if (x > 0) {
				$(this).html(x+i18n.y+' '+i18n.ago);
            } else {
                var x = Math.floor(diff/2592000);
    			if (x > 0) {
	    			$(this).html(x+i18n.mes+' '+i18n.ago);
                } else {
                    x = Math.floor(diff/604800);
                    if (x > 0) {
	                    $(this).html(x+i18n.w+' '+i18n.ago);
                    } else {
                        x = Math.floor(diff/86400);
						if (x > 0) {
							$(this).html(x+i18n.d+' '+i18n.ago);
						} else {
							if (type == 's') {
								x = Math.floor(diff/3600);
								if (x > 0) {
									$(this).html(x+i18n.h+' '+i18n.ago);
								} else {
									x = Math.floor(diff/60);
									if (x > 0) {
										$(this).html(x+i18n.m+' '+i18n.ago);
									} else {
										$(this).html(x+i18n.s+' '+i18n.ago);
									}
								}
							} else {
								var d = new Date();
								if (d.getHours()*3600-diff > 0) {
									$(this).html(i18n.today);
								} else {
									$(this).html(i18n.yesterday);
								}
							}
                        }
					}
                }
            }
        } else {
	        diff = -diff;
	        var x = Math.floor(diff/2592000);
			if (x > 0) {
				$(this).html(x+' '+i18n.mes);
            } else {
                x = Math.floor(diff/604800);
    			if (x > 0) {
        			y = Math.floor((diff-x*604800)/86400);
                    $(this).html(x+i18n.w+(y > 0 ? ' '+y+i18n.d : ''));
        		} else {
	        		x = Math.floor(diff/86400);
        			if (x > 0) {
            			y = Math.floor((diff-x*86400)/3600);
                        $(this).html(x+i18n.d+(y > 0 ? ' '+y+i18n.h : ''));
            		} else {
                        x = Math.floor(diff/3600);
                        if (x > 0) {
                            y = Math.floor((diff-x*3600)/60);
                            $(this).html(x+i18n.h+(y > 0 ? ' '+y+i18n.m : ''));
                        } else {
                            x = Math.floor(diff/60);
                            if (x > 0) {
	                            $(this).html(x+i18n.m);
                            } else {
                                $(this).html(Math.floor(diff)+i18n.s);
                            }
                        }
                    }
	        	}
            }
        }
    });
}
function convert_long() {
    var reg = /^\d+$/;
    $('.scl').each(function(){
        var diff = $(this).attr('data-time')-0;
        if (diff == 0) {
	        $(this).html('&ndash;');
	        return;
        }
        if (diff > 0) {
	        var txt = '';
	        var x = Math.floor(diff/31536000);
			if (x > 0) {
				txt += x+i18n.y+' ';
				diff -= 31536000*x;
            }
            x = Math.floor(diff/2592000);
			if (x > 0) {
    			txt += x+i18n.m+' ';
    			diff -= 2592000*x;
            }
            x = Math.floor(diff/86400);
			if (x > 0) {
				txt += x+i18n.d+' ';
				diff -= 86400*x;
			}
			x = Math.floor(diff/3600);
			if (x > 0) {
				txt += x+i18n.h+' ';
				diff -= 3600*x;
			}
			x = Math.floor(diff/60);
			if (x > 0) {
				txt += x+i18n.m;
			}
			$(this).html(txt);
        }
    });
}
function convert_money() {
    var l = jQuery.parseJSON(i18n.money_format);
    $('.scm').each(function(){
        var val = $(this).attr('data-value');
        if (val > 0) {
	        var x = (val/1000000).toFixed(1);
			if (x >= 1) {
				$(this).html('$'+x+l[6]);
            } else {
                x = Math.floor(val/1000);
    			if (x > 10) {
	    			$(this).html('$'+x+l[3]);
    			} else {
	    			$(this).html('$'+new Intl.NumberFormat('en-US').format(val));
	    		}
            }
        }
    });
}

$(document).ready(function() {
	
	if ($('#wms .modal-content').html() != '') {
        wms('', $('#wms .modal-content').html());
    }
    
    $('#cliker').click(function(){
        if ($('#srteamslider').is(':visible')) $('#srteamslider').hide();
        else $('#srteamslider').show();
    });

	tips();
	
	$('#menu-toggle').click(function() {
		$('#wrapper').toggleClass('toggled');
		$(this).toggleClass('active');
	});
	
	$('.mob-sub-opener').click(function() {
		$(this).toggleClass('active');
		$(this).siblings('ul.sidebar-sub-nav').toggleClass('showit');
	});
	
	for(k in i18n.timezone) {
    	var d = new Date((stime+i18n.timezone[k].d*60)*1000);
    	timezone[i18n.timezone[k].d] = (i18n.timezone[k].s ? i18n.timezone[k].s : i18n.timezone[k].t);
    }
    convert_duration();
	convert_ago();
	convert_money();
	convert_long();
	
	$.ajax({type:'POST',data:{game:game_eng,rid:'account',ajax:'auth',data:{'game_id':game_id}}}).done(function(txt){
        var data = jQuery.parseJSON(txt);
        if (data.user) {
            $('#user').html(data.user);
            if (data.isAdmin) {
	            var path = $('#secu').attr('rel');
	            $('#secu').html('<a href="/'+game_eng+'/'+data.url+path+'" target="_blank" class="hvr-push"><i class="fa fa-cog"></i></a>');
				$('#secu').show();
            }
        } else {
            $('#user').html('<div class="entereg pull-right"><a class="btn btn-sm btn-primary" href="/login">'+i18n.login_title+'</a> <a class="btn btn-sm btn-primary" href="/reg">'+i18n.reg_title+'</a></div>');
        }
        if (data.tz) {
	        tz = data.tz;
        } else {
	        tz = new Date().getTimezoneOffset()*(-1);
        }
        utime = tz*60;
        stime = data.time;
        set_time(tz);
    });
    
    $('.tournament').on('keyup', function(){
        block($('#tournament'),0.4);
        $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:'tournament',data:{'title':$(this).val()}}}).done(function(txt){
            var data = jQuery.parseJSON(txt);
            $('#tournament').addClass('open');
            $('#tournament ul').html('');
            if (data.length == 0) $('#tournament ul').append('<li class="dropdown-header">'+i18n.tournament_none+'</li>');
            else {
                $('#tournament ul').append('<li class="dropdown-header">'+i18n.tournament_pick+'</li>');
                for(var i in data) {
                    $('#tournament ul').append('<li><a href="javascript:;" onClick="mfilter(\'tid\','+i+');">'+data[i]+'</a></li>');
                }
            }
            block($('#tournament'),1.0);
        });
    });
	$('.team').on('keyup', function(){
        block($('#team'),0.4);
        var iname = $(this).attr('rel');
        $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:'team',data:{'title':$(this).val()}}}).done(function(txt){
            var data = jQuery.parseJSON(txt);
            $('#team').addClass('open');
            $('#team ul').html('');
            if (data.length == 0) $('#team ul').append('<li class="dropdown-header">'+i18n.team_no_found+'</li>');
            else {
                $('#team ul').append('<li class="dropdown-header">'+i18n.team_pick+'</li>');
                if (iname == undefined) {
	                iname = 'team';
                }
                for(var i in data) {
                    $('#team ul').append('<li><a href="javascript:;" onClick="mfilter(\''+iname+'\','+i+',\''+data[i]+'\');">'+data[i]+'</a></li>');
                }
            }
            block($('#team'),1.0);
        });
    });
    $('.player').on('keyup', function(){
        block($('#player'),0.4);
        $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:'player',data:{'title':$(this).val()}}}).done(function(txt){
            var data = jQuery.parseJSON(txt);
            $('#player').addClass('open');
            $('#player ul').html('');
            if (data.length == 0) $('#player ul').append('<li class="dropdown-header">'+i18n.player_no_found+'</li>');
            else {
                $('#player ul').append('<li class="dropdown-header">'+i18n.player_pick+'</li>');
                for(var i in data) {
                    $('#player ul').append('<li><a href="javascript:;" onClick="mfilter(\'player\','+i+',\''+data[i]+'\');">'+data[i]+'</a></li>');
                }
            }
            block($('#player'),1.0);
        });
    });
    $('.hero').on('keyup', function(){
        block($('#hero'),0.4);
        $.ajax({type:'POST',data:{game:game_eng,rid:'matches',ajax:'hero',data:{'title':$(this).val()}}}).done(function(txt){
            var data = jQuery.parseJSON(txt);
            $('#hero').addClass('open');
            $('#hero ul').html('');
            if (data.length == 0) $('#hero ul').append('<li class="dropdown-header">'+i18n.hero_no+'</li>');
            else {
                $('#hero ul').append('<li class="dropdown-header">'+i18n.hero_pick+'</li>');
                for(var i in data) {
                    $('#hero ul').append('<li><a href="javascript:;" onClick="mfilter(\'hero\','+data[i].id+');"><img src="'+data[i].pic+'">'+data[i].title+'</a></li>');
                }
            }
            block($('#hero'),1.0);
        });
    });
	
    if ($('#srteamslider').length) {
        index_stream();
        stream_current();
        $('#stream-toggle').click(function() {
    		$('#srteamslider').toggleClass('toggled_stream');
    		$(this).toggleClass('active');
    	});
    	i_stream = setInterval(index_stream, 60000);
        $('#index_stream').on('click', '.streamli', function(event) {
            var eng = $(this).parent().attr('data-original-title');
            var sub = $(this).parent().attr('data-original-sub');
            var hash = $(this).parent().attr('data-original-hash');
            var site = $(this).parent().attr('rel');
            var url = '';
            $('#index_stream input:checked').each(function(){
        		$(this).prop('checked',false);
    		});
            $('#index_stream li.streamselect').removeClass('active');
    		$(this).parent().addClass('active');
    		$(this).parent().find('input').prop('checked',true);
    		if (site == 'dailymotion') url = 'https://www.dailymotion.com/embed/video/'+eng;
    		else if (site == 'hitbox') url = 'https://www.hitbox.tv/embed/'+eng;
    		else if (site == 'youtube') url = '//www.youtube.com/embed/'+sub;
    		else if (site == 'majorleaguegaming') url = 'https://www.majorleaguegaming.com/player/embed/'+eng;
    		else if (site == 'azubu') url = 'https://embed.azubu.tv/'+eng;
    		else if (site == 'dingit') url = 'https://www.dingit.tv/embed/'+eng;
    		else if (site == 'huomao') url = 'https://www.huomao.com/outplayer/index/'+eng;
    		else if (site == 'douyu') url = '/inc/douyu.php?room_id='+sub;
    		else if (site == 'ya') url = 'https://frontend.vh.yandex.ru/player/'+eng;
    		else if (site == 'vk') url = '//vk.com/video_ext.php?oid=-'+eng+'&id='+sub+'&hash='+hash;
    		else url = 'https://player.twitch.tv/?channel='+eng+'&parent=' + SERVER_HOSTNAME;
    		$('#mainstream').html('<iframe rel="stream" site="'+site+'" title="'+eng+'" allowfullscreen frameborder="0" width="100%" height="100%" src="'+url+'"></iframe>');
    	});
        $('#index_stream').on('click', '.streamselect input', function(event) {
            $('#index_stream li.streamselect').removeClass('active');
            var s = [];
    		var d = [];
    		var u = [];
    		var links = [];
    		var site_type = '';
    		$('#index_stream input:checked').each(function(){
        		site_type = $(this).parent().parent().attr('rel');
        		if (site_type == 'douyu' || site_type == 'youtube') {
	        		s.push($(this).parent().parent().attr('data-original-sub'));
        		} else {
	        		s.push($(this).parent().parent().attr('data-original-title'));
        		}
        		if (site_type == 'vk') {
	        		var link = platform[site_type].replace(/%eng%/, $(this).attr('data-original-title'));
	        		link = link.replace(/%sub%/, $(this).attr('data-original-sub'));
	        		link = link.replace(/%hash%/, $(this).attr('data-original-hash'));
        		} else {
	        		var link = platform[site_type].replace(/%eng%/, $(this).attr('data-original-title'));
        		}
        		links.push(link);
        		u.push(site_type);
        		$(this).parent().parent().addClass('active');
    		});
    		$('#mainstream [rel=stream]').each(function(){
        		d.push($(this).attr('title'));
        	});
        	for(var i=0; i<d.length; i++) {
        	    if (s.indexOf(d[i]) == -1) {
            	    $('#mainstream [title='+d[i]+']').remove();
        	    }
            }
    		if (s.length > 1) {
        		if (s.length == 2) var r = 2;
                else var r = Math.ceil(s.length/2);
                var h = 100/r;
                for(var i=0; i<s.length; i++) {
            	    if ($('#mainstream [title='+s[i]+']').length) {
                        $('#mainstream [title='+s[i]+']').css({'height':h+'%','width':'49%'});
            	    }
        		    else {
                        var url = '';
                        if (u[i] == 'dailymotion') url = 'https://www.dailymotion.com/embed/video/'+s[i];
                        else if (u[i] == 'hitbox') url = 'https://www.hitbox.tv/embed/'+s[i];
                        else if (u[i] == 'youtube') url = '//www.youtube.com/embed/'+s[i];
                        else if (u[i] == 'majorleaguegaming') url = 'https://www.majorleaguegaming.com/player/embed/'+s[i];
                        else if (u[i] == 'azubu') url = 'https://embed.azubu.tv/'+s[i];
                        else if (u[i] == 'dingit') url = 'https://www.dingit.tv/embed/'+s[i];
                        else if (u[i] == 'huomao') url = 'https://www.huomao.com/outplayer/index/'+s[i];
                        else if (u[i] == 'douyu') url = '/inc/douyu.php?room_id='+s[i];
                        else if (u[i] == 'ya') url = 'https://frontend.vh.yandex.ru/player/'+s[i];
                        else if (u[i] == 'vk') url = links[i];
						else url = 'https://player.twitch.tv/?channel='+s[i];
                        $('#mainstream').append('<iframe rel="stream" site="'+u[i]+'" title="'+s[i]+'" allowfullscreen frameborder="0" width="49%" height="'+h+'%" scrolling="no" src="'+url+'"></iframe>');
                    }
                }
            }
            else if (s.length > 0) {
                if ($('#mainstream [title='+s[0]+']').length) {
                    $('#mainstream [title='+s[0]+']').css({'height':'100%','width':'100%'});
                }
                else {
            	    var url = '';
            	    if (u[0] == 'dailymotion') url = 'https://www.dailymotion.com/embed/video/'+s[0];
            	    else if (u[0] == 'hitbox') url = 'https://www.hitbox.tv/embed/'+s[0];
                    else if (u[0] == 'youtube') url = '//www.youtube.com/embed/'+s[0];
                    else if (u[0] == 'majorleaguegaming') url = 'https://www.majorleaguegaming.com/player/embed/'+s[0];
                    else if (u[0] == 'azubu') url = 'https://embed.azubu.tv/'+s[0];
                    else if (u[0] == 'dingit') url = 'https://www.dingit.tv/embed/'+s[0];
                    else if (u[0] == 'huomao') url = 'https://www.huomao.com/outplayer/index/'+s[0];
                    else if (u[0] == 'douyu') url = '/inc/douyu.php?room_id='+s[0];
                    else if (u[0] == 'ya') url = 'https://frontend.vh.yandex.ru/player/'+s[0];
                    else if (u[0] == 'vk') url = links[0];
					else url = 'https://player.twitch.tv/?channel='+s[0];
                    $('#mainstream').html('<iframe rel="stream" site="'+u[0]+'" title="'+s[0]+'" allowfullscreen frameborder="0" width="100%" height="100%" scrolling="no" src="'+url+'"></iframe>');
                }
            }
            else {
                $('#mainstream').html('<div class="white_noize"><div class="nostream"><i class="fa fa-frown-o"></i></div></div>');
            }
        });
	}
    $.fn.shake = function () {
        var pos;
        return this.each(function () {
            pos = $(this).css('position');
            if (!pos || pos === 'static') {
                $(this).css('position', 'relative');
            }
            for (var x = 1; x <= 3; x++) {
                $(this).animate({left: -2}, 17).animate({left: 2}, 34).animate({left: 0}, 17);
            }
        });
    };
});