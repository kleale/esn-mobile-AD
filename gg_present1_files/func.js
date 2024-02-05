var SERVER_HOSTNAME = location.hostname;
var recaptchaV2;

function wms(title, text) {
    var txt = '';
    if (title != '') {
	    txt += '<div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><h4 class="modal-title">'+(title != '' ? title : 'game-tournaments.com')+'</h4></div>';
    }
    txt += '<div class="modal-body">'+text+'</div>';
    $('#wms .modal-content').html(txt);
    $('#wms').modal();
}
function wmsc() {
    $('#wms .modal-content').html('');
    $('#wms').modal('hide');
}
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
    var rid = $('form[name=' + name + ']').attr('action');
    block($('form[name=' + name + ']'), 0.4);
    $.ajax({type: 'POST', data: {rid: rid, ajax: name, data: form_data(name, token)}}).done(function (data) {
        block($('form[name=' + name + ']'), 1.0);
        if (data && data.err && data.err.recaptcha === 'v2') {
            grecaptcha.ready(() => {
                if (recaptchaV2 === undefined) {
                    recaptchaV2 = grecaptcha.render('captcha', {
                        'sitekey': recaptcha_v2_site_key
                    });
                }
            });
        }
        if (data && form_error(name,data.err)) {
            grecaptcha.ready(() => {
                if (recaptchaV2 !== undefined) {
                    grecaptcha.reset(recaptchaV2)
                }
            });

            return false;
        }
        if (data.callback) {
            return window[data.callback](data);
        } else if (data.url) {
            window.location.href = data.url;
        } else if (data.wms) {
            wms('', data.wms);
        } else {
            wmsc();
        }
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
            if (!v) {
	            return;
	        }
        } else if ($(this).prop('type') == 'radio') {
            v = ($(this).prop('checked') ? $(this).val() : 0);
            if (!v) {
	            return;
	        }
        } else {
            if ($(this).hasClass('tiny')) {
                v = tinyMCE.get(k).getContent()
            } else {
                v = $(this).val();
            }
        }
        if (n > 0) {
            if (!data[n]) {
	            data[n] = {};
            }
            if (data[n][k]) {
                if (typeof data[n][k] == 'string') {
	                data[n][k] = [data[n][k]];
                }
                data[n][k].push(v);
            } else {
                data[n][k] = v;    
            }
        } else {
            if (data[k]) {
                if (typeof data[k] == 'string') {
	                data[k] = [data[k]];
                }
                data[k].push(v);
            } else {
                data[k] = v;    
            }
        }
    })
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
    if (!err) {
	    return false;
    }
    var j = 0;
    for(var i in err) {
        $('form[name='+name+'] div[rel="'+i+'"]').addClass('has-error').append('<p'+(j==0 ? ' id="ferr"' : '')+' class="help-block">'+err[i]+'</p>');
        j = 1;
    }
    return true;
}
function block(e, k) {
    $(e).css('opacity',k);
}
function set_elapsed(val) {
    $.ajax({data:{rid:'account',ajax:'settings',data:{p:'elapsed',act:val}}});
    if (val) {
        $('.mtime.sct').removeClass('sct').addClass('sca');
        convert_ago();
    } else {
        $('.mtime.sca').removeClass('sca').addClass('sct');
        convert_time();
    }
}
function set_time(val) {
    var c = new Date().getTimezoneOffset()*(-1);
    var time = Math.floor(Date.now() / 1000) - c*60 + val*60;
    var d = new Date(time*1000);
    tz = val;
    utime = tz*60;
    $('.utime').html(('0' + d.getHours()).slice(-2)+':'+('0' + d.getMinutes()).slice(-2)+(timezone[tz].length < 5 ? ' <span class="hidden-xs">'+timezone[tz]+'</span>' : ''));
    $('.timezone li').removeClass('active');
    $('.timezone li[rel='+tz+']').addClass('active');
    $.ajax({data:{rid:'account',ajax:'settings',data:{p:'tz',act:val}}});
	convert_time();
}
function convert_duration() {
    $('.scd').each(function(){
        var dur = $(this).attr('data-time');
        if (dur != '') {
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
        var c = $(this).attr('data-compare');
        if (c) {
	        if (c.match(reg)) {
		        c = new Date((c-0+utime)*1000);
	        } else {
		        c = new Date(c);
	        }
        }
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
	                if (!c || a.getUTCFullYear() != c.getUTCFullYear()) {
		                time = time.replace(tmp[j], a.getUTCFullYear());
	                } else {
		                time = time.replace(tmp[j], '');
	                }
                } else if (tmp[j] == '%h%') {
	                time = time.replace(tmp[j], ('0' + a.getUTCHours()).slice(-2));
                } else if (tmp[j] == '%i%') {
	                time = time.replace(tmp[j], ('0' + a.getUTCMinutes()).slice(-2));
                } else if (tmp[j] == '%tz%') {
	                time = time.replace(tmp[j], timezone[tz]);
	            }
            }
        }
        $(this).html(time);
    });
}
function convert_ago() {
    var reg = /^\d+$/;
    $('.sca').each(function(){
        var a = $(this).attr('data-time');
        if (a == 0) {
	        $(this).html('&ndash;');
	        return;
        }
        if (!a.match(reg)) {
	        a = new Date(a).getTime()/1000;
        }
        var diff = new Date().getTime()/1000 - a;
        if (diff > 0) {
	        var x = Math.floor(diff/31536000);
			if (x > 0) {
				$(this).html(x+i18n.y+' '+i18n.ago);
            } else {
                var x = Math.floor(diff/2592000);
    			if (x > 0) {
	    			$(this).html(x+i18n.m+' '+i18n.ago);
                } else {
                    x = Math.floor(diff/604800);
                    if (x > 0) {
	                    $(this).html(x+i18n.w+' '+i18n.ago);
                    } else {
                        x = Math.floor(diff/86400);
						if (x > 0) {
							$(this).html(x+i18n.d+' '+i18n.ago);
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
    			if (x >= 10) {
	    			$(this).html('$'+x+l[3]);
    			} else {
	    			$(this).html('$'+new Intl.NumberFormat('en-US').format(val));
	    		}
            }
        }
    });
}
function convert_dist() {
    var l = jQuery.parseJSON(i18n.dist_format);
    $('.sck').each(function(){
        var val = $(this).attr('data-value');
        if (val > 0) {
	        var x = (val/1000).toFixed(1);
			if (x >= 1) {
				$(this).html(x+l[3]);
            } else {
                x = Math.floor(val);
    			$(this).html(x+l[1]);
            }
        }
    });
}
function mfilter(f, eng) {
    if (Array.isArray(f) == false) {
	    f = new Array(f);
    }
    $('#filter input').each(function(){
        if (f.indexOf($(this).attr('name')) != -1) {
            $(this).val(eng);
        }
    });
    $('#filter').submit();
}
function show_score(e, val) {
    var score = $(e).attr('data-score');
    if (val) {
        var txt = score;
        $(e).addClass('rshow');
    } else {
        var txt = (score ? i18n.score : 'vs');
        $(e).removeClass('rshow');
    }
    if (txt) {
	    $(e).find('.tresult').html(txt);
    }
    return false;
}
function show_scores(val) {
    $.ajax({data:{rid:'account',ajax:'settings',data:{p:'score',act:val}}});
    $('.m-item').each(function(){
        show_score(this,val);
    });
}
function subscribe_pr(id, mid) {
    if (mid == undefined) mid = 0;
    $.ajax({data:{rid:'account',ajax:'subscribe',data:{'id':id,'mid':mid}}}).done(function(data){
        if (data.err) {
            if (mid) $('.prp[rel=p'+id+'] .prt').html('<span class="text-danger">'+data.err+'</span>');
            else $('#data_end').html(data.err);
        } else {
            if (mid) {
                $('.prp[rel=p'+id+']').replaceWith(data.txt);
            } else {
	            $('#data_end').html(data.txt);
	            convert_time();
	        }
        }
    });
}
function match_upd() {
    if ($('#block_matches_live').length) {
	    match_pages('live',0);
    }
    if ($('#block_matches_current').length) {
	    match_pages('current',0);
    }
    if ($('#block_matches_past').length) {
	    match_pages('past',0);
	}
}
function match_pages(id, s) {
    var f = 'block_matches_'+id;
    var data = {'s':s};
    if ($('#filter').length) {
        $('#filter input').each(function(){
            if ($(this).val()) {
                var n = $(this).attr('name');
                if (n) {
	                data[n] = $(this).val();
	            }
            }
        });
    }
    $.ajax({dataType:'html',data:{rid:'matches',game:game_eng,ajax:f,data:data}}).done(function(txt){
        if (txt != '') {
		    $('#'+f).html(txt);
	        convert_time();
	        convert_duration();
	        //bookmaker();
	        if ($('input[name=score]').prop('checked')) {
	            show_scores(1);
	        }
	        if ($('input[name=elapsed]').prop('checked')) {
	            set_elapsed(1);
	        }
	        $('#block_matches_search div[rel='+id+']').removeClass('hide');
	    } else {
		    $('#'+f).html('');
		    $('#block_matches_search div[rel='+id+']').addClass('hide');
	    }
    });
}
function bookmaker(key) {
    if (key == undefined) {
		key = $('#bookmakers li.active').attr('rel');
	} else {
		$.ajax({data:{rid:'account',ajax:'settings',data:{p:'bookmaker',act:key}}});
	}
	$('.bet-p').html('');
	$('.m-item').each(function(){
    	var b = $(this).attr('data-bm');
    	if (b) {
        	b = jQuery.parseJSON($(this).attr('data-bm'));
        	if (b[key]) {
            	var k = b[key].split('|');
            	$(this).find('.bet-p[rel=0]').html('('+k[0]+')');
            	$(this).find('.bet-p[rel=1]').html('('+k[1]+')');
            }
        }
	});
	$('#bookmakers li').removeClass('active');
    $('#bookmakers li[rel='+key+']').addClass('active');
    var title = $('#bookmakers li[rel='+key+'] a').html();
    $('#bookmaker').html(title);
}
function comments(data) {
    if ($('#comments .no100')) {
	    $('#comments').html('<ul class="m-com-list"></ul>');
    }
    for(i in data.data) {
        var txt = '<li>';
        txt += '<a href="#"><img src="/media/user/_50/'+(data.data[i].logo ? data.data[i].logo : 'no.jpg')+'"></a>';
        txt += '<div>';
        txt += '<b>'+data.data[i].nick+'</b> • <span class="sct" data-format="'+i18n.date_format+'" data-time="'+data.data[i].data+'">'+data.data[i].data+'</span>';
        txt += '<p>'+data.data[i].txt+'</p>';
        txt += '</div></li>';
        $('#comments ul').append(txt);
    }
    convert_time();
    $('form[name=comment] textarea').val('');
}
function fmatch(type, id, title) {
    var f = {
	    't1': $('#filter input[name=t1]'),
	    't2': $('#filter input[name=t2]'),
	    'event': $('#filter input[name=event]'),
	    'stage': $('#filter input[name=stage]')
    };
    var ph = [];
    if ($(f[type]).val() == id) {
	    $(f[type]).val('').attr('title','');
	} else {
		$(f[type]).val(id).attr('title',title);
	}
	$('#fmatch ul').html('');
    for(k in f) {
        if ($(f[k]).val()) {
            $('#fmatch ul').append('<li><a href="javascript:;" onClick="fmatch(\''+k+'\','+$(f[k]).val()+');"><i class="times"></i> '+$(f[k]).attr('title')+'</a></li>');
			if ($(f[k]).val()) {
		        t = $(f[k]).attr('title').split(' / ');
		        ph.push(t[0]);
	        }
        }
    }
    match_pages('search', 0);
    $('.fmatch').val('');
    if (ph.length) {
	    $('.fmatch').attr('placeholder',i18n.match_search+': '+ph.join(' / '));
	} else {
		$('.fmatch').attr('placeholder',i18n.match_search_all);
		$('#fmatch').parent().addClass('btn-hide');
	}
}
function index_stream() {
    var id = $('#srteamslider').attr('rel');
    $.ajax({data:{rid:'helper',game:game_eng,ajax:'block_stream',data:{'id':id,'sig_stream':sig_stream}}}).done(function(data){
        console.log('stream_sig',sig_stream+'='+data.sig_stream);
        console.log('stream',data.rows);
        if (data.rows != null) {
	        var txt = '';
	        var mid = 0;
	        var l = 0;
	        for(var i in data.rows) {
	            l = ($('#mainstream [site='+data.rows[i].site+'][title='+data.rows[i].eng+']').length ? 1 : 0);
			    txt += '<li rel="'+data.rows[i].site+'" title="'+data.rows[i].eng+'" data-sub="'+data.rows[i].sub+'" data-sid="'+data.rows[i].id+'" data-id="'+data.rows[i].mid+'" data-hash="'+data.rows[i].hash+'" class="sstream'+(data.rows[i].mid > 0 ? ' live' : '')+(l ? ' active' : '')+'">';
	            txt += '<span><img src="'+data.rows[i].logo+'"></span>';
	            txt += '<div><strong>'+data.rows[i].status+'</strong><u><i class="gti-eye"></i> '+data.rows[i].viewers+' &nbsp; ['+data.rows[i].lang+'] '+data.rows[i].eng+'</u></div><em class="sstream"></em>';
	            txt += '</li>';
	            if (l && data.rows[i].mid) {
		            mid = data.rows[i].mid;
	            }
	        }
	        $('#index_stream').html(txt);
	    }
        sig_stream = data.sig_stream;
    });
}

var liem = 0;
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
    'twitch_vod': 'https://player.twitch.tv/?video=%eng%&parent=' + SERVER_HOSTNAME,
    'vk': 'https://vk.com/video_ext.php?oid=%eng%',
    'youku': 'https://player.youku.com/embed/%eng%',
    'ya': 'https://frontend.vh.yandex.ru/player/%eng%',
    'vk': '//vk.com/video_ext.php?oid=-%eng%&id=%sub%&hash=%hash%',
    'afr': '//play.afreecatv.com/%eng%/%sub%/embed'
};
var platform_start = {
    'twitch': '&time=%t%s',
    'youtube': '?start=%t%'
};
var timezone = [];
var utime = tz*60;
var input_val = '';
var input_eng = '';
var page_match = 0;
var i_stream = '';

$(document).ready(function() {
	$.ajaxSetup({
        type: 'POST',
        dataType: 'json'
    });
	if ($('#wms .modal-content').html() != '') {
        wms('', $('#wms .modal-content').html());
    }
	$('.tip').tooltip({
    	container: 'body'
    });
    for(k in i18n.timezone) {
    	var d = new Date((stime+i18n.timezone[k].d*60)*1000);
    	timezone[i18n.timezone[k].d] = (i18n.timezone[k].s ? i18n.timezone[k].s : i18n.timezone[k].t);
    	$('.timezone').append('<li rel="'+i18n.timezone[k].d+'"><a href="javascript:;" onClick="set_time('+i18n.timezone[k].d+')">'+('0' + d.getUTCHours()).slice(-2)+':'+('0' + d.getUTCMinutes()).slice(-2)+(i18n.timezone[k].s ? ' <b>'+i18n.timezone[k].s+'</b>' : '')+' ('+i18n.timezone[k].t+')</a></li>');
    }
	set_time(tz);
	convert_duration();
	convert_ago();
	convert_money();
	convert_long();
	if ($('input[name=score]').length) {
		//bookmaker();
		$('input[name=score]').on('change', function(e) {
			show_scores($(this).prop('checked'));
		});
		if ($('input[name=score]').prop('checked')) {
	        show_scores(1);
	    }
	    if ($('input[name=elapsed]').prop('checked')) {
	        set_elapsed(1);
	    }
	}
	if ($('#srteamslider').length) {
        i_stream = setInterval(index_stream, 60000);
        
    	$('#srteamslider').on('click', '.sstream', function(event) {
            if ($(this)[0].tagName == 'EM') {
                if ($(this).parent().hasClass('active')) {
	                $(this).parent().removeClass('active');
                } else {
	                $(this).parent().addClass('active');
                }
                liem = 1;
                return;
            } else if (!liem && $(this)[0].tagName == 'LI') {
                $('#index_stream li.sstream').removeClass('active');
                $(this).addClass('active');
            }
            liem = 0;
            var s = [];
    		var d = [];
    		var u = [];
    		var links = [];
    		var site_type = '';
    		var mid = 0;
            $('#index_stream li.sstream.active').each(function(){
        		site_type = $(this).attr('rel');
        		if (site_type == 'douyu' || site_type == 'youtube') {
	        		s.push($(this).attr('data-sub'));
        		} else {
	        		s.push($(this).attr('title'));
        		}
        		if (site_type == 'vk') {
	        		var link = platform[site_type].replace(/%eng%/, $(this).attr('title'));
	        		link = link.replace(/%sub%/, $(this).attr('data-sub'));
	        		link = link.replace(/%hash%/, $(this).attr('data-hash'));
        		} else if (site_type == 'douyu' || site_type == 'youtube') {
	        		var link = platform[site_type].replace(/%eng%/, $(this).attr('data-sub'));
	        	} else if (site_type == 'afr') {
	        		var link = platform[site_type].replace(/%eng%/, $(this).attr('title'));
	        		link = link.replace(/%sub%/, $(this).attr('data-sub'));
	        	} else {
	        		var link = platform[site_type].replace(/%eng%/, $(this).attr('title'));
        		}
        		links.push(link);
        		u.push(site_type);
        		if ($(this).attr('data-id') > 0) {
	        		mid = $(this).attr('data-id')-0;
        		} 
        	});
    		$('#mainstream [rel=stream]').each(function(){
        		d.push($(this).attr('title'));
        	});
        	if (d.length > 0) {
            	$('#mainstream form').remove();
            	for(var i=0; i<d.length; i++) {
            	    if (s.indexOf(d[i]) == -1) {
                	    $('#mainstream [title='+d[i]+']').remove();
                	}
                }
            } else {
                $('#mainstream').html('<div class="iframer"></div>');
            }
        	if (s.length > 0) {
        		var r = (s.length <= 2 ? s.length : Math.ceil(s.length/2));
                var h = 100/r;
                var w = (r == 1 ? 100 : 50);
                for(var i=0; i<s.length; i++) {
            	    if ($('#mainstream .iframer [title='+s[i]+']').length) {
                        $('#mainstream .iframer [title='+s[i]+']').css({'height':h+'%','width':w+'%'});
            	    } else {
                        var link = links[i];
                        $('#mainstream .iframer').append('<iframe rel="stream" site="'+u[i]+'" title="'+s[i]+'" allowfullscreen frameborder="0" width="'+w+'%" height="'+h+'%" scrolling="no" src="'+link+'"></iframe>');
                    }
                }
            } else {
                $('#mainstream').html('<div class="iframer"></div><div class="white_noize"><div class="nostream"><i class="fa fa-frown-o"></i></div></div>');
            }
        });
        $('#srteamslider').on('click', '.iframerClicker', function() {
            $('#mainstream form').remove();
            var w = $(this)[0].style.width;
            var h = $(this)[0].style.height;
            var site_type = $(this).attr('site');
            if (site_type == 'douyu' || site_type == 'youtube') {
        		var link = platform[site_type].replace(/%eng%/, $(this).attr('data-sub'));
        	} else {
	        	var link = platform[site_type].replace(/%eng%/, $(this).attr('title'));
            }
            $(this).after('<iframe rel="stream" site="'+$(this).attr('site')+'" title="'+$(this).attr('title')+'" allowfullscreen frameborder="0" width="'+w+'%" height="'+h+'%" scrolling="no" src="'+link+'"></iframe>').remove();
		});
	}
	$('.ch_times').click(function () {
		$('body').removeClass('chat-open');
		$(this).removeClass('active');
	});
	$('#hamburger').click(function () {
		$(this).toggleClass('active');
		$('.tab-content').toggleClass('open');
		$('.homenav').toggleClass('open');
	});
	function j(st, lastScrollTop){
		if (st > lastScrollTop){
			$('.header').addClass('affix');
		} else {
			$('.header').removeClass('affix');
		}
	}
	$(document).on('click', '.m-item', function(e) {
	    var url = $(e.currentTarget).attr('data-href');
    	if (url) {
        	if (e.metaKey == true || e.shiftKey == true || e.altKey == true) {
				window.open(url);
	        } else {
	        	window.location.href = url;
	        }
    	}
	});
	$(document).on('click', '.m-item .tresult', function(e) {
	    e.stopPropagation();
        show_score($(this).closest('.m-item'),1);
	});
	$(document).on('click', '.m-item .wmsb', function(e) {
	    e.stopPropagation();
        $.ajax({dataType:'html',data:{rid:'matches',ajax:'wms_bets','game':game_eng,data:{'mid':$(this).closest('.m-item').attr('data-id')}}}).done(function(txt){
            wms(i18n.bets_wms, txt);
            convert_time();
        });
	});
	$(document).on('click', '.prpc', function(e) {
	    if ($(this).hasClass('open')) {
		    $(this).find('.prt em').show();
		    $(this).find('.prm').html(i18n.pr_more);
		    $(this).removeClass('open');
		}
		else {
			$(this).find('.prt em').hide();
		    $(this).find('.prm').html(i18n.pr_cut);
		    $(this).addClass('open');
		}
	});
	
	$('.chatter').scroll(function() {
        if ($('#bchat').height() - 50 < $('.chatter').scrollTop()+$('.chatter').height()) {
            $('#mmore').removeClass('visible');
        }
    });
    var lastScrollTop = 0, delta = 100;
	$(window).scroll(function(event){
		var st = $(this).scrollTop();
		if (Math.abs(lastScrollTop - st) <= delta) return;
		setTimeout(j(st, lastScrollTop),250);
		lastScrollTop = st;
	});
	$('.ftour').on('keyup', function() {
        block($('#ftour'),0.4);
        $.ajax({data:{rid:'helper',game:game_eng,ajax:'tournament',data:{'title':$(this).val()}}}).done(function(data){
            $('#ftour').html('<button type="button" class="btn btn-default dropdown-toggle caret-abs" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu dropdown-menu-right"></ul>');
            $('#ftour').parent().removeClass('btn-hide');
            $('#ftour').addClass('open');
            if (data.length == 0) {
	            if (!game_eng) {
		            $('#ftour ul').append('<li class="dropdown-header">'+i18n.tournament_game+'</li>');
		        } else {
			        $('#ftour ul').append('<li class="dropdown-header">'+i18n.tournament_none+'</li>');
			    }
            } else {
                for(var i in data) {
                    if (i == 0) {
	                    input_val = data[i].id;
                    }
                    $('#ftour ul').append('<li><a href="javascript:;" onClick="ftour('+data[i].id+',\''+data[i].eng+'\');">'+data[i].title+'</a></li>');
                }
            }
            block($('#ftour'),1.0);
        });
    });
    $('.fteam').on('keyup', function() {
        $.ajax({data:{rid:'helper',game:game_eng,ajax:'team',data:{'title':$(this).val()}}}).done(function(data){
            block($('#fteam'),1.0);
            $('#fteam').html('<button type="button" class="btn btn-default dropdown-toggle caret-abs" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu dropdown-menu-right"></ul>');
            $('#fteam').parent().removeClass('btn-hide');
            $('#fteam').addClass('open');
            if (data.length == 0) {
	            $('#fteam ul').append('<li class="dropdown-header">'+i18n.team_no_found+'</li>');
            } else {
                for(var i in data) {
                    if (i == 0) {
	                    input_val = data[i].id;
	                    input_eng = data[i].eng;
                    }
                    $('#fteam ul').append('<li><a href="javascript:;" onClick="fteam('+data[i].id+',\''+data[i].eng+'\');">'+data[i].title+'</a></li>');
                }
            }
            block($('#fteam'),1.0);
        });
    });
    $('.fplayer').on('keyup', function() {
        $.ajax({data:{rid:'helper',game:game_eng,ajax:'player',data:{'title':$(this).val()}}}).done(function(data){
            block($('#fplayer'),1.0);
            $('#fplayer').html('<button type="button" class="btn btn-default dropdown-toggle caret-abs" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu dropdown-menu-right"></ul>');
            $('#fplayer').parent().removeClass('btn-hide');
            $('#fplayer').addClass('open');
            if (data.length == 0) {
	            $('#fplayer ul').append('<li class="dropdown-header">'+i18n.player_no_found+'</li>');
            } else {
                for(var i in data) {
                    if (i == 0) {
	                    input_val = data[i].id;
	                    input_eng = data[i].eng;
                    }
                    $('#fplayer ul').append('<li><a href="javascript:;" onClick="fplayer('+data[i].id+',\''+data[i].eng+'\');">'+data[i].title+'</a></li>');
                }
            }
            block($('#fplayer'),1.0);
        });
    });
    $('.fhero').on('keyup', function() {
        $.ajax({data:{rid:'helper',game:game_eng,ajax:'hero',data:{'title':$(this).val()}}}).done(function(data){
            block($('#fhero'),1.0);
            $('#fhero').html('<button type="button" class="btn btn-default dropdown-toggle caret-abs" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu dropdown-menu-right hero-menu"></ul>');
            $('#fhero').parent().removeClass('btn-hide');
            $('#fhero').addClass('open');
            if (data.length == 0) {
	            $('#fhero ul').append('<li class="dropdown-header">'+hero_no+'</li>');
            } else {
                for(var i in data) {
                    if (i == 0) {
	                    input_val = data[i].id;
                    }
                    $('#fhero ul').append('<li><a href="javascript:;" onClick="mfilter(\'hero\','+data[i].id+');"><img src="/media/game/hero/582/_59/'+data[i].id+'.png">'+data[i].title+'</a></li>');
                }
            }
            block($('#fhero'),1.0);
        });
    });
    $('.fmatch').on('keyup', function(){
        $.ajax({data:{rid:'helper',game:game_eng,ajax:'match',data:{'title':$(this).val()}}}).done(function(data){
            $('#fmatch').parent().removeClass('btn-hide');
			$('#fmatch').addClass('open');
            $('#fmatch li').each(function(){
                if (!$(this).attr('rel')) $(this).remove();
            });
            if (data.length == 0) {
	            $('#fmatch ul').append('<li class="dropdown-header">'+i18n.tournament_none+'</li>');
            } else {
                var ist1 = $('#filter input[name=t1]').val();
                for(var type in data) {
                    $('#fmatch ul').append('<li class="dropdown-header">'+type+'</li>');
                    for(var i in data[type]) {
                        $('#fmatch ul').append('<li><a href="javascript:;" onClick="fmatch(\''+(type == 'team' ? (ist1 ? 't2' : 't1') : type)+'\','+data[type][i].id+',\''+data[type][i].title+'\');">'+data[type][i].title+'</a></li>');
                    }
                }
            }
        });
    });
    $('input').keypress(function(event) {
        if (event.which == 13) {
            event.preventDefault();
            if ($(this).hasClass('fteam') && input_val) {
	            fteam(input_val, input_eng);
            } else if ($(this).hasClass('fplayer') && input_val) {
	            fplayer(input_val, input_eng);
            } else if ($(this).hasClass('fhero') && input_val) {
	            mfilter('hero', input_val);
            } else if ($(this).hasClass('ftour') && input_val) {
	            ftour(input_val, input_eng);
            } else {
	            $(this).closest('form').submit();
	        }
        }
    });
});