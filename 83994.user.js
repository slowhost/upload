// ==UserScript==
// @name			Miniblog Img Pop
// @namespace		http://userscripts.org/users/83994
// @description		微博浮图控件，鼠标移过小图弹出浮动大图的脚本
// @version			3.0
// @include			http://*qing.weibo.com/*
// @include			http://*weibo.com/*
// @include			http://*t.163.com/*
// @include			http://*t.sohu.com/*
// @include			http://*t.qq.com/*
// @include			http://*t.ifeng.com/*
// @include			http://*t.titan24.com/*
// @include			http://*t.people.com.cn/*
// @include			http://*tianya.cn/*
// @include			http://*diandian.com/*
// @include			http://*.digu.com/*
// @include			http://*qzone.qq.com/*
//
// ==/UserScript==

// @author		afc163
// @weibo		http://weibo.com/afc163
// @code		https://github.com/afc163/miniblogImgPop
// @blog		http://pianyou.me
// @date		2010.8.12
// @modified	2010.9.14
// @modified	2010.9.17	修改代码使其只多增加一个img标签，无论计算大图大小和显示大图都使用同一个img标签
// @modified	2010.9.20	imgHeight等于10px，表示图片层的上下边框大小之和，其图片尚未载入
// @modified	2010.10.14	1.扩展此功能至新浪微博，腾讯微博，搜狐微博，网易微博，人民微博，体坛微博，百度说吧等微博网站，并改名为miniblogImgPop;
//							2.改进代码使之适应ajax载入新微博时的情况，在网速过慢（10秒内未能载入新微博）的情况下会失效;
//							3.修改动画参数和代码结构以进一步优化代码性能;
//							4.不处理iframe中的微博页面以避免某些性能问题;
//							5.独立出miniblogsConfig，方便对大部分微博网站进行扩展。config格式如下：
//							{'微博域名':{
//								className:'feed_img',			//需要注册弹出事件的标签className
//								otherSrc:'dynamic-src',			//延迟载入时用于保存图片地址的额外标签，有的网站不需要此项
//								sFrag:'thumbnail',				//小图的图片地址中的特征段，用于替换
//								bFrag:'bmiddle',				//大图的图片地址中的特征段，用于替换
//								newFeedBtns:['feed_msg_new']	//导致ajax载入新微博的按钮id列表
//							}}.
// @modified	2010.10.15	增加cache存储上次的图片数据，用于提高效率和修复chrome下t.sohu.com的bug，但未能完全修复。。。
// @modified	2010.11.17	修改top!=this为top!=window，使之和spidemonkey兼容
// @modified	2010.11.17	增加对天涯微博的支持
// @modified	2010.12.06	1.增加对凤凰微博的支持
//							2.修改一个低网速下出现的图片载入错位的bug
// @modified	2010.12.16	1.根据增加了一个z键固定图片功能，按住z键后所有图片浮出和消失功能会失效，
//							  改进后看大图片时，只需要按住z键便可以上下滚动页面
// @modified	2011.1.6	修改了在腾讯微博和搜狐微博下，新feed载入时的init方式，改为每2.5秒绑定一次
// @modified	2011.5.16	修复了网易微博下的一个bug
// @modified	2011.6.22	1.增加了对新版新浪微群的支持
//							2.将图片宽度固定为450px
// @modified	2011.8.18	1.改进了轮询新feed的机制
// @modified	2011.9.9	1.新增了对新版新浪微博的支持，同时支持新旧双版
///							2.移除了对百度说吧的支持
// @modified	2011.9.30	大量重构和改动，效率更高，支持更多网站
//							1.增加对QQ空间、嘀咕网、点点网、新浪轻博的支持！
//							2.使用事件委托方法重构图片绑定事件，去除低效的轮询方法，根除不时丢失绑定的bug
//							3.缓存机制提高效率
//							4.去除对t.house.sina.com.cn和t.sina.com.cn的支持
//							5.修正因部分微博网站改动而无法正确运行的bug
// @modified	2011.10.11	修复一个新浪微博偶尔失去绑定的bug
// @modified	2011.11.17	1.修复一个在chrome下图片透明度为0时仍然遮盖网页的bug
//							2.修复在淘宝商城、京东商城等新浪企业微博下无效的问题
//							3.修正新浪微博切换到提到我的微博等页面后绑定失效的问题
// @modified	2012.03.02	1.修正chrome下图片定位不准的bug
//							2.提高图片的zIndex使其覆盖头部导航
//							3.超屏大图定位不居中，而是定位到可视范围顶部
//							4.优化部分代码，提高效率
// @modified	2012.03.03	1.使用new Image来获得图片高度，彻底修正chrome下图片定位不准的bug
//							2.使用GM_addStyle，优化图片边框样式
// @modified	2012.10.18	1.使用imgReady库来加载图片（http://www.planeart.cn/?p=1121），提高获取图片宽高的效率
//							2.优化Z键看大图的使用体验，现在按Z键会出现遮罩层，滚动看大图，放掉Z键后复原
//							3.优化图片的显示效果
//							4.修复t.163.com失效的问题
// @modified	2012.10.19	1.重大改动，优化看长图片的方式，不用点鼠标和键盘就能看大图。

