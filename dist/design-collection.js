(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// var startTime = Date.now();  // Firefoxのみ対応している関数です。 その他のブラウザでは Date.now() などの関数を使うことができます。
// console.log(startTime)

// function step() {
//   var progress = Date.now() - startTime;
//     console.log(progress)
//   //d.style.left = Math.min(progress/10, 200) + "px";
//   if (progress < 2000) {
//     window.requestAnimationFrame(step);
//   } else {
//       console.log('end')
//   }
// }

// requestAnimationFrame(step);

function MyAnime(el, param, time) {
    var startTime = Date.now();
    //
    param.forEach(function(e) {
        el.style[e.style] = '' + e.start + e.unit;
    });
    el.style.display = '';
    //
    var promise = new Promise(function(resolve) {
        //
        function step() {
            var progress = Date.now() - startTime;
            if (progress < time) {
                //
                param.forEach(function(e) {
                    el.style[e.style] = '' + (e.start + (e.end - e.start) * (progress / time)) + e.unit;
                });
                //
                requestAnimationFrame(step);
            } else {
                param.forEach(function(e) {
                    el.style[e.style] = '' + e.end + e.unit;
                })
                resolve();
            }
        }
        //
        requestAnimationFrame(step);
    });
    return promise;
}

function Fade(el, time, sw) {
    if (sw) {
        el.style.opacity = 0;
        el.style.display = '';
        var param = [{style: 'opacity', start: 0, end: 1, unit: ''}];
    } else {
        var param = [{style: 'opacity', start: 1, end: 0, unit: ''}];
    }
    var anime = new MyAnime(el, param, time);
    anime.then(function() {
        el.style.opacity = '';
        if (!sw) {
            el.style.display = 'none';
        }
    });
    return anime;
}
//
// var fade = {
//     anime: function(el, time, sw, func) {
//         //true : in, false : out
//         var anime = el.animate([
//             {opacity: 0},
//             {opacity: 100}
//         ], {
//             direction: (function() {
//                 if (sw) {
//                     el.style.display = '';
//                     return 'normal';
//                 } else {
//                     return 'reverse';
//                 }
//             })(),
//             duration: time
//         });
//         //
//         anime.pause();
//         anime.onfinish = function() {
//             if (!sw) {
//                 el.style.display = 'none';
//             }
//             if (func) {
//                 func();
//             }
//         };
//         anime.play();
//     },
//     in: function (el, time, func) {
//         this.anime(el, time, true, func);
//     },
//     out: function (el, time, func) {
//         this.anime(el, time, false, func);
//     }
// };

var fade = {
    in: function(el, time) {
        return new Fade(el, time , true);
    },
    out: function(el, time) {
        return new Fade(el, time, false);
    }
};
//
function Collection(json) {
    var _this = this;
    this.data = json;
    this.setRows();
    //
    // $(window).on('orientationchange', function() {
    window.addEventListener('orientationchange', function() {
        console.log('orient')
        // if ($('#main:visible').length) {
            _this.orient();
        // }
    });
    //
    this.start();
    //
    return this;
}

Collection.prototype.start = function() {
    console.log('global start');
    var _this = this;
    // $('#main').fadeIn(250, function() {
    var main = document.getElementById('main');
    fade.in(main, 250).then(function() {
        _this.restart();
    });
};

Collection.prototype.restart = function() {
    this.index = 0;
    waypoint.on();
    this.addItem();
};

Collection.prototype.orient = function() {
    // $('#rows-container').children().remove();
    document.getElementById('rows-container').innerHTML = '';
    this.setRows();
    this.restart();
};

Collection.prototype.setRows = function() {
    // var rows = Math.floor($('html').width() / 160);
    var rows = Math.floor(window.innerWidth / 160);
    if (rows == 0) {
        rows = 1;
    }
    //
    var container = document.getElementById('rows-container');
    for (var i = 0; i < rows; i++) {
//        $('#rows-container').append('<ul class="item-container"></ul>');
        container.insertAdjacentHTML("beforeend", '<ul class="item-container"></ul>');
    }
};
//
Collection.prototype.check = function() {
     return (this.index < this.data.length);
};
//
Collection.prototype.addItem = function() {
    //メニューに戻った場合、読み込み中断
    // if (!$('#waypoint:visible').length) {
    //     return false;
    // }
    //
    var _this = this;
//    var waypointTop = $('#waypoint').offset().top;
    var waypointTop = getOffset(document.getElementById('waypoint')).top;
    // https://github.com/oneuijs/You-Dont-Need-jQuery#promises
    var scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
    // var scrollTop = $(document).scrollTop();
    // if ((waypointTop - scrollTop + 12) < $(window).height()) {
    if ((waypointTop - scrollTop + 12) < window.innerHeight) {
        scrollEvent.off();
        this.loadItem()
            //次のアイテムがある場合はresolveが返ってきて、引き続きアイテム挿入を呼び出す
            // .done(function() {
            //     waypoint.move();
            //     //画面下まで到達または閉じるボタンが押された場合読み込み中断
            //     if (!_this.addItem()) {
            //         scrollEvent.on(_this);
            //         console.log('addItem stop')
            //     }
            // })
            // //次のアイテムがない場合はrejectが返ってきて終了
            // .fail(function() {
            //     console.log('item loaded')
            //     waypoint.off();
            // });
            .then(function() {
                waypoint.move();
                if (!_this.addItem()) {
                    scrollEvent.on(_this);
                    console.log('addItem stop');
                }
            }, function() {
                console.log('item loaded');
                waypoint.off();
            });
        return true;
    } else {
        return false;
    }
};
//
Collection.prototype.loadItem = function() {
    console.log('loadItem - index : %d', this.index);
    var tmp = this.getJSON();
    var dfd = deferred();
    //
    if (tmp) {
        var item = this;
        // var target = $("<dd class='item-image'></dd>")
        var target = document.createElement('dd');
        target.classList.add('item-image');
        // var dl = $("<dl class='small'></dl>")
        var dl = document.createElement('dl');
        dl.classList.add('small');
        dl.setAttribute('title', tmp.title);
        dl.setAttribute('source_url', tmp.link);
        dl.appendChild(target);
        // var li = $("<li class='item' style='display:none;'></li>");
        var li = document.createElement('li');
        li.classList.add('item');
        li.style.display = 'none';
        li.appendChild(dl);
        // $('#waypoint').before(li.append(dl.append(target)));
        var waypoint = document.getElementById('waypoint');
        waypoint.parentNode.insertBefore(li, waypoint);
        //
        function appendSVG() {
            if (tmp.data != 'image not found') {
                // target
                //     .html(tmp.data)
                //     .on('click', function(e) {
                //         zoomEvent.on(e);
                //         createZoom(tmp);
                //     });
                target.innerHTML = tmp.data;
                target.addEventListener('click', function(e) {
                    // zoomEvent.on(e);
                    createZoom(tmp, e);
                });
            } else {
                console.log('no image...')
                // target.html('<span class="bold9 small">Not Found.</span>');
                append(target, '<span class="bold9 small">Not Found.</span>');
            }
            //
            item.showItem(li).then(function() {
                dfd.resolve();
            }, function() {
                dfd.reject();
            });
                // .done(function() {
                //     dfd.resolve();
                // })
                // .fail(function() {
                //     dfd.reject();
                // });
        }
        //
        if (tmp.data) {
            // setTimeout(function() {
                appendSVG();
            // }, 0);
        } else {
            // $.ajax({
            //     type: 'get',
            //     url: 'svg/' + tmp.url + '.svg'
            // }).done(function(svg) {
            //     tmp.data = $('<div></div>').append($(svg).find('svg')).html();
            // }).fail(function() {
            //     console.log('File Not Found...')
            //     tmp.data = 'image not found';
            // }).always(function(){
            //     appendSVG();
            // });
            var request = new XMLHttpRequest();
            request.open('get', 'svg/' + tmp.url + '.svg', true);
            request.onload = function(event) {
                if (request.status >= 200 && request.status < 400) {
                    //success
                    tmp.data = request.responseText;
                } else {
                    //false
                    console.log('File Not Found...');
                    tmp.data = 'image not found';
                }
                appendSVG();
            };
            request.send(null);
        }
        return dfd.promise();
    } else {
        return dfd.reject();
    }
};
//
Collection.prototype.showItem = function(li) {
    // var dfd = $.Deferred();
    var dfd = deferred();
    var item = this;
    var duration = 0;
    // li.fadeIn(duration, function() {
    fade.in(li, duration).then(function() {
        if (item.check()) {
            dfd.resolve();
        } else {
            dfd.reject();
        }
    });
    return dfd.promise();
};
//
Collection.prototype.getJSON = function() {
    if (this.check()) {
        var tmp = this.data[this.index];
        this.index ++;
        //fill mode
        if (this.index >= this.data.length) {
            console.log('fill mode')
            this.index = 0;
        }
    } else {
        var tmp = false;
    }
    return tmp;
};

//
// $('#zoom-container .item-image').on('click', function() {
//     $('#download').fadeOut(100);
//     $('#zoom-container').fadeOut(100, function() {
//         zoomEvent.off();
//     });
// });
(function() {
    var zoom_container = document.getElementById('zoom-container');
    var item_image = document.getElementsByClassName('item-image');
    //
    item_image[0].addEventListener('click', function() {
        var download = document.getElementById('download');
        fade.out(download, 100);
        fade.out(zoom_container, 100);
            // .done(function() {
            //     zoomEvent.off();
            // });
    });
})();
//
var waypoint = {
    on: function() {
        // $('#rows-container').children().eq(this.calc())
        //     .append($("<li id='waypoint' class='anime-blink'><div><span>Now Loading...</span></div></li>"));
        var container = document.getElementById('rows-container');
        target = container.childNodes[this.calc()];
        append(target, '<li id="waypoint" class="anime-blink"><span>Now Loading...</span></li>');
    },
    off: function() {
        // $('#waypoint').remove();
        document.getElementById('waypoint').remove();
    },
    calc : function() {
        var heightList = [];
        // $('#rows-container').children().each(function(){
        //     heightList.push($(this).height());
        // });
        var container = document.getElementById('rows-container');
        // container.childNodes.forEach(function(node) {
        //     console.log(node)
        //     heightList.push(node.clientHeight);
        // });
        var children = container.childNodes;
        for (var i = 0; i < children.length; i++) {
            heightList.push(children[i].clientHeight);
        }
        return heightList.indexOf(Math.min.apply(null, heightList));
    },
    move : function() {
        // $('#waypoint').appendTo($('#rows-container').children().eq(this.calc()));
        var container = document.getElementById('rows-container');
        target = container.childNodes[this.calc()];
        var waypoint = document.getElementById('waypoint');
        target.appendChild(waypoint);
    }
};
//
var scrollEvent = {
    on: function(tmp) {
        // $(window).on('scroll', function() {
        window.addEventListener('scroll', function() {
            tmp.addItem();
        });
    },
    off: function() {
        // $(window).off('scroll');
        window.removeEventListener('scroll', null);
    }
};
//
var zoomEvent = {
    // scrollTop: 0,
    // on: function(e) {
    anime: function(e) {
        // this.scrollTop = $(document).scrollTop();
        // this.scrollTop = scrollTop();
        var x = e.pageX;
        var y = e.pageY - document.body.scrollTop;//scrollTop();// - this.scrollTop;
        // $('#zoom-container').css({top: y, left: x, width: '0', height: '0'});
        var zoom_container = document.getElementById('zoom-container');
        //
        // var anime = zoom_container.animate([
        //     {
        //         width: '0%',
        //         height: '0%',
        //         left: '' + x + 'px',
        //         top: '' + y + 'px'
        //     },
        //     {
        //         width: '100%',
        //         height: '100%',
        //         left: '0px',
        //         top: '0px'
        //     }
        // ], {
        //     fill: 'forwards',
        //     duration: 100
        // });
        // anime.pause();
        // zoom_container.style.display = '';
        // anime.onfinish = function() {
        //     fade.in(download, 250);
        // };
        // anime.play();
        var param = [
            {style: 'top', start: y, end: 0, unit: 'px'},
            {style: 'left', start: x, end: 0, unit: 'px'},
            {style: 'width', start: 0, end: 100, unit: '%'},
            {style: 'height', start: 0, end: 100, unit: '%'}
        ];
        new MyAnime(zoom_container, param, 100).then(function() {
            fade.in(download, 250);
        });
    }//,
    // off: function() {
    //     // $('html body').animate({scrollTop: this.scrollTop}, 1);
    // }
};
//
function createZoom(data, event) {
    var zoom_container = document.getElementById('zoom-container');
    // $('#zoom-container').find('.item-image')
    //     .html(data.data);
    zoom_container.getElementsByClassName('item-image')[0].innerHTML = data.data;
    // $('#zoom-container').find('.link')
    //     .html("<span>LINK</span><a href='//goo.gl/" + data.link + "' target='_blank'>" + data.title + "</a>");
    var link = zoom_container.getElementsByClassName('link')[0];
    link.innerHTML = '<span>LINK</span><a href="//goo.gl/' + data.link + '" target="_blank">' + data.title + '</a>';
    // $('#download').find('a')
    //     .attr({
    //         'href' : 'svg/' + data.url + '.svg',
    //         'download' : data.url + '.svg'
    //     });
    var a = document.getElementById('download').getElementsByTagName('a')[0];
    a.setAttribute('href', 'svg/' + data.url + '.svg');
    a.setAttribute('download', data.url + '.svg');
    var own = document.getElementById('own');
    if (data.own) {
        // $('#own').addClass('own');
        own.classList.add('own');
    } else {
        // $('#own').removeClass('own');
        own.classList.remove('own');
    }
    // $('#zoom-container').show().animate({
    //     left: "0",
    //     top: "0",
    //     width: '100%',
    //     height: '100%'
    // }, 100, function() {
    //     $('#download').fadeIn(250);
    // });
    zoomEvent.anime(event);
}

//
function start() {
    // var dfd = $.Deferred();
    // //
    // $('#menu .button').each(function(index) {
    //     $(this).on('click', function() {
    //         console.log('--click')
    //         //分割しないとコールバックを2回呼ぶバグが発生するので
    //         //$("#menu, h1").fadeOut(250, function() {...とは書けない
    //         $("h1").fadeOut(250);
    //         $("#menu").fadeOut(250, function() {
    //             $('h1').addClass('small').fadeIn(250);
    //             dfd.resolve();
    //             // globalData.start();
    //         });
    //     });
    // });
    // //
    // $("#loading").fadeOut(250, function(){
    //     $('#loading').remove();
    //     $("#menu").fadeIn(250);
    // });
    // return dfd.promise();
    var promise = new Promise(function(resolve) {
        //
        var menu = document.getElementById('menu');
        var button = menu.getElementsByClassName('button')[0];
        button.addEventListener('click', function() {
            var h1 = document.getElementsByTagName('h1')[0];
            fade.out(h1, 250);
            fade.out(menu, 250).then(function() {
                h1.classList.add('small');
                fade.in(h1, 250);
                resolve();
            });
        });
    });
    // fadeOut(loading, 250, false).onfinish(function() {
    //     loading.remove();
    //     fade(document.getElementById('menu', 250));
    // });
    var loading = document.getElementById('loading');
    // fade.out(loading, 250, function() {
    //     loading.remove();
    //     fade.in(document.getElementById('menu'), 250);
    // });
    fade.out(loading, 250).then(function() {
        loading.remove();
        fade.in(document.getElementById('menu'), 250);
    });
    //
    return promise;
}
//
// (function() {
//     $.getJSON("json/data.json", function(json) {
//         start().done(function() {
//             console.log(new Collection(json));
//         });
//     });
// })();

(function() {
    var request = new XMLHttpRequest();
    request.open('get', 'json/data.json', true);
    request.onload = function(event) {
        if (request.status >= 200 && request.status < 400) {
            //success
            var json = JSON.parse(request.responseText);
            // start().done(function() {
            //     console.log(new Collection(json));
            // });
            start().then(function() {
                console.log(new Collection(json));
            });
        }
    }
    request.send(null);
})();
//
var append = function(target, html) {
    target.insertAdjacentHTML('beforeend', html);
};

// https://github.com/oneuijs/You-Dont-Need-jQuery#promises
// Native
function getOffset (el) {
  const box = el.getBoundingClientRect();
  return {
    top: box.top + window.pageYOffset - document.documentElement.clientTop,
    left: box.left + window.pageXOffset - document.documentElement.clientLeft
  };
}
// Deferred way
function deferred() {
  var deferred = {};
  var promise = new Promise(function(resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  deferred.promise = function() {
    return promise;
  };
  return deferred;
}
//
// function scrollTop() {
//     return (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
// }