(function() {

    // 各微博站点的feed配置
    var MIPConfig = {
        'qing.weibo.com':{
            feedSelector:'.imgZoomIn',
            sFrag		:'',
            bFrag		:''
        },
        'q.weibo.com':{
            feedSelector:'.bigcursor',
            sFrag		:'thumbnail',
            bFrag		:'large'
        },
        'weibo.com':{
            feedSelector:'.bigcursor',
            sFrag		:'thumbnail',
            bFrag		:'bmiddle'
        },
        't.sohu.com':{
            feedSelector:'.pic',
            sFrag		:['/f_','_1.jpg'],
            bFrag		:['/m_','_0.jpg']
        },
        't.163.com':{
            feedSelector:'.tweet-preview-pic',
            sFrag		:['w=140&h=140', '&gif=1'],
            bFrag		:['w=440', '&gif=0']
        },
        't.qq.com':{
            feedSelector:'.pic img',
            sFrag		:'/160',
            bFrag		:'/460'
        },
        't.titan24.com':{
            feedSelector:'.imgBig',
            sFrag		:'_thumbnail',
            bFrag		:'_middle'
        },
        't.people.com.cn':{
            feedSelector:'.miniImg',
            sFrag:'/s_',
            bFrag:'/b_'
        },
        't.ifeng.com':{
            feedSelector:'.zoom_in_image img',
            sFrag		:'/128x160_',
            bFrag		:'/520x0_'
        },
        'www.tianya.cn':{
            feedSelector:'.pic-zoomin',
            bigSrc		:'_middlepic',
            sFrag		:'small',
            bFrag		:'middle'
        },
        'diandian.com':{
            feedSelector:'.feed-img',
            bigSrc		:'imgsrc'
        },
        'digu.com':{
            feedSelector:'.picture',
            sFrag		:'_100x75',
            bFrag		:'_640x480'
        },
        'qzone.qq.com':{
            feedSelector:'.img_box a',
            sFrag		:'/160',
            bFrag		:'/460'	
        }
    };
 
    // 居中显示的图片对象
    var PopImg = {
        
        show: function(e) {
            this.allowMove = false;
            clearTimeout(this._hideTimer);
            var that = this;
            var smallImg = MiniblogImgPop.smallImg;
            var src = this._getBigImgsrc(smallImg);
            this.img.src = src;

            imgReady(src, function() {
                var pos = offset(smallImg);
                that.img.style.left = pos.x + (pos.width >= 200 ? pos.width+30 : 200) + 'px';
                that.img.style.opacity = 1;
                that.img.style.visibility = 'visible';
                that.img.style.marginTop = '-10px';
                PopBar.show(e);

                if (window.innerHeight > this.height) {
                    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                    that.img.style.top = (scrollTop + (window.innerHeight - this.height)/2) + 10 + 'px';
                    that.allowMove = false;
                }
                else {
                    that.allowMove = true;                    
                    that.move(e);
                }
            });
        },

        hide: function() {
            var that = this;
            this.img.style.opacity = 0;
            this.img.style.marginTop = '0px';
            this._hideTimer = setTimeout(function() {
                that.img.src = '';
                that.img.style.visibility = 'hidden';                
            }, 200);

            PopBar.hide();
            this.shown = false;
        },

        init: function() {
			var node = document.createElement('img');
			node.id = 'miniblogImgPop';
			document.body.appendChild(node);
            this.img = node;

            PopBar.init();
        },

        move: function(e) {
            if (!this.allowMove) {
                return;
            }
            PopBar.move(e);
            // 根据PopBar的位置算出大图的位置
            var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            this.img.style.top = (scrollTop - PopBar.top * PopBar.scale) + 10 + 'px';
        },

        _getBigImgsrc: function(obj) {
            var tempimgs, tempimg, imgsrc, i, l,
                sname = MiniblogImgPop.sitename,
                config = MiniblogImgPop.config;
            if(obj.tagName === 'IMG' || obj.tagName === 'img') {
                tempimg = obj;
            }
            else{
                tempimgs = obj.getElementsByTagName('IMG');
                if(tempimgs == null || tempimgs.length == 0) {
                    throw 'cant found the img node.';
                }
                else{
                    tempimg = tempimgs[0];
                }
            }

            //针对使用额外属性保存大图地址的网站
            if(config['bigSrc']) {
                return tempimg.getAttribute(config['bigSrc']);
            }

            //一般处理
            imgsrc = tempimg.getAttribute('src');
            //console.info(imgsrc);
            imgsrc = decodeURIComponent(imgsrc);
            if(typeof config['sFrag'] === 'object') {
                for(i=0, l=config['sFrag'].length; i<l; i++) {
                    imgsrc = imgsrc.replace(config['sFrag'][i],config['bFrag'][i]);
                }
            }
            else{
                imgsrc = imgsrc.replace(config['sFrag'],config['bFrag']);
            }
            return imgsrc;
        }

    };

    // 指示当前可视区域的Bar
    var PopBar = {
        show: function(e) {
            var smallImg = MiniblogImgPop.smallImg,
                bigImg = PopImg.img;

            this.sOffset = offset(smallImg);
            
            // 表示放大的倍数
            this.scale = (bigImg.height + 14) * 1.0 / this.sOffset.height;

            // 计算出bar的高度
            if (window.innerHeight < bigImg.height) {
                this.bar.style.height = parseInt(window.innerHeight / this.scale) + 'px';
            }
            else {
                this.bar.style.height = this.sOffset.height + 'px';            
            }

            // 计算bar的Top值可以允许的范围
            this.range = this.sOffset.height - this.bar.offsetHeight;            

            // 计算bar的位置
            this.bar.style.left = this.sOffset.x + this.sOffset.width + 'px';
            this.move(e);

            // 显示bar
            this.bar.style.opacity = 1;
        },

        // 主要是计算bar的top位置
        move: function(e) {
            // 计算鼠标相对于元素的位置
            var x = e.pageX - this.sOffset.x,
                y = e.pageY - this.sOffset.y;

            // 计算bar的top值
            var top = y - this.bar.offsetHeight/2;
            top = top < 0 ? 0 : top;
            top = top > this.range ? this.range : top;
            this.top = top;

            this.bar.style.top = top + this.sOffset.y + 'px';
        },

        hide: function() {
            this.bar.style.opacity = 0;
            this.bar.style.height = '0px';
        },

        init: function() {
        	var node = document.createElement('div');
			node.id = 'miniblogImgPop-bar';
			document.body.appendChild(node);
            this.bar = node;
        }
    };

    var MiniblogImgPop = {
        
        prepare: function() {
            this.sitename = this._getSiteName();
            this.config = MIPConfig[this.sitename];
        },

        addImgsEventListener: function() {
            var that = this;
            delegate(document.body, 'mouseover', function(e, node) {
                if (!that.zPressing) {
                    that.smallImg = node;
                    PopImg.show(e);
                }
            }, this.config['feedSelector']);
            delegate(document.body, 'mouseout', function() {
                if (!that.zPressing) {
                    PopImg.hide();
                }
            }, this.config['feedSelector']);
            delegate(document.body, 'mousemove', function(e) {
                if (!that.zPressing) {
                    PopImg.move(e);
                }
            }, this.config['feedSelector']);
        },

        addZListener: function() {
            var that = this;
            window.addEventListener('keydown', function(e) {
                if(e.keyCode === 90) {
                    that.zPressing = true;
                }
            }, false);
            window.addEventListener('keyup', function(e) {
                if(e.keyCode === 90) {
                    that.zPressing = false;
                    PopImg.hide();
                }
            }, false);
        },

        // 获得当前站点名
        _getSiteName: function() {
            var i, each;
            for(each in MIPConfig) {
                if(location.href.indexOf(each) != -1) {
                    return each;
                }
            }
            return '';
        },

        init: function() {
            // 初始化两个节点
            PopImg.init();
        	// 准备必要的数据
			this.prepare();
			// 绑定imgs hover事件
			this.addImgsEventListener();
			// 绑定按键z事件，使图片不会消失，方便看大图
			this.addZListener();
        }

    };

    // 启动
    MiniblogImgPop.init();


    // Helpers
    // ---

	function $(selector) {
        return document.querySelectorAll(selector);	
    }

    function offset(source) {
        var pt = {x:0,y:0,width:source.offsetWidth,height:source.offsetHeight};
        do {
            pt.x += source.offsetLeft;
            pt.y += source.offsetTop;
            source = source.offsetParent;
        } while (source);
        return pt;
    }

    function delegate(el, eventType, handler, selector) {
        el = el || document;
        el.addEventListener(eventType, function(e) {
            var node = getHandlerNode(e, selector, el);	
            node && handler.call(el, e, node);
        }, false);

		function getHandlerNode(e, selector, el) {
			//返回我们handler需要的参数
			var nodes;
			el = el || document;
			if (e && e.target && selector) {
                nodes = el.querySelectorAll(selector);
				for(i=0; i<nodes.length; i++) {
					if(e.target == nodes[i] || isInDomChain(e.target, nodes[i], el)) {
						return nodes[i];
					}
				}
				return false;
			}
		}

		function isInDomChain(target, parent, ancestor, maxDepth) {
			var ancestor = ancestor || null,
				maxDepth = maxDepth || 100;
			if (target == ancestor) {
				return false;
			}
			if (target == parent) {
				return true;
			}
			var i = 0;//防止过多嵌套
			while (target != ancestor && target != null && (i++ < maxDepth)) {
				target = target.parentNode;
				if (target == parent) {
					return true;
				}
			}
			return false;
		}
    }

    /**
     * 图片头数据加载就绪事件 - 更快获取图片尺寸
     * @version	2011.05.27
     * @author	TangBin
     * @see		http://www.planeart.cn/?p=1121
     * @param	{String}	图片路径
     * @param	{Function}	尺寸就绪
     * @param	{Function}	加载完毕 (可选)
     * @param	{Function}	加载错误 (可选)
     * @example imgReady('http://www.google.com.hk/intl/zh-CN/images/logo_cn.png', function () {
            alert('size ready: width=' + this.width + '; height=' + this.height);
        });
     */
    var imgReady = (function () {
        var list = [], intervalId = null,

        // 用来执行队列
        tick = function () {
            var i = 0;
            for (; i < list.length; i++) {
                list[i].end ? list.splice(i--, 1) : list[i]();
            };
            !list.length && stop();
        },

        // 停止所有定时器队列
        stop = function () {
            clearInterval(intervalId);
            intervalId = null;
        };

        return function (url, ready, load, error) {
            var onready, width, height, newWidth, newHeight,
                img = new Image();
            
            img.src = url;

            // 如果图片被缓存，则直接返回缓存数据
            if (img.complete) {
                ready.call(img);
                load && load.call(img);
                return;
            };
            
            width = img.width;
            height = img.height;
            
            // 加载错误后的事件
            img.onerror = function () {
                error && error.call(img);
                onready.end = true;
                img = img.onload = img.onerror = null;
            };
            
            // 图片尺寸就绪
            onready = function () {
                newWidth = img.width;
                newHeight = img.height;
                if (newWidth !== width || newHeight !== height ||
                    // 如果图片已经在其他地方加载可使用面积检测
                    newWidth * newHeight > 1024
                ) {
                    ready.call(img);
                    onready.end = true;
                };
            };
            onready();
            
            // 完全加载完毕的事件
            img.onload = function () {
                // onload在定时器时间差范围内可能比onready快
                // 这里进行检查并保证onready优先执行
                !onready.end && onready();
            
                load && load.call(img);
                
                // IE gif动画会循环执行onload，置空onload即可
                img = img.onload = img.onerror = null;
            };

            // 加入队列中定期执行
            if (!onready.end) {
                list.push(onready);
                // 无论何时只允许出现一个定时器，减少浏览器性能损耗
                if (intervalId === null) intervalId = setInterval(tick, 40);
            };
        };
    })();

    // 增加自定义样式
	GM_addStyle("\
		#miniblogImgPop {\
			box-shadow: 0 0 15px #222;\
			border: 7px solid rgba(255, 255, 255, 0.7);\
            border-radius: 2px;\
			z-index: 10001;\
            opacity: 0;\
            margin-top: 0;\
			position: absolute;\
            visibility: hidden;\
            transition: opacity 0.2s ease-out 0s, margin-top 0.2s ease-out 0s;\
            -webkit-transition: opacity 0.2s ease-out 0s, margin-top 0.2s ease-out 0s;\
		}\
	");

    // 增加自定义样式
	GM_addStyle("\
		#miniblogImgPop-bar {\
			border-right: 5px solid #e80;\
            border-radius: 7px;\
            width:0;\
			z-index: 999;\
            opacity: 0;\
			position: absolute;\
            transition: opacity 0.2s ease-out 0s, margin-top 0.2s ease-out 0s;\
            -webkit-transition: opacity 0.2s ease-out 0s, margin-top 0.2s ease-out 0s;\
		}\
	");

})();


