(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _zenscroll = require('./libs/zenscroll');

var _zenscroll2 = _interopRequireDefault(_zenscroll);

var _waypoints = require('./libs/waypoints');

var _waypoints2 = _interopRequireDefault(_waypoints);

var _photoswipe = require('./libs/photoswipe');

var _photoswipe2 = _interopRequireDefault(_photoswipe);

var _photoswipeUiDefault = require('./libs/photoswipe-ui-default');

var _photoswipeUiDefault2 = _interopRequireDefault(_photoswipeUiDefault);

var _primaryNav = require('./modules/primary-nav');

var _primaryNav2 = _interopRequireDefault(_primaryNav);

var _timelineLoading = require('./modules/timeline-loading');

var _timelineLoading2 = _interopRequireDefault(_timelineLoading);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _primaryNav2.default)();

// modules
// libraries

(0, _timelineLoading2.default)();

// Photoswipe
var initPhotoSwipeFromDOM = function initPhotoSwipeFromDOM(gallerySelector) {

    var parseThumbnailElements = function parseThumbnailElements(el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            el,
            childElements,
            thumbnailEl,
            size,
            item;

        for (var i = 0; i < numNodes; i++) {
            el = thumbElements[i];

            // include only element nodes
            if (el.nodeType !== 1) {
                continue;
            }

            childElements = el.children;

            size = el.getAttribute('data-size').split('x');

            // create slide object
            item = {
                src: el.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10),
                author: el.getAttribute('data-author')
            };

            item.el = el; // save link to element for getThumbBoundsFn

            if (childElements.length > 0) {
                item.msrc = childElements[0].getAttribute('src'); // thumbnail url
                if (childElements.length > 1) {
                    item.title = childElements[1].innerHTML; // caption (contents of figure)
                }
            }

            var mediumSrc = el.getAttribute('data-med');
            if (mediumSrc) {
                size = el.getAttribute('data-med-size').split('x');
                // "medium-sized" image
                item.m = {
                    src: mediumSrc,
                    w: parseInt(size[0], 10),
                    h: parseInt(size[1], 10)
                };
            }
            // original image
            item.o = {
                src: item.src,
                w: item.w,
                h: item.h
            };

            items.push(item);
        }

        return items;
    };

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && (fn(el) ? el : closest(el.parentNode, fn));
    };

    var onThumbnailsClick = function onThumbnailsClick(e) {
        debugger;
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;

        var eTarget = e.target || e.srcElement;

        var clickedListItem = closest(eTarget, function (el) {
            return el.tagName === 'A';
        });

        if (!clickedListItem) {
            return;
        }

        var clickedGallery = clickedListItem.parentNode;

        var childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;

        for (var i = 0; i < numChildNodes; i++) {
            if (childNodes[i].nodeType !== 1) {
                continue;
            }

            if (childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }

        if (index >= 0) {
            openPhotoSwipe(index, clickedGallery);
        }
        return false;
    };

    var photoswipeParseHash = function photoswipeParseHash() {
        var hash = window.location.hash.substring(1),
            params = {};

        if (hash.length < 5) {
            // pid=1
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if (!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if (pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }

        if (params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function openPhotoSwipe(index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = parseThumbnailElements(galleryElement);

        // define options (if needed)
        options = {

            galleryUID: galleryElement.getAttribute('data-pswp-uid'),

            getThumbBoundsFn: function getThumbBoundsFn(index) {
                // See Options->getThumbBoundsFn section of docs for more info
                var thumbnail = items[index].el.children[0],
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();

                return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
            },

            addCaptionHTMLFn: function addCaptionHTMLFn(item, captionEl, isFake) {
                if (!item.title) {
                    captionEl.children[0].innerText = '';
                    return false;
                }
                captionEl.children[0].innerHTML = item.title + '<br/><small>Photo: ' + item.author + '</small>';
                return true;
            }

        };

        if (fromURL) {
            if (options.galleryPIDs) {
                // parse real index when custom PIDs are used
                // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
                for (var j = 0; j < items.length; j++) {
                    if (items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if (isNaN(options.index)) {
            return;
        }

        if (disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new _photoswipe2.default(pswpElement, _photoswipeUiDefault2.default, items, options);

        // see: http://photoswipe.com/documentation/responsive-images.html
        var realViewportWidth,
            useLargeImages = false,
            firstResize = true,
            imageSrcWillChange;

        gallery.listen('beforeResize', function () {

            var dpiRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
            dpiRatio = Math.min(dpiRatio, 2.5);
            realViewportWidth = gallery.viewportSize.x * dpiRatio;

            if (realViewportWidth >= 1200 || !gallery.likelyTouchDevice && realViewportWidth > 800 || screen.width > 1200) {
                if (!useLargeImages) {
                    useLargeImages = true;
                    imageSrcWillChange = true;
                }
            } else {
                if (useLargeImages) {
                    useLargeImages = false;
                    imageSrcWillChange = true;
                }
            }

            if (imageSrcWillChange && !firstResize) {
                gallery.invalidateCurrItems();
            }

            if (firstResize) {
                firstResize = false;
            }

            imageSrcWillChange = false;
        });

        gallery.listen('gettingData', function (index, item) {
            if (useLargeImages) {
                item.src = item.o.src;
                item.w = item.o.w;
                item.h = item.o.h;
            } else {
                item.src = item.m.src;
                item.w = item.m.w;
                item.h = item.m.h;
            }
        });

        gallery.init();
    };

    // select all gallery elements
    var galleryElements = document.querySelectorAll(gallerySelector);
    for (var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i + 1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if (hashData.pid && hashData.gid) {
        openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
    }
};

initPhotoSwipeFromDOM('.gallery');

},{"./libs/photoswipe":3,"./libs/photoswipe-ui-default":2,"./libs/waypoints":4,"./libs/zenscroll":5,"./modules/primary-nav":6,"./modules/timeline-loading":7}],2:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! PhotoSwipe Default UI - 4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
/**
*
* UI on top of main sliding area (caption, arrows, close button, etc.).
* Built just using public methods/properties of PhotoSwipe.
*
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    module.exports = factory();
  } else {
    root.PhotoSwipeUI_Default = factory();
  }
})(undefined, function () {

  'use strict';

  var PhotoSwipeUI_Default = function PhotoSwipeUI_Default(pswp, framework) {

    var ui = this;
    var _overlayUIUpdated = false,
        _controlsVisible = true,
        _fullscrenAPI,
        _controls,
        _captionContainer,
        _fakeCaptionContainer,
        _indexIndicator,
        _shareButton,
        _shareModal,
        _shareModalHidden = true,
        _initalCloseOnScrollValue,
        _isIdle,
        _listen,
        _loadingIndicator,
        _loadingIndicatorHidden,
        _loadingIndicatorTimeout,
        _galleryHasOneSlide,
        _options,
        _defaultUIOptions = {
      barsSize: { top: 44, bottom: 'auto' },
      closeElClasses: ['item', 'caption', 'zoom-wrap', 'ui', 'top-bar'],
      timeToIdle: 4000,
      timeToIdleOutside: 1000,
      loadingIndicatorDelay: 1000, // 2s

      addCaptionHTMLFn: function addCaptionHTMLFn(item, captionEl /*, isFake */) {
        if (!item.title) {
          captionEl.children[0].innerHTML = '';
          return false;
        }
        captionEl.children[0].innerHTML = item.title;
        return true;
      },

      closeEl: true,
      captionEl: true,
      fullscreenEl: true,
      zoomEl: true,
      shareEl: true,
      counterEl: true,
      arrowEl: true,
      preloaderEl: true,

      tapToClose: false,
      tapToToggleControls: true,

      clickToCloseNonZoomable: true,

      shareButtons: [{ id: 'facebook', label: 'Share on Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={{url}}' }, { id: 'twitter', label: 'Tweet', url: 'https://twitter.com/intent/tweet?text={{text}}&url={{url}}' }, { id: 'download', label: 'Download image', url: '{{raw_image_url}}', download: true }],
      getImageURLForShare: function getImageURLForShare() /* shareButtonData */{
        return pswp.currItem.src || '';
      },
      getPageURLForShare: function getPageURLForShare() /* shareButtonData */{
        return window.location.href;
      },
      getTextForShare: function getTextForShare() /* shareButtonData */{
        return pswp.currItem.title || '';
      },

      indexIndicatorSep: ' / ',
      fitControlsWidth: 1200

    },
        _blockControlsTap,
        _blockControlsTapTimeout;

    var _onControlsTap = function _onControlsTap(e) {
      if (_blockControlsTap) {
        return true;
      }

      e = e || window.event;

      if (_options.timeToIdle && _options.mouseUsed && !_isIdle) {
        // reset idle timer
        _onIdleMouseMove();
      }

      var target = e.target || e.srcElement,
          uiElement,
          clickedClass = target.getAttribute('class') || '',
          found;

      for (var i = 0; i < _uiElements.length; i++) {
        uiElement = _uiElements[i];
        if (uiElement.onTap && clickedClass.indexOf('pswp__' + uiElement.name) > -1) {
          uiElement.onTap();
          found = true;
        }
      }

      if (found) {
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        _blockControlsTap = true;

        // Some versions of Android don't prevent ghost click event
        // when preventDefault() was called on touchstart and/or touchend.
        //
        // This happens on v4.3, 4.2, 4.1,
        // older versions strangely work correctly,
        // but just in case we add delay on all of them)
        var tapDelay = framework.features.isOldAndroid ? 600 : 30;
        _blockControlsTapTimeout = setTimeout(function () {
          _blockControlsTap = false;
        }, tapDelay);
      }
    },
        _fitControlsInViewport = function _fitControlsInViewport() {
      return !pswp.likelyTouchDevice || _options.mouseUsed || screen.width > _options.fitControlsWidth;
    },
        _togglePswpClass = function _togglePswpClass(el, cName, add) {
      framework[(add ? 'add' : 'remove') + 'Class'](el, 'pswp__' + cName);
    },


    // add class when there is just one item in the gallery
    // (by default it hides left/right arrows and 1ofX counter)
    _countNumItems = function _countNumItems() {
      var hasOneSlide = _options.getNumItemsFn() === 1;

      if (hasOneSlide !== _galleryHasOneSlide) {
        _togglePswpClass(_controls, 'ui--one-slide', hasOneSlide);
        _galleryHasOneSlide = hasOneSlide;
      }
    },
        _toggleShareModalClass = function _toggleShareModalClass() {
      _togglePswpClass(_shareModal, 'share-modal--hidden', _shareModalHidden);
    },
        _toggleShareModal = function _toggleShareModal() {

      _shareModalHidden = !_shareModalHidden;

      if (!_shareModalHidden) {
        _toggleShareModalClass();
        setTimeout(function () {
          if (!_shareModalHidden) {
            framework.addClass(_shareModal, 'pswp__share-modal--fade-in');
          }
        }, 30);
      } else {
        framework.removeClass(_shareModal, 'pswp__share-modal--fade-in');
        setTimeout(function () {
          if (_shareModalHidden) {
            _toggleShareModalClass();
          }
        }, 300);
      }

      if (!_shareModalHidden) {
        _updateShareURLs();
      }
      return false;
    },
        _openWindowPopup = function _openWindowPopup(e) {
      e = e || window.event;
      var target = e.target || e.srcElement;

      pswp.shout('shareLinkClick', e, target);

      if (!target.href) {
        return false;
      }

      if (target.hasAttribute('download')) {
        return true;
      }

      window.open(target.href, 'pswp_share', 'scrollbars=yes,resizable=yes,toolbar=no,' + 'location=yes,width=550,height=420,top=100,left=' + (window.screen ? Math.round(screen.width / 2 - 275) : 100));

      if (!_shareModalHidden) {
        _toggleShareModal();
      }

      return false;
    },
        _updateShareURLs = function _updateShareURLs() {
      var shareButtonOut = '',
          shareButtonData,
          shareURL,
          image_url,
          page_url,
          share_text;

      for (var i = 0; i < _options.shareButtons.length; i++) {
        shareButtonData = _options.shareButtons[i];

        image_url = _options.getImageURLForShare(shareButtonData);
        page_url = _options.getPageURLForShare(shareButtonData);
        share_text = _options.getTextForShare(shareButtonData);

        shareURL = shareButtonData.url.replace('{{url}}', encodeURIComponent(page_url)).replace('{{image_url}}', encodeURIComponent(image_url)).replace('{{raw_image_url}}', image_url).replace('{{text}}', encodeURIComponent(share_text));

        shareButtonOut += '<a href="' + shareURL + '" target="_blank" ' + 'class="pswp__share--' + shareButtonData.id + '"' + (shareButtonData.download ? 'download' : '') + '>' + shareButtonData.label + '</a>';

        if (_options.parseShareButtonOut) {
          shareButtonOut = _options.parseShareButtonOut(shareButtonData, shareButtonOut);
        }
      }
      _shareModal.children[0].innerHTML = shareButtonOut;
      _shareModal.children[0].onclick = _openWindowPopup;
    },
        _hasCloseClass = function _hasCloseClass(target) {
      for (var i = 0; i < _options.closeElClasses.length; i++) {
        if (framework.hasClass(target, 'pswp__' + _options.closeElClasses[i])) {
          return true;
        }
      }
    },
        _idleInterval,
        _idleTimer,
        _idleIncrement = 0,
        _onIdleMouseMove = function _onIdleMouseMove() {
      clearTimeout(_idleTimer);
      _idleIncrement = 0;
      if (_isIdle) {
        ui.setIdle(false);
      }
    },
        _onMouseLeaveWindow = function _onMouseLeaveWindow(e) {
      e = e ? e : window.event;
      var from = e.relatedTarget || e.toElement;
      if (!from || from.nodeName === 'HTML') {
        clearTimeout(_idleTimer);
        _idleTimer = setTimeout(function () {
          ui.setIdle(true);
        }, _options.timeToIdleOutside);
      }
    },
        _setupFullscreenAPI = function _setupFullscreenAPI() {
      if (_options.fullscreenEl && !framework.features.isOldAndroid) {
        if (!_fullscrenAPI) {
          _fullscrenAPI = ui.getFullscreenAPI();
        }
        if (_fullscrenAPI) {
          framework.bind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
          ui.updateFullscreen();
          framework.addClass(pswp.template, 'pswp--supports-fs');
        } else {
          framework.removeClass(pswp.template, 'pswp--supports-fs');
        }
      }
    },
        _setupLoadingIndicator = function _setupLoadingIndicator() {
      // Setup loading indicator
      if (_options.preloaderEl) {

        _toggleLoadingIndicator(true);

        _listen('beforeChange', function () {

          clearTimeout(_loadingIndicatorTimeout);

          // display loading indicator with delay
          _loadingIndicatorTimeout = setTimeout(function () {

            if (pswp.currItem && pswp.currItem.loading) {

              if (!pswp.allowProgressiveImg() || pswp.currItem.img && !pswp.currItem.img.naturalWidth) {
                // show preloader if progressive loading is not enabled,
                // or image width is not defined yet (because of slow connection)
                _toggleLoadingIndicator(false);
                // items-controller.js function allowProgressiveImg
              }
            } else {
              _toggleLoadingIndicator(true); // hide preloader
            }
          }, _options.loadingIndicatorDelay);
        });
        _listen('imageLoadComplete', function (index, item) {
          if (pswp.currItem === item) {
            _toggleLoadingIndicator(true);
          }
        });
      }
    },
        _toggleLoadingIndicator = function _toggleLoadingIndicator(hide) {
      if (_loadingIndicatorHidden !== hide) {
        _togglePswpClass(_loadingIndicator, 'preloader--active', !hide);
        _loadingIndicatorHidden = hide;
      }
    },
        _applyNavBarGaps = function _applyNavBarGaps(item) {
      var gap = item.vGap;

      if (_fitControlsInViewport()) {

        var bars = _options.barsSize;
        if (_options.captionEl && bars.bottom === 'auto') {
          if (!_fakeCaptionContainer) {
            _fakeCaptionContainer = framework.createEl('pswp__caption pswp__caption--fake');
            _fakeCaptionContainer.appendChild(framework.createEl('pswp__caption__center'));
            _controls.insertBefore(_fakeCaptionContainer, _captionContainer);
            framework.addClass(_controls, 'pswp__ui--fit');
          }
          if (_options.addCaptionHTMLFn(item, _fakeCaptionContainer, true)) {

            var captionSize = _fakeCaptionContainer.clientHeight;
            gap.bottom = parseInt(captionSize, 10) || 44;
          } else {
            gap.bottom = bars.top; // if no caption, set size of bottom gap to size of top
          }
        } else {
          gap.bottom = bars.bottom === 'auto' ? 0 : bars.bottom;
        }

        // height of top bar is static, no need to calculate it
        gap.top = bars.top;
      } else {
        gap.top = gap.bottom = 0;
      }
    },
        _setupIdle = function _setupIdle() {
      // Hide controls when mouse is used
      if (_options.timeToIdle) {
        _listen('mouseUsed', function () {

          framework.bind(document, 'mousemove', _onIdleMouseMove);
          framework.bind(document, 'mouseout', _onMouseLeaveWindow);

          _idleInterval = setInterval(function () {
            _idleIncrement++;
            if (_idleIncrement === 2) {
              ui.setIdle(true);
            }
          }, _options.timeToIdle / 2);
        });
      }
    },
        _setupHidingControlsDuringGestures = function _setupHidingControlsDuringGestures() {

      // Hide controls on vertical drag
      _listen('onVerticalDrag', function (now) {
        if (_controlsVisible && now < 0.95) {
          ui.hideControls();
        } else if (!_controlsVisible && now >= 0.95) {
          ui.showControls();
        }
      });

      // Hide controls when pinching to close
      var pinchControlsHidden;
      _listen('onPinchClose', function (now) {
        if (_controlsVisible && now < 0.9) {
          ui.hideControls();
          pinchControlsHidden = true;
        } else if (pinchControlsHidden && !_controlsVisible && now > 0.9) {
          ui.showControls();
        }
      });

      _listen('zoomGestureEnded', function () {
        pinchControlsHidden = false;
        if (pinchControlsHidden && !_controlsVisible) {
          ui.showControls();
        }
      });
    };

    var _uiElements = [{
      name: 'caption',
      option: 'captionEl',
      onInit: function onInit(el) {
        _captionContainer = el;
      }
    }, {
      name: 'share-modal',
      option: 'shareEl',
      onInit: function onInit(el) {
        _shareModal = el;
      },
      onTap: function onTap() {
        _toggleShareModal();
      }
    }, {
      name: 'button--share',
      option: 'shareEl',
      onInit: function onInit(el) {
        _shareButton = el;
      },
      onTap: function onTap() {
        _toggleShareModal();
      }
    }, {
      name: 'button--zoom',
      option: 'zoomEl',
      onTap: pswp.toggleDesktopZoom
    }, {
      name: 'counter',
      option: 'counterEl',
      onInit: function onInit(el) {
        _indexIndicator = el;
      }
    }, {
      name: 'button--close',
      option: 'closeEl',
      onTap: pswp.close
    }, {
      name: 'button--arrow--left',
      option: 'arrowEl',
      onTap: pswp.prev
    }, {
      name: 'button--arrow--right',
      option: 'arrowEl',
      onTap: pswp.next
    }, {
      name: 'button--fs',
      option: 'fullscreenEl',
      onTap: function onTap() {
        if (_fullscrenAPI.isFullscreen()) {
          _fullscrenAPI.exit();
        } else {
          _fullscrenAPI.enter();
        }
      }
    }, {
      name: 'preloader',
      option: 'preloaderEl',
      onInit: function onInit(el) {
        _loadingIndicator = el;
      }
    }];

    var _setupUIElements = function _setupUIElements() {
      var item, classAttr, uiElement;

      var loopThroughChildElements = function loopThroughChildElements(sChildren) {
        if (!sChildren) {
          return;
        }

        var l = sChildren.length;
        for (var i = 0; i < l; i++) {
          item = sChildren[i];
          classAttr = item.className;

          for (var a = 0; a < _uiElements.length; a++) {
            uiElement = _uiElements[a];

            if (classAttr.indexOf('pswp__' + uiElement.name) > -1) {

              if (_options[uiElement.option]) {
                // if element is not disabled from options

                framework.removeClass(item, 'pswp__element--disabled');
                if (uiElement.onInit) {
                  uiElement.onInit(item);
                }

                //item.style.display = 'block';
              } else {
                framework.addClass(item, 'pswp__element--disabled');
                //item.style.display = 'none';
              }
            }
          }
        }
      };
      loopThroughChildElements(_controls.children);

      var topBar = framework.getChildByClass(_controls, 'pswp__top-bar');
      if (topBar) {
        loopThroughChildElements(topBar.children);
      }
    };

    ui.init = function () {

      // extend options
      framework.extend(pswp.options, _defaultUIOptions, true);

      // create local link for fast access
      _options = pswp.options;

      // find pswp__ui element
      _controls = framework.getChildByClass(pswp.scrollWrap, 'pswp__ui');

      // create local link
      _listen = pswp.listen;

      _setupHidingControlsDuringGestures();

      // update controls when slides change
      _listen('beforeChange', ui.update);

      // toggle zoom on double-tap
      _listen('doubleTap', function (point) {
        var initialZoomLevel = pswp.currItem.initialZoomLevel;
        if (pswp.getZoomLevel() !== initialZoomLevel) {
          pswp.zoomTo(initialZoomLevel, point, 333);
        } else {
          pswp.zoomTo(_options.getDoubleTapZoom(false, pswp.currItem), point, 333);
        }
      });

      // Allow text selection in caption
      _listen('preventDragEvent', function (e, isDown, preventObj) {
        var t = e.target || e.srcElement;
        if (t && t.getAttribute('class') && e.type.indexOf('mouse') > -1 && (t.getAttribute('class').indexOf('__caption') > 0 || /(SMALL|STRONG|EM)/i.test(t.tagName))) {
          preventObj.prevent = false;
        }
      });

      // bind events for UI
      _listen('bindEvents', function () {
        framework.bind(_controls, 'pswpTap click', _onControlsTap);
        framework.bind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);

        if (!pswp.likelyTouchDevice) {
          framework.bind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);
        }
      });

      // unbind events for UI
      _listen('unbindEvents', function () {
        if (!_shareModalHidden) {
          _toggleShareModal();
        }

        if (_idleInterval) {
          clearInterval(_idleInterval);
        }
        framework.unbind(document, 'mouseout', _onMouseLeaveWindow);
        framework.unbind(document, 'mousemove', _onIdleMouseMove);
        framework.unbind(_controls, 'pswpTap click', _onControlsTap);
        framework.unbind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);
        framework.unbind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);

        if (_fullscrenAPI) {
          framework.unbind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
          if (_fullscrenAPI.isFullscreen()) {
            _options.hideAnimationDuration = 0;
            _fullscrenAPI.exit();
          }
          _fullscrenAPI = null;
        }
      });

      // clean up things when gallery is destroyed
      _listen('destroy', function () {
        if (_options.captionEl) {
          if (_fakeCaptionContainer) {
            _controls.removeChild(_fakeCaptionContainer);
          }
          framework.removeClass(_captionContainer, 'pswp__caption--empty');
        }

        if (_shareModal) {
          _shareModal.children[0].onclick = null;
        }
        framework.removeClass(_controls, 'pswp__ui--over-close');
        framework.addClass(_controls, 'pswp__ui--hidden');
        ui.setIdle(false);
      });

      if (!_options.showAnimationDuration) {
        framework.removeClass(_controls, 'pswp__ui--hidden');
      }
      _listen('initialZoomIn', function () {
        if (_options.showAnimationDuration) {
          framework.removeClass(_controls, 'pswp__ui--hidden');
        }
      });
      _listen('initialZoomOut', function () {
        framework.addClass(_controls, 'pswp__ui--hidden');
      });

      _listen('parseVerticalMargin', _applyNavBarGaps);

      _setupUIElements();

      if (_options.shareEl && _shareButton && _shareModal) {
        _shareModalHidden = true;
      }

      _countNumItems();

      _setupIdle();

      _setupFullscreenAPI();

      _setupLoadingIndicator();
    };

    ui.setIdle = function (isIdle) {
      _isIdle = isIdle;
      _togglePswpClass(_controls, 'ui--idle', isIdle);
    };

    ui.update = function () {
      // Don't update UI if it's hidden
      if (_controlsVisible && pswp.currItem) {

        ui.updateIndexIndicator();

        if (_options.captionEl) {
          _options.addCaptionHTMLFn(pswp.currItem, _captionContainer);

          _togglePswpClass(_captionContainer, 'caption--empty', !pswp.currItem.title);
        }

        _overlayUIUpdated = true;
      } else {
        _overlayUIUpdated = false;
      }

      if (!_shareModalHidden) {
        _toggleShareModal();
      }

      _countNumItems();
    };

    ui.updateFullscreen = function (e) {

      if (e) {
        // some browsers change window scroll position during the fullscreen
        // so PhotoSwipe updates it just in case
        setTimeout(function () {
          pswp.setScrollOffset(0, framework.getScrollY());
        }, 50);
      }

      // toogle pswp--fs class on root element
      framework[(_fullscrenAPI.isFullscreen() ? 'add' : 'remove') + 'Class'](pswp.template, 'pswp--fs');
    };

    ui.updateIndexIndicator = function () {
      if (_options.counterEl) {
        _indexIndicator.innerHTML = pswp.getCurrentIndex() + 1 + _options.indexIndicatorSep + _options.getNumItemsFn();
      }
    };

    ui.onGlobalTap = function (e) {
      e = e || window.event;
      var target = e.target || e.srcElement;

      if (_blockControlsTap) {
        return;
      }

      if (e.detail && e.detail.pointerType === 'mouse') {

        // close gallery if clicked outside of the image
        if (_hasCloseClass(target)) {
          pswp.close();
          return;
        }

        if (framework.hasClass(target, 'pswp__img')) {
          if (pswp.getZoomLevel() === 1 && pswp.getZoomLevel() <= pswp.currItem.fitRatio) {
            if (_options.clickToCloseNonZoomable) {
              pswp.close();
            }
          } else {
            pswp.toggleDesktopZoom(e.detail.releasePoint);
          }
        }
      } else {

        // tap anywhere (except buttons) to toggle visibility of controls
        if (_options.tapToToggleControls) {
          if (_controlsVisible) {
            ui.hideControls();
          } else {
            ui.showControls();
          }
        }

        // tap to close gallery
        if (_options.tapToClose && (framework.hasClass(target, 'pswp__img') || _hasCloseClass(target))) {
          pswp.close();
          return;
        }
      }
    };
    ui.onMouseOver = function (e) {
      e = e || window.event;
      var target = e.target || e.srcElement;

      // add class when mouse is over an element that should close the gallery
      _togglePswpClass(_controls, 'ui--over-close', _hasCloseClass(target));
    };

    ui.hideControls = function () {
      framework.addClass(_controls, 'pswp__ui--hidden');
      _controlsVisible = false;
    };

    ui.showControls = function () {
      _controlsVisible = true;
      if (!_overlayUIUpdated) {
        ui.update();
      }
      framework.removeClass(_controls, 'pswp__ui--hidden');
    };

    ui.supportsFullscreen = function () {
      var d = document;
      return !!(d.exitFullscreen || d.mozCancelFullScreen || d.webkitExitFullscreen || d.msExitFullscreen);
    };

    ui.getFullscreenAPI = function () {
      var dE = document.documentElement,
          api,
          tF = 'fullscreenchange';

      if (dE.requestFullscreen) {
        api = {
          enterK: 'requestFullscreen',
          exitK: 'exitFullscreen',
          elementK: 'fullscreenElement',
          eventK: tF
        };
      } else if (dE.mozRequestFullScreen) {
        api = {
          enterK: 'mozRequestFullScreen',
          exitK: 'mozCancelFullScreen',
          elementK: 'mozFullScreenElement',
          eventK: 'moz' + tF
        };
      } else if (dE.webkitRequestFullscreen) {
        api = {
          enterK: 'webkitRequestFullscreen',
          exitK: 'webkitExitFullscreen',
          elementK: 'webkitFullscreenElement',
          eventK: 'webkit' + tF
        };
      } else if (dE.msRequestFullscreen) {
        api = {
          enterK: 'msRequestFullscreen',
          exitK: 'msExitFullscreen',
          elementK: 'msFullscreenElement',
          eventK: 'MSFullscreenChange'
        };
      }

      if (api) {
        api.enter = function () {
          // disable close-on-scroll in fullscreen
          _initalCloseOnScrollValue = _options.closeOnScroll;
          _options.closeOnScroll = false;

          if (this.enterK === 'webkitRequestFullscreen') {
            pswp.template[this.enterK](Element.ALLOW_KEYBOARD_INPUT);
          } else {
            return pswp.template[this.enterK]();
          }
        };
        api.exit = function () {
          _options.closeOnScroll = _initalCloseOnScrollValue;

          return document[this.exitK]();
        };
        api.isFullscreen = function () {
          return document[this.elementK];
        };
      }

      return api;
    };
  };
  return PhotoSwipeUI_Default;
});

},{}],3:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*! PhotoSwipe - v4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		module.exports = factory();
	} else {
		root.PhotoSwipe = factory();
	}
})(undefined, function () {

	'use strict';

	var PhotoSwipe = function PhotoSwipe(template, UiClass, items, options) {

		/*>>framework-bridge*/
		/**
   *
   * Set of generic functions used by gallery.
   * 
   * You're free to modify anything here as long as functionality is kept.
   * 
   */
		var framework = {
			features: null,
			bind: function bind(target, type, listener, unbind) {
				var methodName = (unbind ? 'remove' : 'add') + 'EventListener';
				type = type.split(' ');
				for (var i = 0; i < type.length; i++) {
					if (type[i]) {
						target[methodName](type[i], listener, false);
					}
				}
			},
			isArray: function isArray(obj) {
				return obj instanceof Array;
			},
			createEl: function createEl(classes, tag) {
				var el = document.createElement(tag || 'div');
				if (classes) {
					el.className = classes;
				}
				return el;
			},
			getScrollY: function getScrollY() {
				var yOffset = window.pageYOffset;
				return yOffset !== undefined ? yOffset : document.documentElement.scrollTop;
			},
			unbind: function unbind(target, type, listener) {
				framework.bind(target, type, listener, true);
			},
			removeClass: function removeClass(el, className) {
				var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
				el.className = el.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			},
			addClass: function addClass(el, className) {
				if (!framework.hasClass(el, className)) {
					el.className += (el.className ? ' ' : '') + className;
				}
			},
			hasClass: function hasClass(el, className) {
				return el.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(el.className);
			},
			getChildByClass: function getChildByClass(parentEl, childClassName) {
				var node = parentEl.firstChild;
				while (node) {
					if (framework.hasClass(node, childClassName)) {
						return node;
					}
					node = node.nextSibling;
				}
			},
			arraySearch: function arraySearch(array, value, key) {
				var i = array.length;
				while (i--) {
					if (array[i][key] === value) {
						return i;
					}
				}
				return -1;
			},
			extend: function extend(o1, o2, preventOverwrite) {
				for (var prop in o2) {
					if (o2.hasOwnProperty(prop)) {
						if (preventOverwrite && o1.hasOwnProperty(prop)) {
							continue;
						}
						o1[prop] = o2[prop];
					}
				}
			},
			easing: {
				sine: {
					out: function out(k) {
						return Math.sin(k * (Math.PI / 2));
					},
					inOut: function inOut(k) {
						return -(Math.cos(Math.PI * k) - 1) / 2;
					}
				},
				cubic: {
					out: function out(k) {
						return --k * k * k + 1;
					}
					/*
     	elastic: {
     		out: function ( k ) {
     				var s, a = 0.1, p = 0.4;
     			if ( k === 0 ) return 0;
     			if ( k === 1 ) return 1;
     			if ( !a || a < 1 ) { a = 1; s = p / 4; }
     			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
     			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
     			},
     	},
     	back: {
     		out: function ( k ) {
     			var s = 1.70158;
     			return --k * k * ( ( s + 1 ) * k + s ) + 1;
     		}
     	}
     */
				} },

			/**
    * 
    * @return {object}
    * 
    * {
    *  raf : request animation frame function
    *  caf : cancel animation frame function
    *  transfrom : transform property key (with vendor), or null if not supported
    *  oldIE : IE8 or below
    * }
    * 
    */
			detectFeatures: function detectFeatures() {
				if (framework.features) {
					return framework.features;
				}
				var helperEl = framework.createEl(),
				    helperStyle = helperEl.style,
				    vendor = '',
				    features = {};

				// IE8 and below
				features.oldIE = document.all && !document.addEventListener;

				features.touch = 'ontouchstart' in window;

				if (window.requestAnimationFrame) {
					features.raf = window.requestAnimationFrame;
					features.caf = window.cancelAnimationFrame;
				}

				features.pointerEvent = navigator.pointerEnabled || navigator.msPointerEnabled;

				// fix false-positive detection of old Android in new IE
				// (IE11 ua string contains "Android 4.0")

				if (!features.pointerEvent) {

					var ua = navigator.userAgent;

					// Detect if device is iPhone or iPod and if it's older than iOS 8
					// http://stackoverflow.com/a/14223920
					// 
					// This detection is made because of buggy top/bottom toolbars
					// that don't trigger window.resize event.
					// For more info refer to _isFixedPosition variable in core.js

					if (/iP(hone|od)/.test(navigator.platform)) {
						var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
						if (v && v.length > 0) {
							v = parseInt(v[1], 10);
							if (v >= 1 && v < 8) {
								features.isOldIOSPhone = true;
							}
						}
					}

					// Detect old Android (before KitKat)
					// due to bugs related to position:fixed
					// http://stackoverflow.com/questions/7184573/pick-up-the-android-version-in-the-browser-by-javascript

					var match = ua.match(/Android\s([0-9\.]*)/);
					var androidversion = match ? match[1] : 0;
					androidversion = parseFloat(androidversion);
					if (androidversion >= 1) {
						if (androidversion < 4.4) {
							features.isOldAndroid = true; // for fixed position bug & performance
						}
						features.androidVersion = androidversion; // for touchend bug
					}
					features.isMobileOpera = /opera mini|opera mobi/i.test(ua);

					// p.s. yes, yes, UA sniffing is bad, propose your solution for above bugs.
				}

				var styleChecks = ['transform', 'perspective', 'animationName'],
				    vendors = ['', 'webkit', 'Moz', 'ms', 'O'],
				    styleCheckItem,
				    styleName;

				for (var i = 0; i < 4; i++) {
					vendor = vendors[i];

					for (var a = 0; a < 3; a++) {
						styleCheckItem = styleChecks[a];

						// uppercase first letter of property name, if vendor is present
						styleName = vendor + (vendor ? styleCheckItem.charAt(0).toUpperCase() + styleCheckItem.slice(1) : styleCheckItem);

						if (!features[styleCheckItem] && styleName in helperStyle) {
							features[styleCheckItem] = styleName;
						}
					}

					if (vendor && !features.raf) {
						vendor = vendor.toLowerCase();
						features.raf = window[vendor + 'RequestAnimationFrame'];
						if (features.raf) {
							features.caf = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
						}
					}
				}

				if (!features.raf) {
					var lastTime = 0;
					features.raf = function (fn) {
						var currTime = new Date().getTime();
						var timeToCall = Math.max(0, 16 - (currTime - lastTime));
						var id = window.setTimeout(function () {
							fn(currTime + timeToCall);
						}, timeToCall);
						lastTime = currTime + timeToCall;
						return id;
					};
					features.caf = function (id) {
						clearTimeout(id);
					};
				}

				// Detect SVG support
				features.svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

				framework.features = features;

				return features;
			}
		};

		framework.detectFeatures();

		// Override addEventListener for old versions of IE
		if (framework.features.oldIE) {

			framework.bind = function (target, type, listener, unbind) {

				type = type.split(' ');

				var methodName = (unbind ? 'detach' : 'attach') + 'Event',
				    evName,
				    _handleEv = function _handleEv() {
					listener.handleEvent.call(listener);
				};

				for (var i = 0; i < type.length; i++) {
					evName = type[i];
					if (evName) {

						if ((typeof listener === 'undefined' ? 'undefined' : _typeof(listener)) === 'object' && listener.handleEvent) {
							if (!unbind) {
								listener['oldIE' + evName] = _handleEv;
							} else {
								if (!listener['oldIE' + evName]) {
									return false;
								}
							}

							target[methodName]('on' + evName, listener['oldIE' + evName]);
						} else {
							target[methodName]('on' + evName, listener);
						}
					}
				}
			};
		}

		/*>>framework-bridge*/

		/*>>core*/
		//function(template, UiClass, items, options)

		var self = this;

		/**
   * Static vars, don't change unless you know what you're doing.
   */
		var DOUBLE_TAP_RADIUS = 25,
		    NUM_HOLDERS = 3;

		/**
   * Options
   */
		var _options = {
			allowPanToNext: true,
			spacing: 0.12,
			bgOpacity: 1,
			mouseUsed: false,
			loop: true,
			pinchToClose: true,
			closeOnScroll: true,
			closeOnVerticalDrag: true,
			verticalDragRange: 0.75,
			hideAnimationDuration: 333,
			showAnimationDuration: 333,
			showHideOpacity: false,
			focus: true,
			escKey: true,
			arrowKeys: true,
			mainScrollEndFriction: 0.35,
			panEndFriction: 0.35,
			isClickableElement: function isClickableElement(el) {
				return el.tagName === 'A';
			},
			getDoubleTapZoom: function getDoubleTapZoom(isMouseClick, item) {
				if (isMouseClick) {
					return 1;
				} else {
					return item.initialZoomLevel < 0.7 ? 1 : 1.33;
				}
			},
			maxSpreadZoom: 1.33,
			modal: true,

			// not fully implemented yet
			scaleMode: 'fit' // TODO
		};
		framework.extend(_options, options);

		/**
   * Private helper variables & functions
   */

		var _getEmptyPoint = function _getEmptyPoint() {
			return { x: 0, y: 0 };
		};

		var _isOpen,
		    _isDestroying,
		    _closedByScroll,
		    _currentItemIndex,
		    _containerStyle,
		    _containerShiftIndex,
		    _currPanDist = _getEmptyPoint(),
		    _startPanOffset = _getEmptyPoint(),
		    _panOffset = _getEmptyPoint(),
		    _upMoveEvents,
		    // drag move, drag end & drag cancel events array
		_downEvents,
		    // drag start events array
		_globalEventHandlers,
		    _viewportSize = {},
		    _currZoomLevel,
		    _startZoomLevel,
		    _translatePrefix,
		    _translateSufix,
		    _updateSizeInterval,
		    _itemsNeedUpdate,
		    _currPositionIndex = 0,
		    _offset = {},
		    _slideSize = _getEmptyPoint(),
		    // size of slide area, including spacing
		_itemHolders,
		    _prevItemIndex,
		    _indexDiff = 0,
		    // difference of indexes since last content update
		_dragStartEvent,
		    _dragMoveEvent,
		    _dragEndEvent,
		    _dragCancelEvent,
		    _transformKey,
		    _pointerEventEnabled,
		    _isFixedPosition = true,
		    _likelyTouchDevice,
		    _modules = [],
		    _requestAF,
		    _cancelAF,
		    _initalClassName,
		    _initalWindowScrollY,
		    _oldIE,
		    _currentWindowScrollY,
		    _features,
		    _windowVisibleSize = {},
		    _renderMaxResolution = false,


		// Registers PhotoSWipe module (History, Controller ...)
		_registerModule = function _registerModule(name, module) {
			framework.extend(self, module.publicMethods);
			_modules.push(name);
		},
		    _getLoopedId = function _getLoopedId(index) {
			var numSlides = _getNumItems();
			if (index > numSlides - 1) {
				return index - numSlides;
			} else if (index < 0) {
				return numSlides + index;
			}
			return index;
		},


		// Micro bind/trigger
		_listeners = {},
		    _listen = function _listen(name, fn) {
			if (!_listeners[name]) {
				_listeners[name] = [];
			}
			return _listeners[name].push(fn);
		},
		    _shout = function _shout(name) {
			var listeners = _listeners[name];

			if (listeners) {
				var args = Array.prototype.slice.call(arguments);
				args.shift();

				for (var i = 0; i < listeners.length; i++) {
					listeners[i].apply(self, args);
				}
			}
		},
		    _getCurrentTime = function _getCurrentTime() {
			return new Date().getTime();
		},
		    _applyBgOpacity = function _applyBgOpacity(opacity) {
			_bgOpacity = opacity;
			self.bg.style.opacity = opacity * _options.bgOpacity;
		},
		    _applyZoomTransform = function _applyZoomTransform(styleObj, x, y, zoom, item) {
			if (!_renderMaxResolution || item && item !== self.currItem) {
				zoom = zoom / (item ? item.fitRatio : self.currItem.fitRatio);
			}

			styleObj[_transformKey] = _translatePrefix + x + 'px, ' + y + 'px' + _translateSufix + ' scale(' + zoom + ')';
		},
		    _applyCurrentZoomPan = function _applyCurrentZoomPan(allowRenderResolution) {
			if (_currZoomElementStyle) {

				if (allowRenderResolution) {
					if (_currZoomLevel > self.currItem.fitRatio) {
						if (!_renderMaxResolution) {
							_setImageSize(self.currItem, false, true);
							_renderMaxResolution = true;
						}
					} else {
						if (_renderMaxResolution) {
							_setImageSize(self.currItem);
							_renderMaxResolution = false;
						}
					}
				}

				_applyZoomTransform(_currZoomElementStyle, _panOffset.x, _panOffset.y, _currZoomLevel);
			}
		},
		    _applyZoomPanToItem = function _applyZoomPanToItem(item) {
			if (item.container) {

				_applyZoomTransform(item.container.style, item.initialPosition.x, item.initialPosition.y, item.initialZoomLevel, item);
			}
		},
		    _setTranslateX = function _setTranslateX(x, elStyle) {
			elStyle[_transformKey] = _translatePrefix + x + 'px, 0px' + _translateSufix;
		},
		    _moveMainScroll = function _moveMainScroll(x, dragging) {

			if (!_options.loop && dragging) {
				var newSlideIndexOffset = _currentItemIndex + (_slideSize.x * _currPositionIndex - x) / _slideSize.x,
				    delta = Math.round(x - _mainScrollPos.x);

				if (newSlideIndexOffset < 0 && delta > 0 || newSlideIndexOffset >= _getNumItems() - 1 && delta < 0) {
					x = _mainScrollPos.x + delta * _options.mainScrollEndFriction;
				}
			}

			_mainScrollPos.x = x;
			_setTranslateX(x, _containerStyle);
		},
		    _calculatePanOffset = function _calculatePanOffset(axis, zoomLevel) {
			var m = _midZoomPoint[axis] - _offset[axis];
			return _startPanOffset[axis] + _currPanDist[axis] + m - m * (zoomLevel / _startZoomLevel);
		},
		    _equalizePoints = function _equalizePoints(p1, p2) {
			p1.x = p2.x;
			p1.y = p2.y;
			if (p2.id) {
				p1.id = p2.id;
			}
		},
		    _roundPoint = function _roundPoint(p) {
			p.x = Math.round(p.x);
			p.y = Math.round(p.y);
		},
		    _mouseMoveTimeout = null,
		    _onFirstMouseMove = function _onFirstMouseMove() {
			// Wait until mouse move event is fired at least twice during 100ms
			// We do this, because some mobile browsers trigger it on touchstart
			if (_mouseMoveTimeout) {
				framework.unbind(document, 'mousemove', _onFirstMouseMove);
				framework.addClass(template, 'pswp--has_mouse');
				_options.mouseUsed = true;
				_shout('mouseUsed');
			}
			_mouseMoveTimeout = setTimeout(function () {
				_mouseMoveTimeout = null;
			}, 100);
		},
		    _bindEvents = function _bindEvents() {
			framework.bind(document, 'keydown', self);

			if (_features.transform) {
				// don't bind click event in browsers that don't support transform (mostly IE8)
				framework.bind(self.scrollWrap, 'click', self);
			}

			if (!_options.mouseUsed) {
				framework.bind(document, 'mousemove', _onFirstMouseMove);
			}

			framework.bind(window, 'resize scroll', self);

			_shout('bindEvents');
		},
		    _unbindEvents = function _unbindEvents() {
			framework.unbind(window, 'resize', self);
			framework.unbind(window, 'scroll', _globalEventHandlers.scroll);
			framework.unbind(document, 'keydown', self);
			framework.unbind(document, 'mousemove', _onFirstMouseMove);

			if (_features.transform) {
				framework.unbind(self.scrollWrap, 'click', self);
			}

			if (_isDragging) {
				framework.unbind(window, _upMoveEvents, self);
			}

			_shout('unbindEvents');
		},
		    _calculatePanBounds = function _calculatePanBounds(zoomLevel, update) {
			var bounds = _calculateItemSize(self.currItem, _viewportSize, zoomLevel);
			if (update) {
				_currPanBounds = bounds;
			}
			return bounds;
		},
		    _getMinZoomLevel = function _getMinZoomLevel(item) {
			if (!item) {
				item = self.currItem;
			}
			return item.initialZoomLevel;
		},
		    _getMaxZoomLevel = function _getMaxZoomLevel(item) {
			if (!item) {
				item = self.currItem;
			}
			return item.w > 0 ? _options.maxSpreadZoom : 1;
		},


		// Return true if offset is out of the bounds
		_modifyDestPanOffset = function _modifyDestPanOffset(axis, destPanBounds, destPanOffset, destZoomLevel) {
			if (destZoomLevel === self.currItem.initialZoomLevel) {
				destPanOffset[axis] = self.currItem.initialPosition[axis];
				return true;
			} else {
				destPanOffset[axis] = _calculatePanOffset(axis, destZoomLevel);

				if (destPanOffset[axis] > destPanBounds.min[axis]) {
					destPanOffset[axis] = destPanBounds.min[axis];
					return true;
				} else if (destPanOffset[axis] < destPanBounds.max[axis]) {
					destPanOffset[axis] = destPanBounds.max[axis];
					return true;
				}
			}
			return false;
		},
		    _setupTransforms = function _setupTransforms() {

			if (_transformKey) {
				// setup 3d transforms
				var allow3dTransform = _features.perspective && !_likelyTouchDevice;
				_translatePrefix = 'translate' + (allow3dTransform ? '3d(' : '(');
				_translateSufix = _features.perspective ? ', 0px)' : ')';
				return;
			}

			// Override zoom/pan/move functions in case old browser is used (most likely IE)
			// (so they use left/top/width/height, instead of CSS transform)

			_transformKey = 'left';
			framework.addClass(template, 'pswp--ie');

			_setTranslateX = function _setTranslateX(x, elStyle) {
				elStyle.left = x + 'px';
			};
			_applyZoomPanToItem = function _applyZoomPanToItem(item) {

				var zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
				    s = item.container.style,
				    w = zoomRatio * item.w,
				    h = zoomRatio * item.h;

				s.width = w + 'px';
				s.height = h + 'px';
				s.left = item.initialPosition.x + 'px';
				s.top = item.initialPosition.y + 'px';
			};
			_applyCurrentZoomPan = function _applyCurrentZoomPan() {
				if (_currZoomElementStyle) {

					var s = _currZoomElementStyle,
					    item = self.currItem,
					    zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
					    w = zoomRatio * item.w,
					    h = zoomRatio * item.h;

					s.width = w + 'px';
					s.height = h + 'px';

					s.left = _panOffset.x + 'px';
					s.top = _panOffset.y + 'px';
				}
			};
		},
		    _onKeyDown = function _onKeyDown(e) {
			var keydownAction = '';
			if (_options.escKey && e.keyCode === 27) {
				keydownAction = 'close';
			} else if (_options.arrowKeys) {
				if (e.keyCode === 37) {
					keydownAction = 'prev';
				} else if (e.keyCode === 39) {
					keydownAction = 'next';
				}
			}

			if (keydownAction) {
				// don't do anything if special key pressed to prevent from overriding default browser actions
				// e.g. in Chrome on Mac cmd+arrow-left returns to previous page
				if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					self[keydownAction]();
				}
			}
		},
		    _onGlobalClick = function _onGlobalClick(e) {
			if (!e) {
				return;
			}

			// don't allow click event to pass through when triggering after drag or some other gesture
			if (_moved || _zoomStarted || _mainScrollAnimating || _verticalDragInitiated) {
				e.preventDefault();
				e.stopPropagation();
			}
		},
		    _updatePageScrollOffset = function _updatePageScrollOffset() {
			self.setScrollOffset(0, framework.getScrollY());
		};

		// Micro animation engine
		var _animations = {},
		    _numAnimations = 0,
		    _stopAnimation = function _stopAnimation(name) {
			if (_animations[name]) {
				if (_animations[name].raf) {
					_cancelAF(_animations[name].raf);
				}
				_numAnimations--;
				delete _animations[name];
			}
		},
		    _registerStartAnimation = function _registerStartAnimation(name) {
			if (_animations[name]) {
				_stopAnimation(name);
			}
			if (!_animations[name]) {
				_numAnimations++;
				_animations[name] = {};
			}
		},
		    _stopAllAnimations = function _stopAllAnimations() {
			for (var prop in _animations) {

				if (_animations.hasOwnProperty(prop)) {
					_stopAnimation(prop);
				}
			}
		},
		    _animateProp = function _animateProp(name, b, endProp, d, easingFn, onUpdate, onComplete) {
			var startAnimTime = _getCurrentTime(),
			    t;
			_registerStartAnimation(name);

			var animloop = function animloop() {
				if (_animations[name]) {

					t = _getCurrentTime() - startAnimTime; // time diff
					//b - beginning (start prop)
					//d - anim duration

					if (t >= d) {
						_stopAnimation(name);
						onUpdate(endProp);
						if (onComplete) {
							onComplete();
						}
						return;
					}
					onUpdate((endProp - b) * easingFn(t / d) + b);

					_animations[name].raf = _requestAF(animloop);
				}
			};
			animloop();
		};

		var publicMethods = {

			// make a few local variables and functions public
			shout: _shout,
			listen: _listen,
			viewportSize: _viewportSize,
			options: _options,

			isMainScrollAnimating: function isMainScrollAnimating() {
				return _mainScrollAnimating;
			},
			getZoomLevel: function getZoomLevel() {
				return _currZoomLevel;
			},
			getCurrentIndex: function getCurrentIndex() {
				return _currentItemIndex;
			},
			isDragging: function isDragging() {
				return _isDragging;
			},
			isZooming: function isZooming() {
				return _isZooming;
			},
			setScrollOffset: function setScrollOffset(x, y) {
				_offset.x = x;
				_currentWindowScrollY = _offset.y = y;
				_shout('updateScrollOffset', _offset);
			},
			applyZoomPan: function applyZoomPan(zoomLevel, panX, panY, allowRenderResolution) {
				_panOffset.x = panX;
				_panOffset.y = panY;
				_currZoomLevel = zoomLevel;
				_applyCurrentZoomPan(allowRenderResolution);
			},

			init: function init() {

				if (_isOpen || _isDestroying) {
					return;
				}

				var i;

				self.framework = framework; // basic functionality
				self.template = template; // root DOM element of PhotoSwipe
				self.bg = framework.getChildByClass(template, 'pswp__bg');

				_initalClassName = template.className;
				_isOpen = true;

				_features = framework.detectFeatures();
				_requestAF = _features.raf;
				_cancelAF = _features.caf;
				_transformKey = _features.transform;
				_oldIE = _features.oldIE;

				self.scrollWrap = framework.getChildByClass(template, 'pswp__scroll-wrap');
				self.container = framework.getChildByClass(self.scrollWrap, 'pswp__container');

				_containerStyle = self.container.style; // for fast access

				// Objects that hold slides (there are only 3 in DOM)
				self.itemHolders = _itemHolders = [{ el: self.container.children[0], wrap: 0, index: -1 }, { el: self.container.children[1], wrap: 0, index: -1 }, { el: self.container.children[2], wrap: 0, index: -1 }];

				// hide nearby item holders until initial zoom animation finishes (to avoid extra Paints)
				_itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'none';

				_setupTransforms();

				// Setup global events
				_globalEventHandlers = {
					resize: self.updateSize,
					scroll: _updatePageScrollOffset,
					keydown: _onKeyDown,
					click: _onGlobalClick
				};

				// disable show/hide effects on old browsers that don't support CSS animations or transforms, 
				// old IOS, Android and Opera mobile. Blackberry seems to work fine, even older models.
				var oldPhone = _features.isOldIOSPhone || _features.isOldAndroid || _features.isMobileOpera;
				if (!_features.animationName || !_features.transform || oldPhone) {
					_options.showAnimationDuration = _options.hideAnimationDuration = 0;
				}

				// init modules
				for (i = 0; i < _modules.length; i++) {
					self['init' + _modules[i]]();
				}

				// init
				if (UiClass) {
					var ui = self.ui = new UiClass(self, framework);
					ui.init();
				}

				_shout('firstUpdate');
				_currentItemIndex = _currentItemIndex || _options.index || 0;
				// validate index
				if (isNaN(_currentItemIndex) || _currentItemIndex < 0 || _currentItemIndex >= _getNumItems()) {
					_currentItemIndex = 0;
				}
				self.currItem = _getItemAt(_currentItemIndex);

				if (_features.isOldIOSPhone || _features.isOldAndroid) {
					_isFixedPosition = false;
				}

				template.setAttribute('aria-hidden', 'false');
				if (_options.modal) {
					if (!_isFixedPosition) {
						template.style.position = 'absolute';
						template.style.top = framework.getScrollY() + 'px';
					} else {
						template.style.position = 'fixed';
					}
				}

				if (_currentWindowScrollY === undefined) {
					_shout('initialLayout');
					_currentWindowScrollY = _initalWindowScrollY = framework.getScrollY();
				}

				// add classes to root element of PhotoSwipe
				var rootClasses = 'pswp--open ';
				if (_options.mainClass) {
					rootClasses += _options.mainClass + ' ';
				}
				if (_options.showHideOpacity) {
					rootClasses += 'pswp--animate_opacity ';
				}
				rootClasses += _likelyTouchDevice ? 'pswp--touch' : 'pswp--notouch';
				rootClasses += _features.animationName ? ' pswp--css_animation' : '';
				rootClasses += _features.svg ? ' pswp--svg' : '';
				framework.addClass(template, rootClasses);

				self.updateSize();

				// initial update
				_containerShiftIndex = -1;
				_indexDiff = null;
				for (i = 0; i < NUM_HOLDERS; i++) {
					_setTranslateX((i + _containerShiftIndex) * _slideSize.x, _itemHolders[i].el.style);
				}

				if (!_oldIE) {
					framework.bind(self.scrollWrap, _downEvents, self); // no dragging for old IE
				}

				_listen('initialZoomInEnd', function () {
					self.setContent(_itemHolders[0], _currentItemIndex - 1);
					self.setContent(_itemHolders[2], _currentItemIndex + 1);

					_itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'block';

					if (_options.focus) {
						// focus causes layout, 
						// which causes lag during the animation, 
						// that's why we delay it untill the initial zoom transition ends
						template.focus();
					}

					_bindEvents();
				});

				// set content for center slide (first time)
				self.setContent(_itemHolders[1], _currentItemIndex);

				self.updateCurrItem();

				_shout('afterInit');

				if (!_isFixedPosition) {

					// On all versions of iOS lower than 8.0, we check size of viewport every second.
					// 
					// This is done to detect when Safari top & bottom bars appear, 
					// as this action doesn't trigger any events (like resize). 
					// 
					// On iOS8 they fixed this.
					// 
					// 10 Nov 2014: iOS 7 usage ~40%. iOS 8 usage 56%.

					_updateSizeInterval = setInterval(function () {
						if (!_numAnimations && !_isDragging && !_isZooming && _currZoomLevel === self.currItem.initialZoomLevel) {
							self.updateSize();
						}
					}, 1000);
				}

				framework.addClass(template, 'pswp--visible');
			},

			// Close the gallery, then destroy it
			close: function close() {
				if (!_isOpen) {
					return;
				}

				_isOpen = false;
				_isDestroying = true;
				_shout('close');
				_unbindEvents();

				_showOrHide(self.currItem, null, true, self.destroy);
			},

			// destroys the gallery (unbinds events, cleans up intervals and timeouts to avoid memory leaks)
			destroy: function destroy() {
				_shout('destroy');

				if (_showOrHideTimeout) {
					clearTimeout(_showOrHideTimeout);
				}

				template.setAttribute('aria-hidden', 'true');
				template.className = _initalClassName;

				if (_updateSizeInterval) {
					clearInterval(_updateSizeInterval);
				}

				framework.unbind(self.scrollWrap, _downEvents, self);

				// we unbind scroll event at the end, as closing animation may depend on it
				framework.unbind(window, 'scroll', self);

				_stopDragUpdateLoop();

				_stopAllAnimations();

				_listeners = null;
			},

			/**
    * Pan image to position
    * @param {Number} x     
    * @param {Number} y     
    * @param {Boolean} force Will ignore bounds if set to true.
    */
			panTo: function panTo(x, y, force) {
				if (!force) {
					if (x > _currPanBounds.min.x) {
						x = _currPanBounds.min.x;
					} else if (x < _currPanBounds.max.x) {
						x = _currPanBounds.max.x;
					}

					if (y > _currPanBounds.min.y) {
						y = _currPanBounds.min.y;
					} else if (y < _currPanBounds.max.y) {
						y = _currPanBounds.max.y;
					}
				}

				_panOffset.x = x;
				_panOffset.y = y;
				_applyCurrentZoomPan();
			},

			handleEvent: function handleEvent(e) {
				e = e || window.event;
				if (_globalEventHandlers[e.type]) {
					_globalEventHandlers[e.type](e);
				}
			},

			goTo: function goTo(index) {

				index = _getLoopedId(index);

				var diff = index - _currentItemIndex;
				_indexDiff = diff;

				_currentItemIndex = index;
				self.currItem = _getItemAt(_currentItemIndex);
				_currPositionIndex -= diff;

				_moveMainScroll(_slideSize.x * _currPositionIndex);

				_stopAllAnimations();
				_mainScrollAnimating = false;

				self.updateCurrItem();
			},
			next: function next() {
				self.goTo(_currentItemIndex + 1);
			},
			prev: function prev() {
				self.goTo(_currentItemIndex - 1);
			},

			// update current zoom/pan objects
			updateCurrZoomItem: function updateCurrZoomItem(emulateSetContent) {
				if (emulateSetContent) {
					_shout('beforeChange', 0);
				}

				// itemHolder[1] is middle (current) item
				if (_itemHolders[1].el.children.length) {
					var zoomElement = _itemHolders[1].el.children[0];
					if (framework.hasClass(zoomElement, 'pswp__zoom-wrap')) {
						_currZoomElementStyle = zoomElement.style;
					} else {
						_currZoomElementStyle = null;
					}
				} else {
					_currZoomElementStyle = null;
				}

				_currPanBounds = self.currItem.bounds;
				_startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;

				_panOffset.x = _currPanBounds.center.x;
				_panOffset.y = _currPanBounds.center.y;

				if (emulateSetContent) {
					_shout('afterChange');
				}
			},

			invalidateCurrItems: function invalidateCurrItems() {
				_itemsNeedUpdate = true;
				for (var i = 0; i < NUM_HOLDERS; i++) {
					if (_itemHolders[i].item) {
						_itemHolders[i].item.needsUpdate = true;
					}
				}
			},

			updateCurrItem: function updateCurrItem(beforeAnimation) {

				if (_indexDiff === 0) {
					return;
				}

				var diffAbs = Math.abs(_indexDiff),
				    tempHolder;

				if (beforeAnimation && diffAbs < 2) {
					return;
				}

				self.currItem = _getItemAt(_currentItemIndex);
				_renderMaxResolution = false;

				_shout('beforeChange', _indexDiff);

				if (diffAbs >= NUM_HOLDERS) {
					_containerShiftIndex += _indexDiff + (_indexDiff > 0 ? -NUM_HOLDERS : NUM_HOLDERS);
					diffAbs = NUM_HOLDERS;
				}
				for (var i = 0; i < diffAbs; i++) {
					if (_indexDiff > 0) {
						tempHolder = _itemHolders.shift();
						_itemHolders[NUM_HOLDERS - 1] = tempHolder; // move first to last

						_containerShiftIndex++;
						_setTranslateX((_containerShiftIndex + 2) * _slideSize.x, tempHolder.el.style);
						self.setContent(tempHolder, _currentItemIndex - diffAbs + i + 1 + 1);
					} else {
						tempHolder = _itemHolders.pop();
						_itemHolders.unshift(tempHolder); // move last to first

						_containerShiftIndex--;
						_setTranslateX(_containerShiftIndex * _slideSize.x, tempHolder.el.style);
						self.setContent(tempHolder, _currentItemIndex + diffAbs - i - 1 - 1);
					}
				}

				// reset zoom/pan on previous item
				if (_currZoomElementStyle && Math.abs(_indexDiff) === 1) {

					var prevItem = _getItemAt(_prevItemIndex);
					if (prevItem.initialZoomLevel !== _currZoomLevel) {
						_calculateItemSize(prevItem, _viewportSize);
						_setImageSize(prevItem);
						_applyZoomPanToItem(prevItem);
					}
				}

				// reset diff after update
				_indexDiff = 0;

				self.updateCurrZoomItem();

				_prevItemIndex = _currentItemIndex;

				_shout('afterChange');
			},

			updateSize: function updateSize(force) {

				if (!_isFixedPosition && _options.modal) {
					var windowScrollY = framework.getScrollY();
					if (_currentWindowScrollY !== windowScrollY) {
						template.style.top = windowScrollY + 'px';
						_currentWindowScrollY = windowScrollY;
					}
					if (!force && _windowVisibleSize.x === window.innerWidth && _windowVisibleSize.y === window.innerHeight) {
						return;
					}
					_windowVisibleSize.x = window.innerWidth;
					_windowVisibleSize.y = window.innerHeight;

					//template.style.width = _windowVisibleSize.x + 'px';
					template.style.height = _windowVisibleSize.y + 'px';
				}

				_viewportSize.x = self.scrollWrap.clientWidth;
				_viewportSize.y = self.scrollWrap.clientHeight;

				_updatePageScrollOffset();

				_slideSize.x = _viewportSize.x + Math.round(_viewportSize.x * _options.spacing);
				_slideSize.y = _viewportSize.y;

				_moveMainScroll(_slideSize.x * _currPositionIndex);

				_shout('beforeResize'); // even may be used for example to switch image sources


				// don't re-calculate size on inital size update
				if (_containerShiftIndex !== undefined) {

					var holder, item, hIndex;

					for (var i = 0; i < NUM_HOLDERS; i++) {
						holder = _itemHolders[i];
						_setTranslateX((i + _containerShiftIndex) * _slideSize.x, holder.el.style);

						hIndex = _currentItemIndex + i - 1;

						if (_options.loop && _getNumItems() > 2) {
							hIndex = _getLoopedId(hIndex);
						}

						// update zoom level on items and refresh source (if needsUpdate)
						item = _getItemAt(hIndex);

						// re-render gallery item if `needsUpdate`,
						// or doesn't have `bounds` (entirely new slide object)
						if (item && (_itemsNeedUpdate || item.needsUpdate || !item.bounds)) {

							self.cleanSlide(item);

							self.setContent(holder, hIndex);

							// if "center" slide
							if (i === 1) {
								self.currItem = item;
								self.updateCurrZoomItem(true);
							}

							item.needsUpdate = false;
						} else if (holder.index === -1 && hIndex >= 0) {
							// add content first time
							self.setContent(holder, hIndex);
						}
						if (item && item.container) {
							_calculateItemSize(item, _viewportSize);
							_setImageSize(item);
							_applyZoomPanToItem(item);
						}
					}
					_itemsNeedUpdate = false;
				}

				_startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;
				_currPanBounds = self.currItem.bounds;

				if (_currPanBounds) {
					_panOffset.x = _currPanBounds.center.x;
					_panOffset.y = _currPanBounds.center.y;
					_applyCurrentZoomPan(true);
				}

				_shout('resize');
			},

			// Zoom current item to
			zoomTo: function zoomTo(destZoomLevel, centerPoint, speed, easingFn, updateFn) {
				/*
    	if(destZoomLevel === 'fit') {
    		destZoomLevel = self.currItem.fitRatio;
    	} else if(destZoomLevel === 'fill') {
    		destZoomLevel = self.currItem.fillRatio;
    	}
    */

				if (centerPoint) {
					_startZoomLevel = _currZoomLevel;
					_midZoomPoint.x = Math.abs(centerPoint.x) - _panOffset.x;
					_midZoomPoint.y = Math.abs(centerPoint.y) - _panOffset.y;
					_equalizePoints(_startPanOffset, _panOffset);
				}

				var destPanBounds = _calculatePanBounds(destZoomLevel, false),
				    destPanOffset = {};

				_modifyDestPanOffset('x', destPanBounds, destPanOffset, destZoomLevel);
				_modifyDestPanOffset('y', destPanBounds, destPanOffset, destZoomLevel);

				var initialZoomLevel = _currZoomLevel;
				var initialPanOffset = {
					x: _panOffset.x,
					y: _panOffset.y
				};

				_roundPoint(destPanOffset);

				var onUpdate = function onUpdate(now) {
					if (now === 1) {
						_currZoomLevel = destZoomLevel;
						_panOffset.x = destPanOffset.x;
						_panOffset.y = destPanOffset.y;
					} else {
						_currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
						_panOffset.x = (destPanOffset.x - initialPanOffset.x) * now + initialPanOffset.x;
						_panOffset.y = (destPanOffset.y - initialPanOffset.y) * now + initialPanOffset.y;
					}

					if (updateFn) {
						updateFn(now);
					}

					_applyCurrentZoomPan(now === 1);
				};

				if (speed) {
					_animateProp('customZoomTo', 0, 1, speed, easingFn || framework.easing.sine.inOut, onUpdate);
				} else {
					onUpdate(1);
				}
			}

		};

		/*>>core*/

		/*>>gestures*/
		/**
   * Mouse/touch/pointer event handlers.
   * 
   * separated from @core.js for readability
   */

		var MIN_SWIPE_DISTANCE = 30,
		    DIRECTION_CHECK_OFFSET = 10; // amount of pixels to drag to determine direction of swipe

		var _gestureStartTime,
		    _gestureCheckSpeedTime,


		// pool of objects that are used during dragging of zooming
		p = {},
		    // first point
		p2 = {},
		    // second point (for zoom gesture)
		delta = {},
		    _currPoint = {},
		    _startPoint = {},
		    _currPointers = [],
		    _startMainScrollPos = {},
		    _releaseAnimData,
		    _posPoints = [],
		    // array of points during dragging, used to determine type of gesture
		_tempPoint = {},
		    _isZoomingIn,
		    _verticalDragInitiated,
		    _oldAndroidTouchEndTimeout,
		    _currZoomedItemIndex = 0,
		    _centerPoint = _getEmptyPoint(),
		    _lastReleaseTime = 0,
		    _isDragging,
		    // at least one pointer is down
		_isMultitouch,
		    // at least two _pointers are down
		_zoomStarted,
		    // zoom level changed during zoom gesture
		_moved,
		    _dragAnimFrame,
		    _mainScrollShifted,
		    _currentPoints,
		    // array of current touch points
		_isZooming,
		    _currPointsDistance,
		    _startPointsDistance,
		    _currPanBounds,
		    _mainScrollPos = _getEmptyPoint(),
		    _currZoomElementStyle,
		    _mainScrollAnimating,
		    // true, if animation after swipe gesture is running
		_midZoomPoint = _getEmptyPoint(),
		    _currCenterPoint = _getEmptyPoint(),
		    _direction,
		    _isFirstMove,
		    _opacityChanged,
		    _bgOpacity,
		    _wasOverInitialZoom,
		    _isEqualPoints = function _isEqualPoints(p1, p2) {
			return p1.x === p2.x && p1.y === p2.y;
		},
		    _isNearbyPoints = function _isNearbyPoints(touch0, touch1) {
			return Math.abs(touch0.x - touch1.x) < DOUBLE_TAP_RADIUS && Math.abs(touch0.y - touch1.y) < DOUBLE_TAP_RADIUS;
		},
		    _calculatePointsDistance = function _calculatePointsDistance(p1, p2) {
			_tempPoint.x = Math.abs(p1.x - p2.x);
			_tempPoint.y = Math.abs(p1.y - p2.y);
			return Math.sqrt(_tempPoint.x * _tempPoint.x + _tempPoint.y * _tempPoint.y);
		},
		    _stopDragUpdateLoop = function _stopDragUpdateLoop() {
			if (_dragAnimFrame) {
				_cancelAF(_dragAnimFrame);
				_dragAnimFrame = null;
			}
		},
		    _dragUpdateLoop = function _dragUpdateLoop() {
			if (_isDragging) {
				_dragAnimFrame = _requestAF(_dragUpdateLoop);
				_renderMovement();
			}
		},
		    _canPan = function _canPan() {
			return !(_options.scaleMode === 'fit' && _currZoomLevel === self.currItem.initialZoomLevel);
		},


		// find the closest parent DOM element
		_closestElement = function _closestElement(el, fn) {
			if (!el || el === document) {
				return false;
			}

			// don't search elements above pswp__scroll-wrap
			if (el.getAttribute('class') && el.getAttribute('class').indexOf('pswp__scroll-wrap') > -1) {
				return false;
			}

			if (fn(el)) {
				return el;
			}

			return _closestElement(el.parentNode, fn);
		},
		    _preventObj = {},
		    _preventDefaultEventBehaviour = function _preventDefaultEventBehaviour(e, isDown) {
			_preventObj.prevent = !_closestElement(e.target, _options.isClickableElement);

			_shout('preventDragEvent', e, isDown, _preventObj);
			return _preventObj.prevent;
		},
		    _convertTouchToPoint = function _convertTouchToPoint(touch, p) {
			p.x = touch.pageX;
			p.y = touch.pageY;
			p.id = touch.identifier;
			return p;
		},
		    _findCenterOfPoints = function _findCenterOfPoints(p1, p2, pCenter) {
			pCenter.x = (p1.x + p2.x) * 0.5;
			pCenter.y = (p1.y + p2.y) * 0.5;
		},
		    _pushPosPoint = function _pushPosPoint(time, x, y) {
			if (time - _gestureCheckSpeedTime > 50) {
				var o = _posPoints.length > 2 ? _posPoints.shift() : {};
				o.x = x;
				o.y = y;
				_posPoints.push(o);
				_gestureCheckSpeedTime = time;
			}
		},
		    _calculateVerticalDragOpacityRatio = function _calculateVerticalDragOpacityRatio() {
			var yOffset = _panOffset.y - self.currItem.initialPosition.y; // difference between initial and current position
			return 1 - Math.abs(yOffset / (_viewportSize.y / 2));
		},


		// points pool, reused during touch events
		_ePoint1 = {},
		    _ePoint2 = {},
		    _tempPointsArr = [],
		    _tempCounter,
		    _getTouchPoints = function _getTouchPoints(e) {
			// clean up previous points, without recreating array
			while (_tempPointsArr.length > 0) {
				_tempPointsArr.pop();
			}

			if (!_pointerEventEnabled) {
				if (e.type.indexOf('touch') > -1) {

					if (e.touches && e.touches.length > 0) {
						_tempPointsArr[0] = _convertTouchToPoint(e.touches[0], _ePoint1);
						if (e.touches.length > 1) {
							_tempPointsArr[1] = _convertTouchToPoint(e.touches[1], _ePoint2);
						}
					}
				} else {
					_ePoint1.x = e.pageX;
					_ePoint1.y = e.pageY;
					_ePoint1.id = '';
					_tempPointsArr[0] = _ePoint1; //_ePoint1;
				}
			} else {
				_tempCounter = 0;
				// we can use forEach, as pointer events are supported only in modern browsers
				_currPointers.forEach(function (p) {
					if (_tempCounter === 0) {
						_tempPointsArr[0] = p;
					} else if (_tempCounter === 1) {
						_tempPointsArr[1] = p;
					}
					_tempCounter++;
				});
			}
			return _tempPointsArr;
		},
		    _panOrMoveMainScroll = function _panOrMoveMainScroll(axis, delta) {

			var panFriction,
			    overDiff = 0,
			    newOffset = _panOffset[axis] + delta[axis],
			    startOverDiff,
			    dir = delta[axis] > 0,
			    newMainScrollPosition = _mainScrollPos.x + delta.x,
			    mainScrollDiff = _mainScrollPos.x - _startMainScrollPos.x,
			    newPanPos,
			    newMainScrollPos;

			// calculate fdistance over the bounds and friction
			if (newOffset > _currPanBounds.min[axis] || newOffset < _currPanBounds.max[axis]) {
				panFriction = _options.panEndFriction;
				// Linear increasing of friction, so at 1/4 of viewport it's at max value. 
				// Looks not as nice as was expected. Left for history.
				// panFriction = (1 - (_panOffset[axis] + delta[axis] + panBounds.min[axis]) / (_viewportSize[axis] / 4) );
			} else {
				panFriction = 1;
			}

			newOffset = _panOffset[axis] + delta[axis] * panFriction;

			// move main scroll or start panning
			if (_options.allowPanToNext || _currZoomLevel === self.currItem.initialZoomLevel) {

				if (!_currZoomElementStyle) {

					newMainScrollPos = newMainScrollPosition;
				} else if (_direction === 'h' && axis === 'x' && !_zoomStarted) {

					if (dir) {
						if (newOffset > _currPanBounds.min[axis]) {
							panFriction = _options.panEndFriction;
							overDiff = _currPanBounds.min[axis] - newOffset;
							startOverDiff = _currPanBounds.min[axis] - _startPanOffset[axis];
						}

						// drag right
						if ((startOverDiff <= 0 || mainScrollDiff < 0) && _getNumItems() > 1) {
							newMainScrollPos = newMainScrollPosition;
							if (mainScrollDiff < 0 && newMainScrollPosition > _startMainScrollPos.x) {
								newMainScrollPos = _startMainScrollPos.x;
							}
						} else {
							if (_currPanBounds.min.x !== _currPanBounds.max.x) {
								newPanPos = newOffset;
							}
						}
					} else {

						if (newOffset < _currPanBounds.max[axis]) {
							panFriction = _options.panEndFriction;
							overDiff = newOffset - _currPanBounds.max[axis];
							startOverDiff = _startPanOffset[axis] - _currPanBounds.max[axis];
						}

						if ((startOverDiff <= 0 || mainScrollDiff > 0) && _getNumItems() > 1) {
							newMainScrollPos = newMainScrollPosition;

							if (mainScrollDiff > 0 && newMainScrollPosition < _startMainScrollPos.x) {
								newMainScrollPos = _startMainScrollPos.x;
							}
						} else {
							if (_currPanBounds.min.x !== _currPanBounds.max.x) {
								newPanPos = newOffset;
							}
						}
					}

					//
				}

				if (axis === 'x') {

					if (newMainScrollPos !== undefined) {
						_moveMainScroll(newMainScrollPos, true);
						if (newMainScrollPos === _startMainScrollPos.x) {
							_mainScrollShifted = false;
						} else {
							_mainScrollShifted = true;
						}
					}

					if (_currPanBounds.min.x !== _currPanBounds.max.x) {
						if (newPanPos !== undefined) {
							_panOffset.x = newPanPos;
						} else if (!_mainScrollShifted) {
							_panOffset.x += delta.x * panFriction;
						}
					}

					return newMainScrollPos !== undefined;
				}
			}

			if (!_mainScrollAnimating) {

				if (!_mainScrollShifted) {
					if (_currZoomLevel > self.currItem.fitRatio) {
						_panOffset[axis] += delta[axis] * panFriction;
					}
				}
			}
		},


		// Pointerdown/touchstart/mousedown handler
		_onDragStart = function _onDragStart(e) {

			// Allow dragging only via left mouse button.
			// As this handler is not added in IE8 - we ignore e.which
			// 
			// http://www.quirksmode.org/js/events_properties.html
			// https://developer.mozilla.org/en-US/docs/Web/API/event.button
			if (e.type === 'mousedown' && e.button > 0) {
				return;
			}

			if (_initialZoomRunning) {
				e.preventDefault();
				return;
			}

			if (_oldAndroidTouchEndTimeout && e.type === 'mousedown') {
				return;
			}

			if (_preventDefaultEventBehaviour(e, true)) {
				e.preventDefault();
			}

			_shout('pointerDown');

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
				if (pointerIndex < 0) {
					pointerIndex = _currPointers.length;
				}
				_currPointers[pointerIndex] = { x: e.pageX, y: e.pageY, id: e.pointerId };
			}

			var startPointsList = _getTouchPoints(e),
			    numPoints = startPointsList.length;

			_currentPoints = null;

			_stopAllAnimations();

			// init drag
			if (!_isDragging || numPoints === 1) {

				_isDragging = _isFirstMove = true;
				framework.bind(window, _upMoveEvents, self);

				_isZoomingIn = _wasOverInitialZoom = _opacityChanged = _verticalDragInitiated = _mainScrollShifted = _moved = _isMultitouch = _zoomStarted = false;

				_direction = null;

				_shout('firstTouchStart', startPointsList);

				_equalizePoints(_startPanOffset, _panOffset);

				_currPanDist.x = _currPanDist.y = 0;
				_equalizePoints(_currPoint, startPointsList[0]);
				_equalizePoints(_startPoint, _currPoint);

				//_equalizePoints(_startMainScrollPos, _mainScrollPos);
				_startMainScrollPos.x = _slideSize.x * _currPositionIndex;

				_posPoints = [{
					x: _currPoint.x,
					y: _currPoint.y
				}];

				_gestureCheckSpeedTime = _gestureStartTime = _getCurrentTime();

				//_mainScrollAnimationEnd(true);
				_calculatePanBounds(_currZoomLevel, true);

				// Start rendering
				_stopDragUpdateLoop();
				_dragUpdateLoop();
			}

			// init zoom
			if (!_isZooming && numPoints > 1 && !_mainScrollAnimating && !_mainScrollShifted) {
				_startZoomLevel = _currZoomLevel;
				_zoomStarted = false; // true if zoom changed at least once

				_isZooming = _isMultitouch = true;
				_currPanDist.y = _currPanDist.x = 0;

				_equalizePoints(_startPanOffset, _panOffset);

				_equalizePoints(p, startPointsList[0]);
				_equalizePoints(p2, startPointsList[1]);

				_findCenterOfPoints(p, p2, _currCenterPoint);

				_midZoomPoint.x = Math.abs(_currCenterPoint.x) - _panOffset.x;
				_midZoomPoint.y = Math.abs(_currCenterPoint.y) - _panOffset.y;
				_currPointsDistance = _startPointsDistance = _calculatePointsDistance(p, p2);
			}
		},


		// Pointermove/touchmove/mousemove handler
		_onDragMove = function _onDragMove(e) {

			e.preventDefault();

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
				if (pointerIndex > -1) {
					var p = _currPointers[pointerIndex];
					p.x = e.pageX;
					p.y = e.pageY;
				}
			}

			if (_isDragging) {
				var touchesList = _getTouchPoints(e);
				if (!_direction && !_moved && !_isZooming) {

					if (_mainScrollPos.x !== _slideSize.x * _currPositionIndex) {
						// if main scroll position is shifted – direction is always horizontal
						_direction = 'h';
					} else {
						var diff = Math.abs(touchesList[0].x - _currPoint.x) - Math.abs(touchesList[0].y - _currPoint.y);
						// check the direction of movement
						if (Math.abs(diff) >= DIRECTION_CHECK_OFFSET) {
							_direction = diff > 0 ? 'h' : 'v';
							_currentPoints = touchesList;
						}
					}
				} else {
					_currentPoints = touchesList;
				}
			}
		},

		// 
		_renderMovement = function _renderMovement() {

			if (!_currentPoints) {
				return;
			}

			var numPoints = _currentPoints.length;

			if (numPoints === 0) {
				return;
			}

			_equalizePoints(p, _currentPoints[0]);

			delta.x = p.x - _currPoint.x;
			delta.y = p.y - _currPoint.y;

			if (_isZooming && numPoints > 1) {
				// Handle behaviour for more than 1 point

				_currPoint.x = p.x;
				_currPoint.y = p.y;

				// check if one of two points changed
				if (!delta.x && !delta.y && _isEqualPoints(_currentPoints[1], p2)) {
					return;
				}

				_equalizePoints(p2, _currentPoints[1]);

				if (!_zoomStarted) {
					_zoomStarted = true;
					_shout('zoomGestureStarted');
				}

				// Distance between two points
				var pointsDistance = _calculatePointsDistance(p, p2);

				var zoomLevel = _calculateZoomLevel(pointsDistance);

				// slightly over the of initial zoom level
				if (zoomLevel > self.currItem.initialZoomLevel + self.currItem.initialZoomLevel / 15) {
					_wasOverInitialZoom = true;
				}

				// Apply the friction if zoom level is out of the bounds
				var zoomFriction = 1,
				    minZoomLevel = _getMinZoomLevel(),
				    maxZoomLevel = _getMaxZoomLevel();

				if (zoomLevel < minZoomLevel) {

					if (_options.pinchToClose && !_wasOverInitialZoom && _startZoomLevel <= self.currItem.initialZoomLevel) {
						// fade out background if zooming out
						var minusDiff = minZoomLevel - zoomLevel;
						var percent = 1 - minusDiff / (minZoomLevel / 1.2);

						_applyBgOpacity(percent);
						_shout('onPinchClose', percent);
						_opacityChanged = true;
					} else {
						zoomFriction = (minZoomLevel - zoomLevel) / minZoomLevel;
						if (zoomFriction > 1) {
							zoomFriction = 1;
						}
						zoomLevel = minZoomLevel - zoomFriction * (minZoomLevel / 3);
					}
				} else if (zoomLevel > maxZoomLevel) {
					// 1.5 - extra zoom level above the max. E.g. if max is x6, real max 6 + 1.5 = 7.5
					zoomFriction = (zoomLevel - maxZoomLevel) / (minZoomLevel * 6);
					if (zoomFriction > 1) {
						zoomFriction = 1;
					}
					zoomLevel = maxZoomLevel + zoomFriction * minZoomLevel;
				}

				if (zoomFriction < 0) {
					zoomFriction = 0;
				}

				// distance between touch points after friction is applied
				_currPointsDistance = pointsDistance;

				// _centerPoint - The point in the middle of two pointers
				_findCenterOfPoints(p, p2, _centerPoint);

				// paning with two pointers pressed
				_currPanDist.x += _centerPoint.x - _currCenterPoint.x;
				_currPanDist.y += _centerPoint.y - _currCenterPoint.y;
				_equalizePoints(_currCenterPoint, _centerPoint);

				_panOffset.x = _calculatePanOffset('x', zoomLevel);
				_panOffset.y = _calculatePanOffset('y', zoomLevel);

				_isZoomingIn = zoomLevel > _currZoomLevel;
				_currZoomLevel = zoomLevel;
				_applyCurrentZoomPan();
			} else {

				// handle behaviour for one point (dragging or panning)

				if (!_direction) {
					return;
				}

				if (_isFirstMove) {
					_isFirstMove = false;

					// subtract drag distance that was used during the detection direction  

					if (Math.abs(delta.x) >= DIRECTION_CHECK_OFFSET) {
						delta.x -= _currentPoints[0].x - _startPoint.x;
					}

					if (Math.abs(delta.y) >= DIRECTION_CHECK_OFFSET) {
						delta.y -= _currentPoints[0].y - _startPoint.y;
					}
				}

				_currPoint.x = p.x;
				_currPoint.y = p.y;

				// do nothing if pointers position hasn't changed
				if (delta.x === 0 && delta.y === 0) {
					return;
				}

				if (_direction === 'v' && _options.closeOnVerticalDrag) {
					if (!_canPan()) {
						_currPanDist.y += delta.y;
						_panOffset.y += delta.y;

						var opacityRatio = _calculateVerticalDragOpacityRatio();

						_verticalDragInitiated = true;
						_shout('onVerticalDrag', opacityRatio);

						_applyBgOpacity(opacityRatio);
						_applyCurrentZoomPan();
						return;
					}
				}

				_pushPosPoint(_getCurrentTime(), p.x, p.y);

				_moved = true;
				_currPanBounds = self.currItem.bounds;

				var mainScrollChanged = _panOrMoveMainScroll('x', delta);
				if (!mainScrollChanged) {
					_panOrMoveMainScroll('y', delta);

					_roundPoint(_panOffset);
					_applyCurrentZoomPan();
				}
			}
		},


		// Pointerup/pointercancel/touchend/touchcancel/mouseup event handler
		_onDragRelease = function _onDragRelease(e) {

			if (_features.isOldAndroid) {

				if (_oldAndroidTouchEndTimeout && e.type === 'mouseup') {
					return;
				}

				// on Android (v4.1, 4.2, 4.3 & possibly older) 
				// ghost mousedown/up event isn't preventable via e.preventDefault,
				// which causes fake mousedown event
				// so we block mousedown/up for 600ms
				if (e.type.indexOf('touch') > -1) {
					clearTimeout(_oldAndroidTouchEndTimeout);
					_oldAndroidTouchEndTimeout = setTimeout(function () {
						_oldAndroidTouchEndTimeout = 0;
					}, 600);
				}
			}

			_shout('pointerUp');

			if (_preventDefaultEventBehaviour(e, false)) {
				e.preventDefault();
			}

			var releasePoint;

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');

				if (pointerIndex > -1) {
					releasePoint = _currPointers.splice(pointerIndex, 1)[0];

					if (navigator.pointerEnabled) {
						releasePoint.type = e.pointerType || 'mouse';
					} else {
						var MSPOINTER_TYPES = {
							4: 'mouse', // event.MSPOINTER_TYPE_MOUSE
							2: 'touch', // event.MSPOINTER_TYPE_TOUCH 
							3: 'pen' // event.MSPOINTER_TYPE_PEN
						};
						releasePoint.type = MSPOINTER_TYPES[e.pointerType];

						if (!releasePoint.type) {
							releasePoint.type = e.pointerType || 'mouse';
						}
					}
				}
			}

			var touchList = _getTouchPoints(e),
			    gestureType,
			    numPoints = touchList.length;

			if (e.type === 'mouseup') {
				numPoints = 0;
			}

			// Do nothing if there were 3 touch points or more
			if (numPoints === 2) {
				_currentPoints = null;
				return true;
			}

			// if second pointer released
			if (numPoints === 1) {
				_equalizePoints(_startPoint, touchList[0]);
			}

			// pointer hasn't moved, send "tap release" point
			if (numPoints === 0 && !_direction && !_mainScrollAnimating) {
				if (!releasePoint) {
					if (e.type === 'mouseup') {
						releasePoint = { x: e.pageX, y: e.pageY, type: 'mouse' };
					} else if (e.changedTouches && e.changedTouches[0]) {
						releasePoint = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY, type: 'touch' };
					}
				}

				_shout('touchRelease', e, releasePoint);
			}

			// Difference in time between releasing of two last touch points (zoom gesture)
			var releaseTimeDiff = -1;

			// Gesture completed, no pointers left
			if (numPoints === 0) {
				_isDragging = false;
				framework.unbind(window, _upMoveEvents, self);

				_stopDragUpdateLoop();

				if (_isZooming) {
					// Two points released at the same time
					releaseTimeDiff = 0;
				} else if (_lastReleaseTime !== -1) {
					releaseTimeDiff = _getCurrentTime() - _lastReleaseTime;
				}
			}
			_lastReleaseTime = numPoints === 1 ? _getCurrentTime() : -1;

			if (releaseTimeDiff !== -1 && releaseTimeDiff < 150) {
				gestureType = 'zoom';
			} else {
				gestureType = 'swipe';
			}

			if (_isZooming && numPoints < 2) {
				_isZooming = false;

				// Only second point released
				if (numPoints === 1) {
					gestureType = 'zoomPointerUp';
				}
				_shout('zoomGestureEnded');
			}

			_currentPoints = null;
			if (!_moved && !_zoomStarted && !_mainScrollAnimating && !_verticalDragInitiated) {
				// nothing to animate
				return;
			}

			_stopAllAnimations();

			if (!_releaseAnimData) {
				_releaseAnimData = _initDragReleaseAnimationData();
			}

			_releaseAnimData.calculateSwipeSpeed('x');

			if (_verticalDragInitiated) {

				var opacityRatio = _calculateVerticalDragOpacityRatio();

				if (opacityRatio < _options.verticalDragRange) {
					self.close();
				} else {
					var initalPanY = _panOffset.y,
					    initialBgOpacity = _bgOpacity;

					_animateProp('verticalDrag', 0, 1, 300, framework.easing.cubic.out, function (now) {

						_panOffset.y = (self.currItem.initialPosition.y - initalPanY) * now + initalPanY;

						_applyBgOpacity((1 - initialBgOpacity) * now + initialBgOpacity);
						_applyCurrentZoomPan();
					});

					_shout('onVerticalDrag', 1);
				}

				return;
			}

			// main scroll 
			if ((_mainScrollShifted || _mainScrollAnimating) && numPoints === 0) {
				var itemChanged = _finishSwipeMainScrollGesture(gestureType, _releaseAnimData);
				if (itemChanged) {
					return;
				}
				gestureType = 'zoomPointerUp';
			}

			// prevent zoom/pan animation when main scroll animation runs
			if (_mainScrollAnimating) {
				return;
			}

			// Complete simple zoom gesture (reset zoom level if it's out of the bounds)  
			if (gestureType !== 'swipe') {
				_completeZoomGesture();
				return;
			}

			// Complete pan gesture if main scroll is not shifted, and it's possible to pan current image
			if (!_mainScrollShifted && _currZoomLevel > self.currItem.fitRatio) {
				_completePanGesture(_releaseAnimData);
			}
		},


		// Returns object with data about gesture
		// It's created only once and then reused
		_initDragReleaseAnimationData = function _initDragReleaseAnimationData() {
			// temp local vars
			var lastFlickDuration, tempReleasePos;

			// s = this
			var s = {
				lastFlickOffset: {},
				lastFlickDist: {},
				lastFlickSpeed: {},
				slowDownRatio: {},
				slowDownRatioReverse: {},
				speedDecelerationRatio: {},
				speedDecelerationRatioAbs: {},
				distanceOffset: {},
				backAnimDestination: {},
				backAnimStarted: {},
				calculateSwipeSpeed: function calculateSwipeSpeed(axis) {

					if (_posPoints.length > 1) {
						lastFlickDuration = _getCurrentTime() - _gestureCheckSpeedTime + 50;
						tempReleasePos = _posPoints[_posPoints.length - 2][axis];
					} else {
						lastFlickDuration = _getCurrentTime() - _gestureStartTime; // total gesture duration
						tempReleasePos = _startPoint[axis];
					}
					s.lastFlickOffset[axis] = _currPoint[axis] - tempReleasePos;
					s.lastFlickDist[axis] = Math.abs(s.lastFlickOffset[axis]);
					if (s.lastFlickDist[axis] > 20) {
						s.lastFlickSpeed[axis] = s.lastFlickOffset[axis] / lastFlickDuration;
					} else {
						s.lastFlickSpeed[axis] = 0;
					}
					if (Math.abs(s.lastFlickSpeed[axis]) < 0.1) {
						s.lastFlickSpeed[axis] = 0;
					}

					s.slowDownRatio[axis] = 0.95;
					s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
					s.speedDecelerationRatio[axis] = 1;
				},

				calculateOverBoundsAnimOffset: function calculateOverBoundsAnimOffset(axis, speed) {
					if (!s.backAnimStarted[axis]) {

						if (_panOffset[axis] > _currPanBounds.min[axis]) {
							s.backAnimDestination[axis] = _currPanBounds.min[axis];
						} else if (_panOffset[axis] < _currPanBounds.max[axis]) {
							s.backAnimDestination[axis] = _currPanBounds.max[axis];
						}

						if (s.backAnimDestination[axis] !== undefined) {
							s.slowDownRatio[axis] = 0.7;
							s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
							if (s.speedDecelerationRatioAbs[axis] < 0.05) {

								s.lastFlickSpeed[axis] = 0;
								s.backAnimStarted[axis] = true;

								_animateProp('bounceZoomPan' + axis, _panOffset[axis], s.backAnimDestination[axis], speed || 300, framework.easing.sine.out, function (pos) {
									_panOffset[axis] = pos;
									_applyCurrentZoomPan();
								});
							}
						}
					}
				},

				// Reduces the speed by slowDownRatio (per 10ms)
				calculateAnimOffset: function calculateAnimOffset(axis) {
					if (!s.backAnimStarted[axis]) {
						s.speedDecelerationRatio[axis] = s.speedDecelerationRatio[axis] * (s.slowDownRatio[axis] + s.slowDownRatioReverse[axis] - s.slowDownRatioReverse[axis] * s.timeDiff / 10);

						s.speedDecelerationRatioAbs[axis] = Math.abs(s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis]);
						s.distanceOffset[axis] = s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis] * s.timeDiff;
						_panOffset[axis] += s.distanceOffset[axis];
					}
				},

				panAnimLoop: function panAnimLoop() {
					if (_animations.zoomPan) {
						_animations.zoomPan.raf = _requestAF(s.panAnimLoop);

						s.now = _getCurrentTime();
						s.timeDiff = s.now - s.lastNow;
						s.lastNow = s.now;

						s.calculateAnimOffset('x');
						s.calculateAnimOffset('y');

						_applyCurrentZoomPan();

						s.calculateOverBoundsAnimOffset('x');
						s.calculateOverBoundsAnimOffset('y');

						if (s.speedDecelerationRatioAbs.x < 0.05 && s.speedDecelerationRatioAbs.y < 0.05) {

							// round pan position
							_panOffset.x = Math.round(_panOffset.x);
							_panOffset.y = Math.round(_panOffset.y);
							_applyCurrentZoomPan();

							_stopAnimation('zoomPan');
							return;
						}
					}
				}
			};
			return s;
		},
		    _completePanGesture = function _completePanGesture(animData) {
			// calculate swipe speed for Y axis (paanning)
			animData.calculateSwipeSpeed('y');

			_currPanBounds = self.currItem.bounds;

			animData.backAnimDestination = {};
			animData.backAnimStarted = {};

			// Avoid acceleration animation if speed is too low
			if (Math.abs(animData.lastFlickSpeed.x) <= 0.05 && Math.abs(animData.lastFlickSpeed.y) <= 0.05) {
				animData.speedDecelerationRatioAbs.x = animData.speedDecelerationRatioAbs.y = 0;

				// Run pan drag release animation. E.g. if you drag image and release finger without momentum.
				animData.calculateOverBoundsAnimOffset('x');
				animData.calculateOverBoundsAnimOffset('y');
				return true;
			}

			// Animation loop that controls the acceleration after pan gesture ends
			_registerStartAnimation('zoomPan');
			animData.lastNow = _getCurrentTime();
			animData.panAnimLoop();
		},
		    _finishSwipeMainScrollGesture = function _finishSwipeMainScrollGesture(gestureType, _releaseAnimData) {
			var itemChanged;
			if (!_mainScrollAnimating) {
				_currZoomedItemIndex = _currentItemIndex;
			}

			var itemsDiff;

			if (gestureType === 'swipe') {
				var totalShiftDist = _currPoint.x - _startPoint.x,
				    isFastLastFlick = _releaseAnimData.lastFlickDist.x < 10;

				// if container is shifted for more than MIN_SWIPE_DISTANCE, 
				// and last flick gesture was in right direction
				if (totalShiftDist > MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x > 20)) {
					// go to prev item
					itemsDiff = -1;
				} else if (totalShiftDist < -MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x < -20)) {
					// go to next item
					itemsDiff = 1;
				}
			}

			var nextCircle;

			if (itemsDiff) {

				_currentItemIndex += itemsDiff;

				if (_currentItemIndex < 0) {
					_currentItemIndex = _options.loop ? _getNumItems() - 1 : 0;
					nextCircle = true;
				} else if (_currentItemIndex >= _getNumItems()) {
					_currentItemIndex = _options.loop ? 0 : _getNumItems() - 1;
					nextCircle = true;
				}

				if (!nextCircle || _options.loop) {
					_indexDiff += itemsDiff;
					_currPositionIndex -= itemsDiff;
					itemChanged = true;
				}
			}

			var animateToX = _slideSize.x * _currPositionIndex;
			var animateToDist = Math.abs(animateToX - _mainScrollPos.x);
			var finishAnimDuration;

			if (!itemChanged && animateToX > _mainScrollPos.x !== _releaseAnimData.lastFlickSpeed.x > 0) {
				// "return to current" duration, e.g. when dragging from slide 0 to -1
				finishAnimDuration = 333;
			} else {
				finishAnimDuration = Math.abs(_releaseAnimData.lastFlickSpeed.x) > 0 ? animateToDist / Math.abs(_releaseAnimData.lastFlickSpeed.x) : 333;

				finishAnimDuration = Math.min(finishAnimDuration, 400);
				finishAnimDuration = Math.max(finishAnimDuration, 250);
			}

			if (_currZoomedItemIndex === _currentItemIndex) {
				itemChanged = false;
			}

			_mainScrollAnimating = true;

			_shout('mainScrollAnimStart');

			_animateProp('mainScroll', _mainScrollPos.x, animateToX, finishAnimDuration, framework.easing.cubic.out, _moveMainScroll, function () {
				_stopAllAnimations();
				_mainScrollAnimating = false;
				_currZoomedItemIndex = -1;

				if (itemChanged || _currZoomedItemIndex !== _currentItemIndex) {
					self.updateCurrItem();
				}

				_shout('mainScrollAnimComplete');
			});

			if (itemChanged) {
				self.updateCurrItem(true);
			}

			return itemChanged;
		},
		    _calculateZoomLevel = function _calculateZoomLevel(touchesDistance) {
			return 1 / _startPointsDistance * touchesDistance * _startZoomLevel;
		},


		// Resets zoom if it's out of bounds
		_completeZoomGesture = function _completeZoomGesture() {
			var destZoomLevel = _currZoomLevel,
			    minZoomLevel = _getMinZoomLevel(),
			    maxZoomLevel = _getMaxZoomLevel();

			if (_currZoomLevel < minZoomLevel) {
				destZoomLevel = minZoomLevel;
			} else if (_currZoomLevel > maxZoomLevel) {
				destZoomLevel = maxZoomLevel;
			}

			var destOpacity = 1,
			    onUpdate,
			    initialOpacity = _bgOpacity;

			if (_opacityChanged && !_isZoomingIn && !_wasOverInitialZoom && _currZoomLevel < minZoomLevel) {
				//_closedByScroll = true;
				self.close();
				return true;
			}

			if (_opacityChanged) {
				onUpdate = function onUpdate(now) {
					_applyBgOpacity((destOpacity - initialOpacity) * now + initialOpacity);
				};
			}

			self.zoomTo(destZoomLevel, 0, 200, framework.easing.cubic.out, onUpdate);
			return true;
		};

		_registerModule('Gestures', {
			publicMethods: {

				initGestures: function initGestures() {

					// helper function that builds touch/pointer/mouse events
					var addEventNames = function addEventNames(pref, down, move, up, cancel) {
						_dragStartEvent = pref + down;
						_dragMoveEvent = pref + move;
						_dragEndEvent = pref + up;
						if (cancel) {
							_dragCancelEvent = pref + cancel;
						} else {
							_dragCancelEvent = '';
						}
					};

					_pointerEventEnabled = _features.pointerEvent;
					if (_pointerEventEnabled && _features.touch) {
						// we don't need touch events, if browser supports pointer events
						_features.touch = false;
					}

					if (_pointerEventEnabled) {
						if (navigator.pointerEnabled) {
							addEventNames('pointer', 'down', 'move', 'up', 'cancel');
						} else {
							// IE10 pointer events are case-sensitive
							addEventNames('MSPointer', 'Down', 'Move', 'Up', 'Cancel');
						}
					} else if (_features.touch) {
						addEventNames('touch', 'start', 'move', 'end', 'cancel');
						_likelyTouchDevice = true;
					} else {
						addEventNames('mouse', 'down', 'move', 'up');
					}

					_upMoveEvents = _dragMoveEvent + ' ' + _dragEndEvent + ' ' + _dragCancelEvent;
					_downEvents = _dragStartEvent;

					if (_pointerEventEnabled && !_likelyTouchDevice) {
						_likelyTouchDevice = navigator.maxTouchPoints > 1 || navigator.msMaxTouchPoints > 1;
					}
					// make variable public
					self.likelyTouchDevice = _likelyTouchDevice;

					_globalEventHandlers[_dragStartEvent] = _onDragStart;
					_globalEventHandlers[_dragMoveEvent] = _onDragMove;
					_globalEventHandlers[_dragEndEvent] = _onDragRelease; // the Kraken

					if (_dragCancelEvent) {
						_globalEventHandlers[_dragCancelEvent] = _globalEventHandlers[_dragEndEvent];
					}

					// Bind mouse events on device with detected hardware touch support, in case it supports multiple types of input.
					if (_features.touch) {
						_downEvents += ' mousedown';
						_upMoveEvents += ' mousemove mouseup';
						_globalEventHandlers.mousedown = _globalEventHandlers[_dragStartEvent];
						_globalEventHandlers.mousemove = _globalEventHandlers[_dragMoveEvent];
						_globalEventHandlers.mouseup = _globalEventHandlers[_dragEndEvent];
					}

					if (!_likelyTouchDevice) {
						// don't allow pan to next slide from zoomed state on Desktop
						_options.allowPanToNext = false;
					}
				}

			}
		});

		/*>>gestures*/

		/*>>show-hide-transition*/
		/**
   * show-hide-transition.js:
   *
   * Manages initial opening or closing transition.
   *
   * If you're not planning to use transition for gallery at all,
   * you may set options hideAnimationDuration and showAnimationDuration to 0,
   * and just delete startAnimation function.
   * 
   */

		var _showOrHideTimeout,
		    _showOrHide = function _showOrHide(item, img, out, completeFn) {

			if (_showOrHideTimeout) {
				clearTimeout(_showOrHideTimeout);
			}

			_initialZoomRunning = true;
			_initialContentSet = true;

			// dimensions of small thumbnail {x:,y:,w:}.
			// Height is optional, as calculated based on large image.
			var thumbBounds;
			if (item.initialLayout) {
				thumbBounds = item.initialLayout;
				item.initialLayout = null;
			} else {
				thumbBounds = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
			}

			var duration = out ? _options.hideAnimationDuration : _options.showAnimationDuration;

			var onComplete = function onComplete() {
				_stopAnimation('initialZoom');
				if (!out) {
					_applyBgOpacity(1);
					if (img) {
						img.style.display = 'block';
					}
					framework.addClass(template, 'pswp--animated-in');
					_shout('initialZoom' + (out ? 'OutEnd' : 'InEnd'));
				} else {
					self.template.removeAttribute('style');
					self.bg.removeAttribute('style');
				}

				if (completeFn) {
					completeFn();
				}
				_initialZoomRunning = false;
			};

			// if bounds aren't provided, just open gallery without animation
			if (!duration || !thumbBounds || thumbBounds.x === undefined) {

				_shout('initialZoom' + (out ? 'Out' : 'In'));

				_currZoomLevel = item.initialZoomLevel;
				_equalizePoints(_panOffset, item.initialPosition);
				_applyCurrentZoomPan();

				template.style.opacity = out ? 0 : 1;
				_applyBgOpacity(1);

				if (duration) {
					setTimeout(function () {
						onComplete();
					}, duration);
				} else {
					onComplete();
				}

				return;
			}

			var startAnimation = function startAnimation() {
				var closeWithRaf = _closedByScroll,
				    fadeEverything = !self.currItem.src || self.currItem.loadError || _options.showHideOpacity;

				// apply hw-acceleration to image
				if (item.miniImg) {
					item.miniImg.style.webkitBackfaceVisibility = 'hidden';
				}

				if (!out) {
					_currZoomLevel = thumbBounds.w / item.w;
					_panOffset.x = thumbBounds.x;
					_panOffset.y = thumbBounds.y - _initalWindowScrollY;

					self[fadeEverything ? 'template' : 'bg'].style.opacity = 0.001;
					_applyCurrentZoomPan();
				}

				_registerStartAnimation('initialZoom');

				if (out && !closeWithRaf) {
					framework.removeClass(template, 'pswp--animated-in');
				}

				if (fadeEverything) {
					if (out) {
						framework[(closeWithRaf ? 'remove' : 'add') + 'Class'](template, 'pswp--animate_opacity');
					} else {
						setTimeout(function () {
							framework.addClass(template, 'pswp--animate_opacity');
						}, 30);
					}
				}

				_showOrHideTimeout = setTimeout(function () {

					_shout('initialZoom' + (out ? 'Out' : 'In'));

					if (!out) {

						// "in" animation always uses CSS transitions (instead of rAF).
						// CSS transition work faster here, 
						// as developer may also want to animate other things, 
						// like ui on top of sliding area, which can be animated just via CSS

						_currZoomLevel = item.initialZoomLevel;
						_equalizePoints(_panOffset, item.initialPosition);
						_applyCurrentZoomPan();
						_applyBgOpacity(1);

						if (fadeEverything) {
							template.style.opacity = 1;
						} else {
							_applyBgOpacity(1);
						}

						_showOrHideTimeout = setTimeout(onComplete, duration + 20);
					} else {

						// "out" animation uses rAF only when PhotoSwipe is closed by browser scroll, to recalculate position
						var destZoomLevel = thumbBounds.w / item.w,
						    initialPanOffset = {
							x: _panOffset.x,
							y: _panOffset.y
						},
						    initialZoomLevel = _currZoomLevel,
						    initalBgOpacity = _bgOpacity,
						    onUpdate = function onUpdate(now) {

							if (now === 1) {
								_currZoomLevel = destZoomLevel;
								_panOffset.x = thumbBounds.x;
								_panOffset.y = thumbBounds.y - _currentWindowScrollY;
							} else {
								_currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
								_panOffset.x = (thumbBounds.x - initialPanOffset.x) * now + initialPanOffset.x;
								_panOffset.y = (thumbBounds.y - _currentWindowScrollY - initialPanOffset.y) * now + initialPanOffset.y;
							}

							_applyCurrentZoomPan();
							if (fadeEverything) {
								template.style.opacity = 1 - now;
							} else {
								_applyBgOpacity(initalBgOpacity - now * initalBgOpacity);
							}
						};

						if (closeWithRaf) {
							_animateProp('initialZoom', 0, 1, duration, framework.easing.cubic.out, onUpdate, onComplete);
						} else {
							onUpdate(1);
							_showOrHideTimeout = setTimeout(onComplete, duration + 20);
						}
					}
				}, out ? 25 : 90); // Main purpose of this delay is to give browser time to paint and
				// create composite layers of PhotoSwipe UI parts (background, controls, caption, arrows).
				// Which avoids lag at the beginning of scale transition.
			};
			startAnimation();
		};

		/*>>show-hide-transition*/

		/*>>items-controller*/
		/**
  *
  * Controller manages gallery items, their dimensions, and their content.
  * 
  */

		var _items,
		    _tempPanAreaSize = {},
		    _imagesToAppendPool = [],
		    _initialContentSet,
		    _initialZoomRunning,
		    _controllerDefaultOptions = {
			index: 0,
			errorMsg: '<div class="pswp__error-msg"><a href="%url%" target="_blank">The image</a> could not be loaded.</div>',
			forceProgressiveLoading: false, // TODO
			preload: [1, 1],
			getNumItemsFn: function getNumItemsFn() {
				return _items.length;
			}
		};

		var _getItemAt,
		    _getNumItems,
		    _initialIsLoop,
		    _getZeroBounds = function _getZeroBounds() {
			return {
				center: { x: 0, y: 0 },
				max: { x: 0, y: 0 },
				min: { x: 0, y: 0 }
			};
		},
		    _calculateSingleItemPanBounds = function _calculateSingleItemPanBounds(item, realPanElementW, realPanElementH) {
			var bounds = item.bounds;

			// position of element when it's centered
			bounds.center.x = Math.round((_tempPanAreaSize.x - realPanElementW) / 2);
			bounds.center.y = Math.round((_tempPanAreaSize.y - realPanElementH) / 2) + item.vGap.top;

			// maximum pan position
			bounds.max.x = realPanElementW > _tempPanAreaSize.x ? Math.round(_tempPanAreaSize.x - realPanElementW) : bounds.center.x;

			bounds.max.y = realPanElementH > _tempPanAreaSize.y ? Math.round(_tempPanAreaSize.y - realPanElementH) + item.vGap.top : bounds.center.y;

			// minimum pan position
			bounds.min.x = realPanElementW > _tempPanAreaSize.x ? 0 : bounds.center.x;
			bounds.min.y = realPanElementH > _tempPanAreaSize.y ? item.vGap.top : bounds.center.y;
		},
		    _calculateItemSize = function _calculateItemSize(item, viewportSize, zoomLevel) {

			if (item.src && !item.loadError) {
				var isInitial = !zoomLevel;

				if (isInitial) {
					if (!item.vGap) {
						item.vGap = { top: 0, bottom: 0 };
					}
					// allows overriding vertical margin for individual items
					_shout('parseVerticalMargin', item);
				}

				_tempPanAreaSize.x = viewportSize.x;
				_tempPanAreaSize.y = viewportSize.y - item.vGap.top - item.vGap.bottom;

				if (isInitial) {
					var hRatio = _tempPanAreaSize.x / item.w;
					var vRatio = _tempPanAreaSize.y / item.h;

					item.fitRatio = hRatio < vRatio ? hRatio : vRatio;
					//item.fillRatio = hRatio > vRatio ? hRatio : vRatio;

					var scaleMode = _options.scaleMode;

					if (scaleMode === 'orig') {
						zoomLevel = 1;
					} else if (scaleMode === 'fit') {
						zoomLevel = item.fitRatio;
					}

					if (zoomLevel > 1) {
						zoomLevel = 1;
					}

					item.initialZoomLevel = zoomLevel;

					if (!item.bounds) {
						// reuse bounds object
						item.bounds = _getZeroBounds();
					}
				}

				if (!zoomLevel) {
					return;
				}

				_calculateSingleItemPanBounds(item, item.w * zoomLevel, item.h * zoomLevel);

				if (isInitial && zoomLevel === item.initialZoomLevel) {
					item.initialPosition = item.bounds.center;
				}

				return item.bounds;
			} else {
				item.w = item.h = 0;
				item.initialZoomLevel = item.fitRatio = 1;
				item.bounds = _getZeroBounds();
				item.initialPosition = item.bounds.center;

				// if it's not image, we return zero bounds (content is not zoomable)
				return item.bounds;
			}
		},
		    _appendImage = function _appendImage(index, item, baseDiv, img, preventAnimation, keepPlaceholder) {

			if (item.loadError) {
				return;
			}

			if (img) {

				item.imageAppended = true;
				_setImageSize(item, img, item === self.currItem && _renderMaxResolution);

				baseDiv.appendChild(img);

				if (keepPlaceholder) {
					setTimeout(function () {
						if (item && item.loaded && item.placeholder) {
							item.placeholder.style.display = 'none';
							item.placeholder = null;
						}
					}, 500);
				}
			}
		},
		    _preloadImage = function _preloadImage(item) {
			item.loading = true;
			item.loaded = false;
			var img = item.img = framework.createEl('pswp__img', 'img');
			var onComplete = function onComplete() {
				item.loading = false;
				item.loaded = true;

				if (item.loadComplete) {
					item.loadComplete(item);
				} else {
					item.img = null; // no need to store image object
				}
				img.onload = img.onerror = null;
				img = null;
			};
			img.onload = onComplete;
			img.onerror = function () {
				item.loadError = true;
				onComplete();
			};

			img.src = item.src; // + '?a=' + Math.random();

			return img;
		},
		    _checkForError = function _checkForError(item, cleanUp) {
			if (item.src && item.loadError && item.container) {

				if (cleanUp) {
					item.container.innerHTML = '';
				}

				item.container.innerHTML = _options.errorMsg.replace('%url%', item.src);
				return true;
			}
		},
		    _setImageSize = function _setImageSize(item, img, maxRes) {
			if (!item.src) {
				return;
			}

			if (!img) {
				img = item.container.lastChild;
			}

			var w = maxRes ? item.w : Math.round(item.w * item.fitRatio),
			    h = maxRes ? item.h : Math.round(item.h * item.fitRatio);

			if (item.placeholder && !item.loaded) {
				item.placeholder.style.width = w + 'px';
				item.placeholder.style.height = h + 'px';
			}

			img.style.width = w + 'px';
			img.style.height = h + 'px';
		},
		    _appendImagesPool = function _appendImagesPool() {

			if (_imagesToAppendPool.length) {
				var poolItem;

				for (var i = 0; i < _imagesToAppendPool.length; i++) {
					poolItem = _imagesToAppendPool[i];
					if (poolItem.holder.index === poolItem.index) {
						_appendImage(poolItem.index, poolItem.item, poolItem.baseDiv, poolItem.img, false, poolItem.clearPlaceholder);
					}
				}
				_imagesToAppendPool = [];
			}
		};

		_registerModule('Controller', {

			publicMethods: {

				lazyLoadItem: function lazyLoadItem(index) {
					index = _getLoopedId(index);
					var item = _getItemAt(index);

					if (!item || (item.loaded || item.loading) && !_itemsNeedUpdate) {
						return;
					}

					_shout('gettingData', index, item);

					if (!item.src) {
						return;
					}

					_preloadImage(item);
				},
				initController: function initController() {
					framework.extend(_options, _controllerDefaultOptions, true);
					self.items = _items = items;
					_getItemAt = self.getItemAt;
					_getNumItems = _options.getNumItemsFn; //self.getNumItems;


					_initialIsLoop = _options.loop;
					if (_getNumItems() < 3) {
						_options.loop = false; // disable loop if less then 3 items
					}

					_listen('beforeChange', function (diff) {

						var p = _options.preload,
						    isNext = diff === null ? true : diff >= 0,
						    preloadBefore = Math.min(p[0], _getNumItems()),
						    preloadAfter = Math.min(p[1], _getNumItems()),
						    i;

						for (i = 1; i <= (isNext ? preloadAfter : preloadBefore); i++) {
							self.lazyLoadItem(_currentItemIndex + i);
						}
						for (i = 1; i <= (isNext ? preloadBefore : preloadAfter); i++) {
							self.lazyLoadItem(_currentItemIndex - i);
						}
					});

					_listen('initialLayout', function () {
						self.currItem.initialLayout = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
					});

					_listen('mainScrollAnimComplete', _appendImagesPool);
					_listen('initialZoomInEnd', _appendImagesPool);

					_listen('destroy', function () {
						var item;
						for (var i = 0; i < _items.length; i++) {
							item = _items[i];
							// remove reference to DOM elements, for GC
							if (item.container) {
								item.container = null;
							}
							if (item.placeholder) {
								item.placeholder = null;
							}
							if (item.img) {
								item.img = null;
							}
							if (item.preloader) {
								item.preloader = null;
							}
							if (item.loadError) {
								item.loaded = item.loadError = false;
							}
						}
						_imagesToAppendPool = null;
					});
				},

				getItemAt: function getItemAt(index) {
					if (index >= 0) {
						return _items[index] !== undefined ? _items[index] : false;
					}
					return false;
				},

				allowProgressiveImg: function allowProgressiveImg() {
					// 1. Progressive image loading isn't working on webkit/blink 
					//    when hw-acceleration (e.g. translateZ) is applied to IMG element.
					//    That's why in PhotoSwipe parent element gets zoom transform, not image itself.
					//    
					// 2. Progressive image loading sometimes blinks in webkit/blink when applying animation to parent element.
					//    That's why it's disabled on touch devices (mainly because of swipe transition)
					//    
					// 3. Progressive image loading sometimes doesn't work in IE (up to 11).

					// Don't allow progressive loading on non-large touch devices
					return _options.forceProgressiveLoading || !_likelyTouchDevice || _options.mouseUsed || screen.width > 1200;
					// 1200 - to eliminate touch devices with large screen (like Chromebook Pixel)
				},

				setContent: function setContent(holder, index) {

					if (_options.loop) {
						index = _getLoopedId(index);
					}

					var prevItem = self.getItemAt(holder.index);
					if (prevItem) {
						prevItem.container = null;
					}

					var item = self.getItemAt(index),
					    img;

					if (!item) {
						holder.el.innerHTML = '';
						return;
					}

					// allow to override data
					_shout('gettingData', index, item);

					holder.index = index;
					holder.item = item;

					// base container DIV is created only once for each of 3 holders
					var baseDiv = item.container = framework.createEl('pswp__zoom-wrap');

					if (!item.src && item.html) {
						if (item.html.tagName) {
							baseDiv.appendChild(item.html);
						} else {
							baseDiv.innerHTML = item.html;
						}
					}

					_checkForError(item);

					_calculateItemSize(item, _viewportSize);

					if (item.src && !item.loadError && !item.loaded) {

						item.loadComplete = function (item) {

							// gallery closed before image finished loading
							if (!_isOpen) {
								return;
							}

							// check if holder hasn't changed while image was loading
							if (holder && holder.index === index) {
								if (_checkForError(item, true)) {
									item.loadComplete = item.img = null;
									_calculateItemSize(item, _viewportSize);
									_applyZoomPanToItem(item);

									if (holder.index === _currentItemIndex) {
										// recalculate dimensions
										self.updateCurrZoomItem();
									}
									return;
								}
								if (!item.imageAppended) {
									if (_features.transform && (_mainScrollAnimating || _initialZoomRunning)) {
										_imagesToAppendPool.push({
											item: item,
											baseDiv: baseDiv,
											img: item.img,
											index: index,
											holder: holder,
											clearPlaceholder: true
										});
									} else {
										_appendImage(index, item, baseDiv, item.img, _mainScrollAnimating || _initialZoomRunning, true);
									}
								} else {
									// remove preloader & mini-img
									if (!_initialZoomRunning && item.placeholder) {
										item.placeholder.style.display = 'none';
										item.placeholder = null;
									}
								}
							}

							item.loadComplete = null;
							item.img = null; // no need to store image element after it's added

							_shout('imageLoadComplete', index, item);
						};

						if (framework.features.transform) {

							var placeholderClassName = 'pswp__img pswp__img--placeholder';
							placeholderClassName += item.msrc ? '' : ' pswp__img--placeholder--blank';

							var placeholder = framework.createEl(placeholderClassName, item.msrc ? 'img' : '');
							if (item.msrc) {
								placeholder.src = item.msrc;
							}

							_setImageSize(item, placeholder);

							baseDiv.appendChild(placeholder);
							item.placeholder = placeholder;
						}

						if (!item.loading) {
							_preloadImage(item);
						}

						if (self.allowProgressiveImg()) {
							// just append image
							if (!_initialContentSet && _features.transform) {
								_imagesToAppendPool.push({
									item: item,
									baseDiv: baseDiv,
									img: item.img,
									index: index,
									holder: holder
								});
							} else {
								_appendImage(index, item, baseDiv, item.img, true, true);
							}
						}
					} else if (item.src && !item.loadError) {
						// image object is created every time, due to bugs of image loading & delay when switching images
						img = framework.createEl('pswp__img', 'img');
						img.style.opacity = 1;
						img.src = item.src;
						_setImageSize(item, img);
						_appendImage(index, item, baseDiv, img, true);
					}

					if (!_initialContentSet && index === _currentItemIndex) {
						_currZoomElementStyle = baseDiv.style;
						_showOrHide(item, img || item.img);
					} else {
						_applyZoomPanToItem(item);
					}

					holder.el.innerHTML = '';
					holder.el.appendChild(baseDiv);
				},

				cleanSlide: function cleanSlide(item) {
					if (item.img) {
						item.img.onload = item.img.onerror = null;
					}
					item.loaded = item.loading = item.img = item.imageAppended = false;
				}

			}
		});

		/*>>items-controller*/

		/*>>tap*/
		/**
   * tap.js:
   *
   * Displatches tap and double-tap events.
   * 
   */

		var tapTimer,
		    tapReleasePoint = {},
		    _dispatchTapEvent = function _dispatchTapEvent(origEvent, releasePoint, pointerType) {
			var e = document.createEvent('CustomEvent'),
			    eDetail = {
				origEvent: origEvent,
				target: origEvent.target,
				releasePoint: releasePoint,
				pointerType: pointerType || 'touch'
			};

			e.initCustomEvent('pswpTap', true, true, eDetail);
			origEvent.target.dispatchEvent(e);
		};

		_registerModule('Tap', {
			publicMethods: {
				initTap: function initTap() {
					_listen('firstTouchStart', self.onTapStart);
					_listen('touchRelease', self.onTapRelease);
					_listen('destroy', function () {
						tapReleasePoint = {};
						tapTimer = null;
					});
				},
				onTapStart: function onTapStart(touchList) {
					if (touchList.length > 1) {
						clearTimeout(tapTimer);
						tapTimer = null;
					}
				},
				onTapRelease: function onTapRelease(e, releasePoint) {
					if (!releasePoint) {
						return;
					}

					if (!_moved && !_isMultitouch && !_numAnimations) {
						var p0 = releasePoint;
						if (tapTimer) {
							clearTimeout(tapTimer);
							tapTimer = null;

							// Check if taped on the same place
							if (_isNearbyPoints(p0, tapReleasePoint)) {
								_shout('doubleTap', p0);
								return;
							}
						}

						if (releasePoint.type === 'mouse') {
							_dispatchTapEvent(e, releasePoint, 'mouse');
							return;
						}

						var clickedTagName = e.target.tagName.toUpperCase();
						// avoid double tap delay on buttons and elements that have class pswp__single-tap
						if (clickedTagName === 'BUTTON' || framework.hasClass(e.target, 'pswp__single-tap')) {
							_dispatchTapEvent(e, releasePoint);
							return;
						}

						_equalizePoints(tapReleasePoint, p0);

						tapTimer = setTimeout(function () {
							_dispatchTapEvent(e, releasePoint);
							tapTimer = null;
						}, 300);
					}
				}
			}
		});

		/*>>tap*/

		/*>>desktop-zoom*/
		/**
   *
   * desktop-zoom.js:
   *
   * - Binds mousewheel event for paning zoomed image.
   * - Manages "dragging", "zoomed-in", "zoom-out" classes.
   *   (which are used for cursors and zoom icon)
   * - Adds toggleDesktopZoom function.
   * 
   */

		var _wheelDelta;

		_registerModule('DesktopZoom', {

			publicMethods: {

				initDesktopZoom: function initDesktopZoom() {

					if (_oldIE) {
						// no zoom for old IE (<=8)
						return;
					}

					if (_likelyTouchDevice) {
						// if detected hardware touch support, we wait until mouse is used,
						// and only then apply desktop-zoom features
						_listen('mouseUsed', function () {
							self.setupDesktopZoom();
						});
					} else {
						self.setupDesktopZoom(true);
					}
				},

				setupDesktopZoom: function setupDesktopZoom(onInit) {

					_wheelDelta = {};

					var events = 'wheel mousewheel DOMMouseScroll';

					_listen('bindEvents', function () {
						framework.bind(template, events, self.handleMouseWheel);
					});

					_listen('unbindEvents', function () {
						if (_wheelDelta) {
							framework.unbind(template, events, self.handleMouseWheel);
						}
					});

					self.mouseZoomedIn = false;

					var hasDraggingClass,
					    updateZoomable = function updateZoomable() {
						if (self.mouseZoomedIn) {
							framework.removeClass(template, 'pswp--zoomed-in');
							self.mouseZoomedIn = false;
						}
						if (_currZoomLevel < 1) {
							framework.addClass(template, 'pswp--zoom-allowed');
						} else {
							framework.removeClass(template, 'pswp--zoom-allowed');
						}
						removeDraggingClass();
					},
					    removeDraggingClass = function removeDraggingClass() {
						if (hasDraggingClass) {
							framework.removeClass(template, 'pswp--dragging');
							hasDraggingClass = false;
						}
					};

					_listen('resize', updateZoomable);
					_listen('afterChange', updateZoomable);
					_listen('pointerDown', function () {
						if (self.mouseZoomedIn) {
							hasDraggingClass = true;
							framework.addClass(template, 'pswp--dragging');
						}
					});
					_listen('pointerUp', removeDraggingClass);

					if (!onInit) {
						updateZoomable();
					}
				},

				handleMouseWheel: function handleMouseWheel(e) {

					if (_currZoomLevel <= self.currItem.fitRatio) {
						if (_options.modal) {

							if (!_options.closeOnScroll || _numAnimations || _isDragging) {
								e.preventDefault();
							} else if (_transformKey && Math.abs(e.deltaY) > 2) {
								// close PhotoSwipe
								// if browser supports transforms & scroll changed enough
								_closedByScroll = true;
								self.close();
							}
						}
						return true;
					}

					// allow just one event to fire
					e.stopPropagation();

					// https://developer.mozilla.org/en-US/docs/Web/Events/wheel
					_wheelDelta.x = 0;

					if ('deltaX' in e) {
						if (e.deltaMode === 1 /* DOM_DELTA_LINE */) {
								// 18 - average line height
								_wheelDelta.x = e.deltaX * 18;
								_wheelDelta.y = e.deltaY * 18;
							} else {
							_wheelDelta.x = e.deltaX;
							_wheelDelta.y = e.deltaY;
						}
					} else if ('wheelDelta' in e) {
						if (e.wheelDeltaX) {
							_wheelDelta.x = -0.16 * e.wheelDeltaX;
						}
						if (e.wheelDeltaY) {
							_wheelDelta.y = -0.16 * e.wheelDeltaY;
						} else {
							_wheelDelta.y = -0.16 * e.wheelDelta;
						}
					} else if ('detail' in e) {
						_wheelDelta.y = e.detail;
					} else {
						return;
					}

					_calculatePanBounds(_currZoomLevel, true);

					var newPanX = _panOffset.x - _wheelDelta.x,
					    newPanY = _panOffset.y - _wheelDelta.y;

					// only prevent scrolling in nonmodal mode when not at edges
					if (_options.modal || newPanX <= _currPanBounds.min.x && newPanX >= _currPanBounds.max.x && newPanY <= _currPanBounds.min.y && newPanY >= _currPanBounds.max.y) {
						e.preventDefault();
					}

					// TODO: use rAF instead of mousewheel?
					self.panTo(newPanX, newPanY);
				},

				toggleDesktopZoom: function toggleDesktopZoom(centerPoint) {
					centerPoint = centerPoint || { x: _viewportSize.x / 2 + _offset.x, y: _viewportSize.y / 2 + _offset.y };

					var doubleTapZoomLevel = _options.getDoubleTapZoom(true, self.currItem);
					var zoomOut = _currZoomLevel === doubleTapZoomLevel;

					self.mouseZoomedIn = !zoomOut;

					self.zoomTo(zoomOut ? self.currItem.initialZoomLevel : doubleTapZoomLevel, centerPoint, 333);
					framework[(!zoomOut ? 'add' : 'remove') + 'Class'](template, 'pswp--zoomed-in');
				}

			}
		});

		/*>>desktop-zoom*/

		/*>>history*/
		/**
   *
   * history.js:
   *
   * - Back button to close gallery.
   * 
   * - Unique URL for each slide: example.com/&pid=1&gid=3
   *   (where PID is picture index, and GID and gallery index)
   *   
   * - Switch URL when slides change.
   * 
   */

		var _historyDefaultOptions = {
			history: true,
			galleryUID: 1
		};

		var _historyUpdateTimeout,
		    _hashChangeTimeout,
		    _hashAnimCheckTimeout,
		    _hashChangedByScript,
		    _hashChangedByHistory,
		    _hashReseted,
		    _initialHash,
		    _historyChanged,
		    _closedFromURL,
		    _urlChangedOnce,
		    _windowLoc,
		    _supportsPushState,
		    _getHash = function _getHash() {
			return _windowLoc.hash.substring(1);
		},
		    _cleanHistoryTimeouts = function _cleanHistoryTimeouts() {

			if (_historyUpdateTimeout) {
				clearTimeout(_historyUpdateTimeout);
			}

			if (_hashAnimCheckTimeout) {
				clearTimeout(_hashAnimCheckTimeout);
			}
		},


		// pid - Picture index
		// gid - Gallery index
		_parseItemIndexFromURL = function _parseItemIndexFromURL() {
			var hash = _getHash(),
			    params = {};

			if (hash.length < 5) {
				// pid=1
				return params;
			}

			var i,
			    vars = hash.split('&');
			for (i = 0; i < vars.length; i++) {
				if (!vars[i]) {
					continue;
				}
				var pair = vars[i].split('=');
				if (pair.length < 2) {
					continue;
				}
				params[pair[0]] = pair[1];
			}
			if (_options.galleryPIDs) {
				// detect custom pid in hash and search for it among the items collection
				var searchfor = params.pid;
				params.pid = 0; // if custom pid cannot be found, fallback to the first item
				for (i = 0; i < _items.length; i++) {
					if (_items[i].pid === searchfor) {
						params.pid = i;
						break;
					}
				}
			} else {
				params.pid = parseInt(params.pid, 10) - 1;
			}
			if (params.pid < 0) {
				params.pid = 0;
			}
			return params;
		},
		    _updateHash = function _updateHash() {

			if (_hashAnimCheckTimeout) {
				clearTimeout(_hashAnimCheckTimeout);
			}

			if (_numAnimations || _isDragging) {
				// changing browser URL forces layout/paint in some browsers, which causes noticable lag during animation
				// that's why we update hash only when no animations running
				_hashAnimCheckTimeout = setTimeout(_updateHash, 500);
				return;
			}

			if (_hashChangedByScript) {
				clearTimeout(_hashChangeTimeout);
			} else {
				_hashChangedByScript = true;
			}

			var pid = _currentItemIndex + 1;
			var item = _getItemAt(_currentItemIndex);
			if (item.hasOwnProperty('pid')) {
				// carry forward any custom pid assigned to the item
				pid = item.pid;
			}
			var newHash = _initialHash + '&' + 'gid=' + _options.galleryUID + '&' + 'pid=' + pid;

			if (!_historyChanged) {
				if (_windowLoc.hash.indexOf(newHash) === -1) {
					_urlChangedOnce = true;
				}
				// first time - add new hisory record, then just replace
			}

			var newURL = _windowLoc.href.split('#')[0] + '#' + newHash;

			if (_supportsPushState) {

				if ('#' + newHash !== window.location.hash) {
					history[_historyChanged ? 'replaceState' : 'pushState']('', document.title, newURL);
				}
			} else {
				if (_historyChanged) {
					_windowLoc.replace(newURL);
				} else {
					_windowLoc.hash = newHash;
				}
			}

			_historyChanged = true;
			_hashChangeTimeout = setTimeout(function () {
				_hashChangedByScript = false;
			}, 60);
		};

		_registerModule('History', {

			publicMethods: {
				initHistory: function initHistory() {

					framework.extend(_options, _historyDefaultOptions, true);

					if (!_options.history) {
						return;
					}

					_windowLoc = window.location;
					_urlChangedOnce = false;
					_closedFromURL = false;
					_historyChanged = false;
					_initialHash = _getHash();
					_supportsPushState = 'pushState' in history;

					if (_initialHash.indexOf('gid=') > -1) {
						_initialHash = _initialHash.split('&gid=')[0];
						_initialHash = _initialHash.split('?gid=')[0];
					}

					_listen('afterChange', self.updateURL);
					_listen('unbindEvents', function () {
						framework.unbind(window, 'hashchange', self.onHashChange);
					});

					var returnToOriginal = function returnToOriginal() {
						_hashReseted = true;
						if (!_closedFromURL) {

							if (_urlChangedOnce) {
								history.back();
							} else {

								if (_initialHash) {
									_windowLoc.hash = _initialHash;
								} else {
									if (_supportsPushState) {

										// remove hash from url without refreshing it or scrolling to top
										history.pushState('', document.title, _windowLoc.pathname + _windowLoc.search);
									} else {
										_windowLoc.hash = '';
									}
								}
							}
						}

						_cleanHistoryTimeouts();
					};

					_listen('unbindEvents', function () {
						if (_closedByScroll) {
							// if PhotoSwipe is closed by scroll, we go "back" before the closing animation starts
							// this is done to keep the scroll position
							returnToOriginal();
						}
					});
					_listen('destroy', function () {
						if (!_hashReseted) {
							returnToOriginal();
						}
					});
					_listen('firstUpdate', function () {
						_currentItemIndex = _parseItemIndexFromURL().pid;
					});

					var index = _initialHash.indexOf('pid=');
					if (index > -1) {
						_initialHash = _initialHash.substring(0, index);
						if (_initialHash.slice(-1) === '&') {
							_initialHash = _initialHash.slice(0, -1);
						}
					}

					setTimeout(function () {
						if (_isOpen) {
							// hasn't destroyed yet
							framework.bind(window, 'hashchange', self.onHashChange);
						}
					}, 40);
				},
				onHashChange: function onHashChange() {

					if (_getHash() === _initialHash) {

						_closedFromURL = true;
						self.close();
						return;
					}
					if (!_hashChangedByScript) {

						_hashChangedByHistory = true;
						self.goTo(_parseItemIndexFromURL().pid);
						_hashChangedByHistory = false;
					}
				},
				updateURL: function updateURL() {

					// Delay the update of URL, to avoid lag during transition, 
					// and to not to trigger actions like "refresh page sound" or "blinking favicon" to often

					_cleanHistoryTimeouts();

					if (_hashChangedByHistory) {
						return;
					}

					if (!_historyChanged) {
						_updateHash(); // first time
					} else {
						_historyUpdateTimeout = setTimeout(_updateHash, 800);
					}
				}

			}
		});

		/*>>history*/
		framework.extend(self, publicMethods);
	};
	return PhotoSwipe;
});

},{}],4:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
Waypoints - 4.0.0
Copyright © 2011-2015 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blog/master/licenses.txt
*/
(function () {
  'use strict';

  var keyCounter = 0;
  var allWaypoints = {};

  /* http://imakewebthings.com/waypoints/api/waypoint */
  function Waypoint(options) {
    if (!options) {
      throw new Error('No options passed to Waypoint constructor');
    }
    if (!options.element) {
      throw new Error('No element option passed to Waypoint constructor');
    }
    if (!options.handler) {
      throw new Error('No handler option passed to Waypoint constructor');
    }

    this.key = 'waypoint-' + keyCounter;
    this.options = Waypoint.Adapter.extend({}, Waypoint.defaults, options);
    this.element = this.options.element;
    this.adapter = new Waypoint.Adapter(this.element);
    this.callback = options.handler;
    this.axis = this.options.horizontal ? 'horizontal' : 'vertical';
    this.enabled = this.options.enabled;
    this.triggerPoint = null;
    this.group = Waypoint.Group.findOrCreate({
      name: this.options.group,
      axis: this.axis
    });
    this.context = Waypoint.Context.findOrCreateByElement(this.options.context);

    if (Waypoint.offsetAliases[this.options.offset]) {
      this.options.offset = Waypoint.offsetAliases[this.options.offset];
    }
    this.group.add(this);
    this.context.add(this);
    allWaypoints[this.key] = this;
    keyCounter += 1;
  }

  /* Private */
  Waypoint.prototype.queueTrigger = function (direction) {
    this.group.queueTrigger(this, direction);
  };

  /* Private */
  Waypoint.prototype.trigger = function (args) {
    if (!this.enabled) {
      return;
    }
    if (this.callback) {
      this.callback.apply(this, args);
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/destroy */
  Waypoint.prototype.destroy = function () {
    this.context.remove(this);
    this.group.remove(this);
    delete allWaypoints[this.key];
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/disable */
  Waypoint.prototype.disable = function () {
    this.enabled = false;
    return this;
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/enable */
  Waypoint.prototype.enable = function () {
    this.context.refresh();
    this.enabled = true;
    return this;
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/next */
  Waypoint.prototype.next = function () {
    return this.group.next(this);
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/previous */
  Waypoint.prototype.previous = function () {
    return this.group.previous(this);
  };

  /* Private */
  Waypoint.invokeAll = function (method) {
    var allWaypointsArray = [];
    for (var waypointKey in allWaypoints) {
      allWaypointsArray.push(allWaypoints[waypointKey]);
    }
    for (var i = 0, end = allWaypointsArray.length; i < end; i++) {
      allWaypointsArray[i][method]();
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/destroy-all */
  Waypoint.destroyAll = function () {
    Waypoint.invokeAll('destroy');
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/disable-all */
  Waypoint.disableAll = function () {
    Waypoint.invokeAll('disable');
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/enable-all */
  Waypoint.enableAll = function () {
    Waypoint.invokeAll('enable');
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/refresh-all */
  Waypoint.refreshAll = function () {
    Waypoint.Context.refreshAll();
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/viewport-height */
  Waypoint.viewportHeight = function () {
    return window.innerHeight || document.documentElement.clientHeight;
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/viewport-width */
  Waypoint.viewportWidth = function () {
    return document.documentElement.clientWidth;
  };

  Waypoint.adapters = [];

  Waypoint.defaults = {
    context: window,
    continuous: true,
    enabled: true,
    group: 'default',
    horizontal: false,
    offset: 0
  };

  Waypoint.offsetAliases = {
    'bottom-in-view': function bottomInView() {
      return this.context.innerHeight() - this.adapter.outerHeight();
    },
    'right-in-view': function rightInView() {
      return this.context.innerWidth() - this.adapter.outerWidth();
    }
  };

  window.Waypoint = Waypoint;
})();(function () {
  'use strict';

  function requestAnimationFrameShim(callback) {
    window.setTimeout(callback, 1000 / 60);
  }

  var keyCounter = 0;
  var contexts = {};
  var Waypoint = window.Waypoint;
  var oldWindowLoad = window.onload;

  /* http://imakewebthings.com/waypoints/api/context */
  function Context(element) {
    this.element = element;
    this.Adapter = Waypoint.Adapter;
    this.adapter = new this.Adapter(element);
    this.key = 'waypoint-context-' + keyCounter;
    this.didScroll = false;
    this.didResize = false;
    this.oldScroll = {
      x: this.adapter.scrollLeft(),
      y: this.adapter.scrollTop()
    };
    this.waypoints = {
      vertical: {},
      horizontal: {}
    };

    element.waypointContextKey = this.key;
    contexts[element.waypointContextKey] = this;
    keyCounter += 1;

    this.createThrottledScrollHandler();
    this.createThrottledResizeHandler();
  }

  /* Private */
  Context.prototype.add = function (waypoint) {
    var axis = waypoint.options.horizontal ? 'horizontal' : 'vertical';
    this.waypoints[axis][waypoint.key] = waypoint;
    this.refresh();
  };

  /* Private */
  Context.prototype.checkEmpty = function () {
    var horizontalEmpty = this.Adapter.isEmptyObject(this.waypoints.horizontal);
    var verticalEmpty = this.Adapter.isEmptyObject(this.waypoints.vertical);
    if (horizontalEmpty && verticalEmpty) {
      this.adapter.off('.waypoints');
      delete contexts[this.key];
    }
  };

  /* Private */
  Context.prototype.createThrottledResizeHandler = function () {
    var self = this;

    function resizeHandler() {
      self.handleResize();
      self.didResize = false;
    }

    this.adapter.on('resize.waypoints', function () {
      if (!self.didResize) {
        self.didResize = true;
        Waypoint.requestAnimationFrame(resizeHandler);
      }
    });
  };

  /* Private */
  Context.prototype.createThrottledScrollHandler = function () {
    var self = this;
    function scrollHandler() {
      self.handleScroll();
      self.didScroll = false;
    }

    this.adapter.on('scroll.waypoints', function () {
      if (!self.didScroll || Waypoint.isTouch) {
        self.didScroll = true;
        Waypoint.requestAnimationFrame(scrollHandler);
      }
    });
  };

  /* Private */
  Context.prototype.handleResize = function () {
    Waypoint.Context.refreshAll();
  };

  /* Private */
  Context.prototype.handleScroll = function () {
    var triggeredGroups = {};
    var axes = {
      horizontal: {
        newScroll: this.adapter.scrollLeft(),
        oldScroll: this.oldScroll.x,
        forward: 'right',
        backward: 'left'
      },
      vertical: {
        newScroll: this.adapter.scrollTop(),
        oldScroll: this.oldScroll.y,
        forward: 'down',
        backward: 'up'
      }
    };

    for (var axisKey in axes) {
      var axis = axes[axisKey];
      var isForward = axis.newScroll > axis.oldScroll;
      var direction = isForward ? axis.forward : axis.backward;

      for (var waypointKey in this.waypoints[axisKey]) {
        var waypoint = this.waypoints[axisKey][waypointKey];
        var wasBeforeTriggerPoint = axis.oldScroll < waypoint.triggerPoint;
        var nowAfterTriggerPoint = axis.newScroll >= waypoint.triggerPoint;
        var crossedForward = wasBeforeTriggerPoint && nowAfterTriggerPoint;
        var crossedBackward = !wasBeforeTriggerPoint && !nowAfterTriggerPoint;
        if (crossedForward || crossedBackward) {
          waypoint.queueTrigger(direction);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        }
      }
    }

    for (var groupKey in triggeredGroups) {
      triggeredGroups[groupKey].flushTriggers();
    }

    this.oldScroll = {
      x: axes.horizontal.newScroll,
      y: axes.vertical.newScroll
    };
  };

  /* Private */
  Context.prototype.innerHeight = function () {
    /*eslint-disable eqeqeq */
    if (this.element == this.element.window) {
      return Waypoint.viewportHeight();
    }
    /*eslint-enable eqeqeq */
    return this.adapter.innerHeight();
  };

  /* Private */
  Context.prototype.remove = function (waypoint) {
    delete this.waypoints[waypoint.axis][waypoint.key];
    this.checkEmpty();
  };

  /* Private */
  Context.prototype.innerWidth = function () {
    /*eslint-disable eqeqeq */
    if (this.element == this.element.window) {
      return Waypoint.viewportWidth();
    }
    /*eslint-enable eqeqeq */
    return this.adapter.innerWidth();
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-destroy */
  Context.prototype.destroy = function () {
    var allWaypoints = [];
    for (var axis in this.waypoints) {
      for (var waypointKey in this.waypoints[axis]) {
        allWaypoints.push(this.waypoints[axis][waypointKey]);
      }
    }
    for (var i = 0, end = allWaypoints.length; i < end; i++) {
      allWaypoints[i].destroy();
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-refresh */
  Context.prototype.refresh = function () {
    /*eslint-disable eqeqeq */
    var isWindow = this.element == this.element.window;
    /*eslint-enable eqeqeq */
    var contextOffset = isWindow ? undefined : this.adapter.offset();
    var triggeredGroups = {};
    var axes;

    this.handleScroll();
    axes = {
      horizontal: {
        contextOffset: isWindow ? 0 : contextOffset.left,
        contextScroll: isWindow ? 0 : this.oldScroll.x,
        contextDimension: this.innerWidth(),
        oldScroll: this.oldScroll.x,
        forward: 'right',
        backward: 'left',
        offsetProp: 'left'
      },
      vertical: {
        contextOffset: isWindow ? 0 : contextOffset.top,
        contextScroll: isWindow ? 0 : this.oldScroll.y,
        contextDimension: this.innerHeight(),
        oldScroll: this.oldScroll.y,
        forward: 'down',
        backward: 'up',
        offsetProp: 'top'
      }
    };

    for (var axisKey in axes) {
      var axis = axes[axisKey];
      for (var waypointKey in this.waypoints[axisKey]) {
        var waypoint = this.waypoints[axisKey][waypointKey];
        var adjustment = waypoint.options.offset;
        var oldTriggerPoint = waypoint.triggerPoint;
        var elementOffset = 0;
        var freshWaypoint = oldTriggerPoint == null;
        var contextModifier, wasBeforeScroll, nowAfterScroll;
        var triggeredBackward, triggeredForward;

        if (waypoint.element !== waypoint.element.window) {
          elementOffset = waypoint.adapter.offset()[axis.offsetProp];
        }

        if (typeof adjustment === 'function') {
          adjustment = adjustment.apply(waypoint);
        } else if (typeof adjustment === 'string') {
          adjustment = parseFloat(adjustment);
          if (waypoint.options.offset.indexOf('%') > -1) {
            adjustment = Math.ceil(axis.contextDimension * adjustment / 100);
          }
        }

        contextModifier = axis.contextScroll - axis.contextOffset;
        waypoint.triggerPoint = elementOffset + contextModifier - adjustment;
        wasBeforeScroll = oldTriggerPoint < axis.oldScroll;
        nowAfterScroll = waypoint.triggerPoint >= axis.oldScroll;
        triggeredBackward = wasBeforeScroll && nowAfterScroll;
        triggeredForward = !wasBeforeScroll && !nowAfterScroll;

        if (!freshWaypoint && triggeredBackward) {
          waypoint.queueTrigger(axis.backward);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        } else if (!freshWaypoint && triggeredForward) {
          waypoint.queueTrigger(axis.forward);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        } else if (freshWaypoint && axis.oldScroll >= waypoint.triggerPoint) {
          waypoint.queueTrigger(axis.forward);
          triggeredGroups[waypoint.group.id] = waypoint.group;
        }
      }
    }

    Waypoint.requestAnimationFrame(function () {
      for (var groupKey in triggeredGroups) {
        triggeredGroups[groupKey].flushTriggers();
      }
    });

    return this;
  };

  /* Private */
  Context.findOrCreateByElement = function (element) {
    return Context.findByElement(element) || new Context(element);
  };

  /* Private */
  Context.refreshAll = function () {
    for (var contextId in contexts) {
      contexts[contextId].refresh();
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/context-find-by-element */
  Context.findByElement = function (element) {
    return contexts[element.waypointContextKey];
  };

  window.onload = function () {
    if (oldWindowLoad) {
      oldWindowLoad();
    }
    Context.refreshAll();
  };

  Waypoint.requestAnimationFrame = function (callback) {
    var requestFn = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || requestAnimationFrameShim;
    requestFn.call(window, callback);
  };
  Waypoint.Context = Context;
})();(function () {
  'use strict';

  function byTriggerPoint(a, b) {
    return a.triggerPoint - b.triggerPoint;
  }

  function byReverseTriggerPoint(a, b) {
    return b.triggerPoint - a.triggerPoint;
  }

  var groups = {
    vertical: {},
    horizontal: {}
  };
  var Waypoint = window.Waypoint;

  /* http://imakewebthings.com/waypoints/api/group */
  function Group(options) {
    this.name = options.name;
    this.axis = options.axis;
    this.id = this.name + '-' + this.axis;
    this.waypoints = [];
    this.clearTriggerQueues();
    groups[this.axis][this.name] = this;
  }

  /* Private */
  Group.prototype.add = function (waypoint) {
    this.waypoints.push(waypoint);
  };

  /* Private */
  Group.prototype.clearTriggerQueues = function () {
    this.triggerQueues = {
      up: [],
      down: [],
      left: [],
      right: []
    };
  };

  /* Private */
  Group.prototype.flushTriggers = function () {
    for (var direction in this.triggerQueues) {
      var waypoints = this.triggerQueues[direction];
      var reverse = direction === 'up' || direction === 'left';
      waypoints.sort(reverse ? byReverseTriggerPoint : byTriggerPoint);
      for (var i = 0, end = waypoints.length; i < end; i += 1) {
        var waypoint = waypoints[i];
        if (waypoint.options.continuous || i === waypoints.length - 1) {
          waypoint.trigger([direction]);
        }
      }
    }
    this.clearTriggerQueues();
  };

  /* Private */
  Group.prototype.next = function (waypoint) {
    this.waypoints.sort(byTriggerPoint);
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints);
    var isLast = index === this.waypoints.length - 1;
    return isLast ? null : this.waypoints[index + 1];
  };

  /* Private */
  Group.prototype.previous = function (waypoint) {
    this.waypoints.sort(byTriggerPoint);
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints);
    return index ? this.waypoints[index - 1] : null;
  };

  /* Private */
  Group.prototype.queueTrigger = function (waypoint, direction) {
    this.triggerQueues[direction].push(waypoint);
  };

  /* Private */
  Group.prototype.remove = function (waypoint) {
    var index = Waypoint.Adapter.inArray(waypoint, this.waypoints);
    if (index > -1) {
      this.waypoints.splice(index, 1);
    }
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/first */
  Group.prototype.first = function () {
    return this.waypoints[0];
  };

  /* Public */
  /* http://imakewebthings.com/waypoints/api/last */
  Group.prototype.last = function () {
    return this.waypoints[this.waypoints.length - 1];
  };

  /* Private */
  Group.findOrCreate = function (options) {
    return groups[options.axis][options.name] || new Group(options);
  };

  Waypoint.Group = Group;
})();(function () {
  'use strict';

  var Waypoint = window.Waypoint;

  function isWindow(element) {
    return element === element.window;
  }

  function getWindow(element) {
    if (isWindow(element)) {
      return element;
    }
    return element.defaultView;
  }

  function NoFrameworkAdapter(element) {
    this.element = element;
    this.handlers = {};
  }

  NoFrameworkAdapter.prototype.innerHeight = function () {
    var isWin = isWindow(this.element);
    return isWin ? this.element.innerHeight : this.element.clientHeight;
  };

  NoFrameworkAdapter.prototype.innerWidth = function () {
    var isWin = isWindow(this.element);
    return isWin ? this.element.innerWidth : this.element.clientWidth;
  };

  NoFrameworkAdapter.prototype.off = function (event, handler) {
    function removeListeners(element, listeners, handler) {
      for (var i = 0, end = listeners.length - 1; i < end; i++) {
        var listener = listeners[i];
        if (!handler || handler === listener) {
          element.removeEventListener(listener);
        }
      }
    }

    var eventParts = event.split('.');
    var eventType = eventParts[0];
    var namespace = eventParts[1];
    var element = this.element;

    if (namespace && this.handlers[namespace] && eventType) {
      removeListeners(element, this.handlers[namespace][eventType], handler);
      this.handlers[namespace][eventType] = [];
    } else if (eventType) {
      for (var ns in this.handlers) {
        removeListeners(element, this.handlers[ns][eventType] || [], handler);
        this.handlers[ns][eventType] = [];
      }
    } else if (namespace && this.handlers[namespace]) {
      for (var type in this.handlers[namespace]) {
        removeListeners(element, this.handlers[namespace][type], handler);
      }
      this.handlers[namespace] = {};
    }
  };

  /* Adapted from jQuery 1.x offset() */
  NoFrameworkAdapter.prototype.offset = function () {
    if (!this.element.ownerDocument) {
      return null;
    }

    var documentElement = this.element.ownerDocument.documentElement;
    var win = getWindow(this.element.ownerDocument);
    var rect = {
      top: 0,
      left: 0
    };

    if (this.element.getBoundingClientRect) {
      rect = this.element.getBoundingClientRect();
    }

    return {
      top: rect.top + win.pageYOffset - documentElement.clientTop,
      left: rect.left + win.pageXOffset - documentElement.clientLeft
    };
  };

  NoFrameworkAdapter.prototype.on = function (event, handler) {
    var eventParts = event.split('.');
    var eventType = eventParts[0];
    var namespace = eventParts[1] || '__default';
    var nsHandlers = this.handlers[namespace] = this.handlers[namespace] || {};
    var nsTypeList = nsHandlers[eventType] = nsHandlers[eventType] || [];

    nsTypeList.push(handler);
    this.element.addEventListener(eventType, handler);
  };

  NoFrameworkAdapter.prototype.outerHeight = function (includeMargin) {
    var height = this.innerHeight();
    var computedStyle;

    if (includeMargin && !isWindow(this.element)) {
      computedStyle = window.getComputedStyle(this.element);
      height += parseInt(computedStyle.marginTop, 10);
      height += parseInt(computedStyle.marginBottom, 10);
    }

    return height;
  };

  NoFrameworkAdapter.prototype.outerWidth = function (includeMargin) {
    var width = this.innerWidth();
    var computedStyle;

    if (includeMargin && !isWindow(this.element)) {
      computedStyle = window.getComputedStyle(this.element);
      width += parseInt(computedStyle.marginLeft, 10);
      width += parseInt(computedStyle.marginRight, 10);
    }

    return width;
  };

  NoFrameworkAdapter.prototype.scrollLeft = function () {
    var win = getWindow(this.element);
    return win ? win.pageXOffset : this.element.scrollLeft;
  };

  NoFrameworkAdapter.prototype.scrollTop = function () {
    var win = getWindow(this.element);
    return win ? win.pageYOffset : this.element.scrollTop;
  };

  NoFrameworkAdapter.extend = function () {
    var args = Array.prototype.slice.call(arguments);

    function merge(target, obj) {
      if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object' && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            target[key] = obj[key];
          }
        }
      }

      return target;
    }

    for (var i = 1, end = args.length; i < end; i++) {
      merge(args[0], args[i]);
    }
    return args[0];
  };

  NoFrameworkAdapter.inArray = function (element, array, i) {
    return array == null ? -1 : array.indexOf(element, i);
  };

  NoFrameworkAdapter.isEmptyObject = function (obj) {
    /* eslint no-unused-vars: 0 */
    for (var name in obj) {
      return false;
    }
    return true;
  };

  Waypoint.adapters.push({
    name: 'noframework',
    Adapter: NoFrameworkAdapter
  });
  Waypoint.Adapter = NoFrameworkAdapter;
})();
/*!
Waypoints Inview Shortcut - 4.0.0
Copyright © 2011-2015 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blob/master/licenses.txt
*/
(function () {
  'use strict';

  function noop() {}

  var Waypoint = window.Waypoint;

  /* http://imakewebthings.com/waypoints/shortcuts/inview */
  function Inview(options) {
    this.options = Waypoint.Adapter.extend({}, Inview.defaults, options);
    this.axis = this.options.horizontal ? 'horizontal' : 'vertical';
    this.waypoints = [];
    this.element = this.options.element;
    this.createWaypoints();
  }

  /* Private */
  Inview.prototype.createWaypoints = function () {
    var configs = {
      vertical: [{
        down: 'enter',
        up: 'exited',
        offset: '100%'
      }, {
        down: 'entered',
        up: 'exit',
        offset: 'bottom-in-view'
      }, {
        down: 'exit',
        up: 'entered',
        offset: 0
      }, {
        down: 'exited',
        up: 'enter',
        offset: function offset() {
          return -this.adapter.outerHeight();
        }
      }],
      horizontal: [{
        right: 'enter',
        left: 'exited',
        offset: '100%'
      }, {
        right: 'entered',
        left: 'exit',
        offset: 'right-in-view'
      }, {
        right: 'exit',
        left: 'entered',
        offset: 0
      }, {
        right: 'exited',
        left: 'enter',
        offset: function offset() {
          return -this.adapter.outerWidth();
        }
      }]
    };

    for (var i = 0, end = configs[this.axis].length; i < end; i++) {
      var config = configs[this.axis][i];
      this.createWaypoint(config);
    }
  };

  /* Private */
  Inview.prototype.createWaypoint = function (config) {
    var self = this;
    this.waypoints.push(new Waypoint({
      context: this.options.context,
      element: this.options.element,
      enabled: this.options.enabled,
      handler: function (config) {
        return function (direction) {
          self.options[config[direction]].call(self, direction);
        };
      }(config),
      offset: config.offset,
      horizontal: this.options.horizontal
    }));
  };

  /* Public */
  Inview.prototype.destroy = function () {
    for (var i = 0, end = this.waypoints.length; i < end; i++) {
      this.waypoints[i].destroy();
    }
    this.waypoints = [];
  };

  Inview.prototype.disable = function () {
    for (var i = 0, end = this.waypoints.length; i < end; i++) {
      this.waypoints[i].disable();
    }
  };

  Inview.prototype.enable = function () {
    for (var i = 0, end = this.waypoints.length; i < end; i++) {
      this.waypoints[i].enable();
    }
  };

  Inview.defaults = {
    context: window,
    enabled: true,
    enter: noop,
    entered: noop,
    exit: noop,
    exited: noop
  };

  Waypoint.Inview = Inview;
})();

},{}],5:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Zenscroll 3.0.1
 * https://github.com/zengabor/zenscroll/
 *
 * Copyright 2015–2016 Gabor Lenard
 *
 * This is free and unencumbered software released into the public domain.
 *
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 *
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * For more information, please refer to <http://unlicense.org>
 *
 */

/*jshint devel:true, asi:true */

/*global define, module */

(function (root, zenscroll) {
    if (typeof define === "function" && define.amd) {
        define([], zenscroll());
    } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === "object" && module.exports) {
        module.exports = zenscroll();
    } else {
        root.zenscroll = zenscroll();
    }
})(undefined, function () {
    "use strict";

    var createScroller = function createScroller(scrollContainer, defaultDuration, edgeOffset) {

        defaultDuration = defaultDuration || 999; //ms
        if (!edgeOffset || edgeOffset !== 0) {
            // When scrolling, this amount of distance is kept from the edges of the scrollContainer:
            edgeOffset = 9; //px
        }

        var scrollTimeoutId;
        var docElem = document.documentElement;

        // Detect if the browser already supports native smooth scrolling (e.g., Firefox 36+ and Chrome 49+) and it is enabled:
        var nativeSmoothScrollEnabled = function nativeSmoothScrollEnabled() {
            return "getComputedStyle" in window && window.getComputedStyle(scrollContainer ? scrollContainer : document.body)["scroll-behavior"] === "smooth";
        };

        var getScrollTop = function getScrollTop() {
            return scrollContainer ? scrollContainer.scrollTop : window.scrollY || docElem.scrollTop;
        };

        var getViewHeight = function getViewHeight() {
            return scrollContainer ? Math.min(scrollContainer.offsetHeight, window.innerHeight) : window.innerHeight || docElem.clientHeight;
        };

        var getRelativeTopOf = function getRelativeTopOf(elem) {
            if (scrollContainer) {
                return elem.offsetTop - scrollContainer.offsetTop;
            } else {
                return elem.getBoundingClientRect().top + getScrollTop() - docElem.offsetTop;
            }
        };

        /**
         * Immediately stops the current smooth scroll operation
         */
        var stopScroll = function stopScroll() {
            clearTimeout(scrollTimeoutId);
            scrollTimeoutId = 0;
        };

        /**
         * Scrolls to a specific vertical position in the document.
         *
         * @param {endY} The vertical position within the document.
         * @param {duration} Optionally the duration of the scroll operation.
         *        If 0 or not provided it is automatically calculated based on the
         *        distance and the default duration.
         */
        var scrollToY = function scrollToY(endY, duration) {
            stopScroll();
            if (nativeSmoothScrollEnabled()) {
                (scrollContainer || window).scrollTo(0, endY);
            } else {
                var startY = getScrollTop();
                var distance = Math.max(endY, 0) - startY;
                duration = duration || Math.min(Math.abs(distance), defaultDuration);
                var startTime = new Date().getTime();
                (function loopScroll() {
                    scrollTimeoutId = setTimeout(function () {
                        var p = Math.min((new Date().getTime() - startTime) / duration, 1); // percentage
                        var y = Math.max(Math.floor(startY + distance * (p < 0.5 ? 2 * p * p : p * (4 - p * 2) - 1)), 0);
                        if (scrollContainer) {
                            scrollContainer.scrollTop = y;
                        } else {
                            window.scrollTo(0, y);
                        }
                        if (p < 1 && getViewHeight() + y < (scrollContainer || docElem).scrollHeight) {
                            loopScroll();
                        } else {
                            setTimeout(stopScroll, 99); // with cooldown time
                        }
                    }, 9);
                })();
            }
        };

        /**
         * Scrolls to the top of a specific element.
         *
         * @param {elem} The element.
         * @param {duration} Optionally the duration of the scroll operation.
         *        A value of 0 is ignored.
         */
        var scrollToElem = function scrollToElem(elem, duration) {
            scrollToY(getRelativeTopOf(elem) - edgeOffset, duration);
        };

        /**
         * Scrolls an element into view if necessary.
         *
         * @param {elem} The element.
         * @param {duration} Optionally the duration of the scroll operation.
         *        A value of 0 is ignored.
         */
        var scrollIntoView = function scrollIntoView(elem, duration) {
            var elemScrollHeight = elem.getBoundingClientRect().height + 2 * edgeOffset;
            var vHeight = getViewHeight();
            var elemTop = getRelativeTopOf(elem);
            var elemBottom = elemTop + elemScrollHeight;
            var scrollTop = getScrollTop();
            if (elemTop - scrollTop < edgeOffset || elemScrollHeight > vHeight) {
                // Element is clipped at top or is higher than screen.
                scrollToElem(elem, duration);
            } else if (scrollTop + vHeight - elemBottom < edgeOffset) {
                // Element is clipped at the bottom.
                scrollToY(elemBottom - vHeight, duration);
            }
        };

        /**
         * Scrolls to the center of an element.
         *
         * @param {elem} The element.
         * @param {duration} Optionally the duration of the scroll operation.
         * @param {offset} Optionally the offset of the top of the element from the center of the screen.
         *        A value of 0 is ignored.
         */
        var scrollToCenterOf = function scrollToCenterOf(elem, duration, offset) {
            scrollToY(Math.max(getRelativeTopOf(elem) - getViewHeight() / 2 + (offset || elem.getBoundingClientRect().height / 2), 0), duration);
        };

        /**
         * Changes default settings for this scroller.
         *
         * @param {newDefaultDuration} New value for default duration, used for each scroll method by default.
         *        Ignored if 0 or falsy.
         * @param {newEdgeOffset} New value for the edge offset, used by each scroll method by default.
         */
        var setup = function setup(newDefaultDuration, newEdgeOffset) {
            if (newDefaultDuration) {
                defaultDuration = newDefaultDuration;
            }
            if (newEdgeOffset === 0 || newEdgeOffset) {
                edgeOffset = newEdgeOffset;
            }
        };

        return {
            setup: setup,
            to: scrollToElem,
            toY: scrollToY,
            intoView: scrollIntoView,
            center: scrollToCenterOf,
            stop: stopScroll,
            moving: function moving() {
                return !!scrollTimeoutId;
            }
        };
    };

    // Create a scroller for the browser window, omitting parameters:
    var defaultScroller = createScroller();

    // Create listeners for the documentElement only & exclude IE8-
    if ("addEventListener" in window && document.body.style.scrollBehavior !== "smooth" && !window.noZensmooth) {
        var replaceUrl = function replaceUrl(hash) {
            try {
                history.replaceState({}, "", window.location.href.split("#")[0] + hash);
            } catch (e) {
                // To avoid the Security exception in Chrome when the page was opened via the file protocol, e.g., file://index.html
            }
        };
        window.addEventListener("click", function (event) {
            var anchor = event.target;
            while (anchor && anchor.tagName !== "A") {
                anchor = anchor.parentNode;
            }
            if (!anchor || event.which !== 1 || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }
            var href = anchor.getAttribute("href") || "";
            if (href.indexOf("#") === 0) {
                if (href === "#") {
                    event.preventDefault(); // Prevent the browser from handling the activation of the link
                    defaultScroller.toY(0);
                    replaceUrl("");
                } else {
                    var targetId = anchor.hash.substring(1);
                    var targetElem = document.getElementById(targetId);
                    if (targetElem) {
                        event.preventDefault(); // Prevent the browser from handling the activation of the link
                        defaultScroller.to(targetElem);
                        replaceUrl("#" + targetId);
                    }
                }
            }
        }, false);
    }

    return {
        // Expose the "constructor" that can create a new scroller:
        createScroller: createScroller,
        // Surface the methods of the default scroller:
        setup: defaultScroller.setup,
        to: defaultScroller.to,
        toY: defaultScroller.toY,
        intoView: defaultScroller.intoView,
        center: defaultScroller.center,
        stop: defaultScroller.stop,
        moving: defaultScroller.moving
    };
});

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = PrimaryNav;
function PrimaryNav() {

    // cache dom elements
    var body = document.body,
        navTrigger = document.querySelector(".js-nav-trigger"),
        container = document.querySelector(".container"),
        primaryNav = document.querySelector(".js-primary-nav"),
        primaryNavLinks = document.querySelectorAll(".js-primary-nav a");

    // Flag that JS has loaded
    body.classList.remove("no-js");
    body.classList.add("js");

    // Hamburger menu
    navTrigger.addEventListener("click", function () {
        // toggle active class on the nav trigger
        this.classList.toggle("open");
        // toggle the active class on site container
        container.classList.toggle("js-nav-active");
    });

    // In-menu link click
    for (var i = 0; i < primaryNavLinks.length; i++) {
        var primaryNavLink = primaryNavLinks[i];
        primaryNavLink.onclick = function () {
            // toggle active class on the nav trigger
            navTrigger.classList.toggle("open");
            // immediately hide the nav
            primaryNav.style.opacity = "0";
            // once drawer has had time to pull up, restore opacity
            setTimeout(function () {
                primaryNav.style.opacity = "1";
            }, 1000);
            // toggle the active class on site container
            container.classList.toggle("js-nav-active");
        };
    }
};

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TimelineLoading;
function TimelineLoading() {

  var timelineBlocks = document.querySelectorAll(".cd-timeline-block");

  Array.prototype.forEach.call(timelineBlocks, function (el, i) {

    var waypoint = new Waypoint({
      element: el,
      handler: function handler() {
        el.classList.add('fadeInUp');
      },
      offset: '75%'
    });
  });
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJfanMtZXM2L2FwcC5qcyIsIl9qcy1lczYvbGlicy9waG90b3N3aXBlLXVpLWRlZmF1bHQuanMiLCJfanMtZXM2L2xpYnMvcGhvdG9zd2lwZS5qcyIsIl9qcy1lczYvbGlicy93YXlwb2ludHMuanMiLCJfanMtZXM2L2xpYnMvemVuc2Nyb2xsLmpzIiwiX2pzLWVzNi9tb2R1bGVzL3ByaW1hcnktbmF2LmpzIiwiX2pzLWVzNi9tb2R1bGVzL3RpbWVsaW5lLWxvYWRpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0NBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBR0E7Ozs7QUFHQTs7Ozs7O0FBRkE7O0FBRkE7QUFOQTs7QUFXQTs7QUFFQTtBQUNFLElBQUksd0JBQXdCLFNBQXhCLHFCQUF3QixDQUFTLGVBQVQsRUFBMEI7O0FBRWxELFFBQUkseUJBQXlCLFNBQXpCLHNCQUF5QixDQUFTLEVBQVQsRUFBYTtBQUN0QyxZQUFJLGdCQUFnQixHQUFHLFVBQXZCO0FBQUEsWUFDSSxXQUFXLGNBQWMsTUFEN0I7QUFBQSxZQUVJLFFBQVEsRUFGWjtBQUFBLFlBR0ksRUFISjtBQUFBLFlBSUksYUFKSjtBQUFBLFlBS0ksV0FMSjtBQUFBLFlBTUksSUFOSjtBQUFBLFlBT0ksSUFQSjs7QUFTQSxhQUFJLElBQUksSUFBSSxDQUFaLEVBQWUsSUFBSSxRQUFuQixFQUE2QixHQUE3QixFQUFrQztBQUM5QixpQkFBSyxjQUFjLENBQWQsQ0FBTDs7QUFFQTtBQUNBLGdCQUFHLEdBQUcsUUFBSCxLQUFnQixDQUFuQixFQUFzQjtBQUNwQjtBQUNEOztBQUVELDRCQUFnQixHQUFHLFFBQW5COztBQUVBLG1CQUFPLEdBQUcsWUFBSCxDQUFnQixXQUFoQixFQUE2QixLQUE3QixDQUFtQyxHQUFuQyxDQUFQOztBQUVBO0FBQ0EsbUJBQU87QUFDSCxxQkFBSyxHQUFHLFlBQUgsQ0FB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LHVCQUFXLFlBQVc7QUFBRSwyQkFBVyxLQUFYLENBQWlCLE9BQWpCLEdBQTBCLEdBQTFCO0FBQWdDLGFBQXhELEVBQTBELElBQTFEO0FBQ0E7QUFDQSxzQkFBVSxTQUFWLENBQW9CLE1BQXBCLENBQTJCLGVBQTNCO0FBQ0gsU0FURDtBQVVIO0FBRUo7Ozs7Ozs7O2tCQ3BDdUIsZTtBQUFULFNBQVMsZUFBVCxHQUEyQjs7QUFFMUMsTUFBSSxpQkFBaUIsU0FBUyxnQkFBVCxDQUEwQixvQkFBMUIsQ0FBckI7O0FBRUUsUUFBTSxTQUFOLENBQWdCLE9BQWhCLENBQXdCLElBQXhCLENBQTZCLGNBQTdCLEVBQTZDLFVBQVMsRUFBVCxFQUFhLENBQWIsRUFBZTs7QUFFMUQsUUFBSSxXQUFXLElBQUksUUFBSixDQUFhO0FBQzFCLGVBQVMsRUFEaUI7QUFFMUIsZUFBUyxtQkFBVztBQUNsQixXQUFHLFNBQUgsQ0FBYSxHQUFiLENBQWlCLFVBQWpCO0FBQ0QsT0FKeUI7QUFLMUIsY0FBUTtBQUxrQixLQUFiLENBQWY7QUFRRCxHQVZEO0FBV0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyBsaWJyYXJpZXNcbmltcG9ydCBaZW5TY3JvbGwgZnJvbSAnLi9saWJzL3plbnNjcm9sbCc7XG5pbXBvcnQgV2F5UG9pbnRzIGZyb20gJy4vbGlicy93YXlwb2ludHMnO1xuaW1wb3J0IFBob3RvU3dpcGUgZnJvbSAnLi9saWJzL3Bob3Rvc3dpcGUnO1xuaW1wb3J0IFBob3RvU3dpcGVVSV9EZWZhdWx0IGZyb20gJy4vbGlicy9waG90b3N3aXBlLXVpLWRlZmF1bHQnO1xuXG4vLyBtb2R1bGVzXG5pbXBvcnQgUHJpbWFyeU5hdiBmcm9tICcuL21vZHVsZXMvcHJpbWFyeS1uYXYnO1xuUHJpbWFyeU5hdigpO1xuXG5pbXBvcnQgVGltZWxpbmVMb2FkaW5nIGZyb20gJy4vbW9kdWxlcy90aW1lbGluZS1sb2FkaW5nJztcblRpbWVsaW5lTG9hZGluZygpO1xuXG4vLyBQaG90b3N3aXBlXG4gIHZhciBpbml0UGhvdG9Td2lwZUZyb21ET00gPSBmdW5jdGlvbihnYWxsZXJ5U2VsZWN0b3IpIHtcblxuICAgICAgdmFyIHBhcnNlVGh1bWJuYWlsRWxlbWVudHMgPSBmdW5jdGlvbihlbCkge1xuICAgICAgICAgIHZhciB0aHVtYkVsZW1lbnRzID0gZWwuY2hpbGROb2RlcyxcbiAgICAgICAgICAgICAgbnVtTm9kZXMgPSB0aHVtYkVsZW1lbnRzLmxlbmd0aCxcbiAgICAgICAgICAgICAgaXRlbXMgPSBbXSxcbiAgICAgICAgICAgICAgZWwsXG4gICAgICAgICAgICAgIGNoaWxkRWxlbWVudHMsXG4gICAgICAgICAgICAgIHRodW1ibmFpbEVsLFxuICAgICAgICAgICAgICBzaXplLFxuICAgICAgICAgICAgICBpdGVtO1xuXG4gICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG51bU5vZGVzOyBpKyspIHtcbiAgICAgICAgICAgICAgZWwgPSB0aHVtYkVsZW1lbnRzW2ldO1xuXG4gICAgICAgICAgICAgIC8vIGluY2x1ZGUgb25seSBlbGVtZW50IG5vZGVzXG4gICAgICAgICAgICAgIGlmKGVsLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjaGlsZEVsZW1lbnRzID0gZWwuY2hpbGRyZW47XG5cbiAgICAgICAgICAgICAgc2l6ZSA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1zaXplJykuc3BsaXQoJ3gnKTtcblxuICAgICAgICAgICAgICAvLyBjcmVhdGUgc2xpZGUgb2JqZWN0XG4gICAgICAgICAgICAgIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICBzcmM6IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpLFxuICAgICAgICAgICAgICAgICAgdzogcGFyc2VJbnQoc2l6ZVswXSwgMTApLFxuICAgICAgICAgICAgICAgICAgaDogcGFyc2VJbnQoc2l6ZVsxXSwgMTApLFxuICAgICAgICAgICAgICAgICAgYXV0aG9yOiBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYXV0aG9yJylcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBpdGVtLmVsID0gZWw7IC8vIHNhdmUgbGluayB0byBlbGVtZW50IGZvciBnZXRUaHVtYkJvdW5kc0ZuXG5cbiAgICAgICAgICAgICAgaWYoY2hpbGRFbGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5tc3JjID0gY2hpbGRFbGVtZW50c1swXS5nZXRBdHRyaWJ1dGUoJ3NyYycpOyAvLyB0aHVtYm5haWwgdXJsXG4gICAgICAgICAgICAgICAgaWYoY2hpbGRFbGVtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udGl0bGUgPSBjaGlsZEVsZW1lbnRzWzFdLmlubmVySFRNTDsgLy8gY2FwdGlvbiAoY29udGVudHMgb2YgZmlndXJlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgdmFyIG1lZGl1bVNyYyA9IGVsLmdldEF0dHJpYnV0ZSgnZGF0YS1tZWQnKTtcbiAgICAgICAgICAgICAgICBpZihtZWRpdW1TcmMpIHtcbiAgICAgICAgICAgICAgICAgIHNpemUgPSBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbWVkLXNpemUnKS5zcGxpdCgneCcpO1xuICAgICAgICAgICAgICAgICAgLy8gXCJtZWRpdW0tc2l6ZWRcIiBpbWFnZVxuICAgICAgICAgICAgICAgICAgaXRlbS5tID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiBtZWRpdW1TcmMsXG4gICAgICAgICAgICAgICAgICAgICAgICB3OiBwYXJzZUludChzaXplWzBdLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICBoOiBwYXJzZUludChzaXplWzFdLCAxMClcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIG9yaWdpbmFsIGltYWdlXG4gICAgICAgICAgICAgICAgaXRlbS5vID0ge1xuICAgICAgICAgICAgICAgICAgICBzcmM6IGl0ZW0uc3JjLFxuICAgICAgICAgICAgICAgICAgICB3OiBpdGVtLncsXG4gICAgICAgICAgICAgICAgICAgIGg6IGl0ZW0uaFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgaXRlbXMucHVzaChpdGVtKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICB9O1xuXG4gICAgICAvLyBmaW5kIG5lYXJlc3QgcGFyZW50IGVsZW1lbnRcbiAgICAgIHZhciBjbG9zZXN0ID0gZnVuY3Rpb24gY2xvc2VzdChlbCwgZm4pIHtcbiAgICAgICAgICByZXR1cm4gZWwgJiYgKCBmbihlbCkgPyBlbCA6IGNsb3Nlc3QoZWwucGFyZW50Tm9kZSwgZm4pICk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgb25UaHVtYm5haWxzQ2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQgPyBlLnByZXZlbnREZWZhdWx0KCkgOiBlLnJldHVyblZhbHVlID0gZmFsc2U7XG5cbiAgICAgICAgICB2YXIgZVRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcblxuICAgICAgICAgIHZhciBjbGlja2VkTGlzdEl0ZW0gPSBjbG9zZXN0KGVUYXJnZXQsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBlbC50YWdOYW1lID09PSAnQSc7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZighY2xpY2tlZExpc3RJdGVtKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgY2xpY2tlZEdhbGxlcnkgPSBjbGlja2VkTGlzdEl0ZW0ucGFyZW50Tm9kZTtcblxuICAgICAgICAgIHZhciBjaGlsZE5vZGVzID0gY2xpY2tlZExpc3RJdGVtLnBhcmVudE5vZGUuY2hpbGROb2RlcyxcbiAgICAgICAgICAgICAgbnVtQ2hpbGROb2RlcyA9IGNoaWxkTm9kZXMubGVuZ3RoLFxuICAgICAgICAgICAgICBub2RlSW5kZXggPSAwLFxuICAgICAgICAgICAgICBpbmRleDtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtQ2hpbGROb2RlczsgaSsrKSB7XG4gICAgICAgICAgICAgIGlmKGNoaWxkTm9kZXNbaV0ubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYoY2hpbGROb2Rlc1tpXSA9PT0gY2xpY2tlZExpc3RJdGVtKSB7XG4gICAgICAgICAgICAgICAgICBpbmRleCA9IG5vZGVJbmRleDtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG5vZGVJbmRleCsrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgb3BlblBob3RvU3dpcGUoIGluZGV4LCBjbGlja2VkR2FsbGVyeSApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuXG4gICAgICB2YXIgcGhvdG9zd2lwZVBhcnNlSGFzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpLFxuICAgICAgICAgIHBhcmFtcyA9IHt9O1xuXG4gICAgICAgICAgaWYoaGFzaC5sZW5ndGggPCA1KSB7IC8vIHBpZD0xXG4gICAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHZhcnMgPSBoYXNoLnNwbGl0KCcmJyk7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGlmKCF2YXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB2YXIgcGFpciA9IHZhcnNbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgICAgICAgaWYocGFpci5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBwYXJhbXNbcGFpclswXV0gPSBwYWlyWzFdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmKHBhcmFtcy5naWQpIHtcbiAgICAgICAgICAgICAgcGFyYW1zLmdpZCA9IHBhcnNlSW50KHBhcmFtcy5naWQsIDEwKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgfTtcblxuICAgICAgdmFyIG9wZW5QaG90b1N3aXBlID0gZnVuY3Rpb24oaW5kZXgsIGdhbGxlcnlFbGVtZW50LCBkaXNhYmxlQW5pbWF0aW9uLCBmcm9tVVJMKSB7XG4gICAgICAgICAgdmFyIHBzd3BFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnBzd3AnKVswXSxcbiAgICAgICAgICAgICAgZ2FsbGVyeSxcbiAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgaXRlbXM7XG5cbiAgICAgICAgICBpdGVtcyA9IHBhcnNlVGh1bWJuYWlsRWxlbWVudHMoZ2FsbGVyeUVsZW1lbnQpO1xuXG4gICAgICAgICAgLy8gZGVmaW5lIG9wdGlvbnMgKGlmIG5lZWRlZClcbiAgICAgICAgICBvcHRpb25zID0ge1xuXG4gICAgICAgICAgICAgIGdhbGxlcnlVSUQ6IGdhbGxlcnlFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1wc3dwLXVpZCcpLFxuXG4gICAgICAgICAgICAgIGdldFRodW1iQm91bmRzRm46IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAvLyBTZWUgT3B0aW9ucy0+Z2V0VGh1bWJCb3VuZHNGbiBzZWN0aW9uIG9mIGRvY3MgZm9yIG1vcmUgaW5mb1xuICAgICAgICAgICAgICAgICAgdmFyIHRodW1ibmFpbCA9IGl0ZW1zW2luZGV4XS5lbC5jaGlsZHJlblswXSxcbiAgICAgICAgICAgICAgICAgICAgICBwYWdlWVNjcm9sbCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wLFxuICAgICAgICAgICAgICAgICAgICAgIHJlY3QgPSB0aHVtYm5haWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgICAgICAgIHJldHVybiB7eDpyZWN0LmxlZnQsIHk6cmVjdC50b3AgKyBwYWdlWVNjcm9sbCwgdzpyZWN0LndpZHRofTtcbiAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICBhZGRDYXB0aW9uSFRNTEZuOiBmdW5jdGlvbihpdGVtLCBjYXB0aW9uRWwsIGlzRmFrZSkge1xuICAgICAgICAgICAgICAgICAgaWYoIWl0ZW0udGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXB0aW9uRWwuY2hpbGRyZW5bMF0uaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgY2FwdGlvbkVsLmNoaWxkcmVuWzBdLmlubmVySFRNTCA9IGl0ZW0udGl0bGUgKyAgJzxici8+PHNtYWxsPlBob3RvOiAnICsgaXRlbS5hdXRob3IgKyAnPC9zbWFsbD4nO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgIH07XG5cblxuICAgICAgICAgIGlmKGZyb21VUkwpIHtcbiAgICAgICAgICAgICAgaWYob3B0aW9ucy5nYWxsZXJ5UElEcykge1xuICAgICAgICAgICAgICAgICAgLy8gcGFyc2UgcmVhbCBpbmRleCB3aGVuIGN1c3RvbSBQSURzIGFyZSB1c2VkXG4gICAgICAgICAgICAgICAgICAvLyBodHRwOi8vcGhvdG9zd2lwZS5jb20vZG9jdW1lbnRhdGlvbi9mYXEuaHRtbCNjdXN0b20tcGlkLWluLXVybFxuICAgICAgICAgICAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IGl0ZW1zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoaXRlbXNbal0ucGlkID09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuaW5kZXggPSBqO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBvcHRpb25zLmluZGV4ID0gcGFyc2VJbnQoaW5kZXgsIDEwKSAtIDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBvcHRpb25zLmluZGV4ID0gcGFyc2VJbnQoaW5kZXgsIDEwKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBleGl0IGlmIGluZGV4IG5vdCBmb3VuZFxuICAgICAgICAgIGlmKCBpc05hTihvcHRpb25zLmluZGV4KSApIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmKGRpc2FibGVBbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgb3B0aW9ucy5zaG93QW5pbWF0aW9uRHVyYXRpb24gPSAwO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFBhc3MgZGF0YSB0byBQaG90b1N3aXBlIGFuZCBpbml0aWFsaXplIGl0XG4gICAgICAgICAgZ2FsbGVyeSA9IG5ldyBQaG90b1N3aXBlKCBwc3dwRWxlbWVudCwgUGhvdG9Td2lwZVVJX0RlZmF1bHQsIGl0ZW1zLCBvcHRpb25zKTtcblxuICAgICAgICAgIC8vIHNlZTogaHR0cDovL3Bob3Rvc3dpcGUuY29tL2RvY3VtZW50YXRpb24vcmVzcG9uc2l2ZS1pbWFnZXMuaHRtbFxuICAgICAgICAgIHZhciByZWFsVmlld3BvcnRXaWR0aCxcbiAgICAgICAgICAgICAgdXNlTGFyZ2VJbWFnZXMgPSBmYWxzZSxcbiAgICAgICAgICAgICAgZmlyc3RSZXNpemUgPSB0cnVlLFxuICAgICAgICAgICAgICBpbWFnZVNyY1dpbGxDaGFuZ2U7XG5cbiAgICAgICAgICBnYWxsZXJ5Lmxpc3RlbignYmVmb3JlUmVzaXplJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgdmFyIGRwaVJhdGlvID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gPyB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA6IDE7XG4gICAgICAgICAgICAgIGRwaVJhdGlvID0gTWF0aC5taW4oZHBpUmF0aW8sIDIuNSk7XG4gICAgICAgICAgICAgIHJlYWxWaWV3cG9ydFdpZHRoID0gZ2FsbGVyeS52aWV3cG9ydFNpemUueCAqIGRwaVJhdGlvO1xuXG5cbiAgICAgICAgICAgICAgaWYocmVhbFZpZXdwb3J0V2lkdGggPj0gMTIwMCB8fCAoIWdhbGxlcnkubGlrZWx5VG91Y2hEZXZpY2UgJiYgcmVhbFZpZXdwb3J0V2lkdGggPiA4MDApIHx8IHNjcmVlbi53aWR0aCA+IDEyMDAgKSB7XG4gICAgICAgICAgICAgICAgICBpZighdXNlTGFyZ2VJbWFnZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICB1c2VMYXJnZUltYWdlcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgaW1hZ2VTcmNXaWxsQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWYodXNlTGFyZ2VJbWFnZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICB1c2VMYXJnZUltYWdlcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgIGltYWdlU3JjV2lsbENoYW5nZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZihpbWFnZVNyY1dpbGxDaGFuZ2UgJiYgIWZpcnN0UmVzaXplKSB7XG4gICAgICAgICAgICAgICAgICBnYWxsZXJ5LmludmFsaWRhdGVDdXJySXRlbXMoKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmKGZpcnN0UmVzaXplKSB7XG4gICAgICAgICAgICAgICAgICBmaXJzdFJlc2l6ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaW1hZ2VTcmNXaWxsQ2hhbmdlID0gZmFsc2U7XG5cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGdhbGxlcnkubGlzdGVuKCdnZXR0aW5nRGF0YScsIGZ1bmN0aW9uKGluZGV4LCBpdGVtKSB7XG4gICAgICAgICAgICAgIGlmKCB1c2VMYXJnZUltYWdlcyApIHtcbiAgICAgICAgICAgICAgICAgIGl0ZW0uc3JjID0gaXRlbS5vLnNyYztcbiAgICAgICAgICAgICAgICAgIGl0ZW0udyA9IGl0ZW0uby53O1xuICAgICAgICAgICAgICAgICAgaXRlbS5oID0gaXRlbS5vLmg7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBpdGVtLnNyYyA9IGl0ZW0ubS5zcmM7XG4gICAgICAgICAgICAgICAgICBpdGVtLncgPSBpdGVtLm0udztcbiAgICAgICAgICAgICAgICAgIGl0ZW0uaCA9IGl0ZW0ubS5oO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBnYWxsZXJ5LmluaXQoKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIHNlbGVjdCBhbGwgZ2FsbGVyeSBlbGVtZW50c1xuICAgICAgdmFyIGdhbGxlcnlFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIGdhbGxlcnlTZWxlY3RvciApO1xuICAgICAgZm9yKHZhciBpID0gMCwgbCA9IGdhbGxlcnlFbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICBnYWxsZXJ5RWxlbWVudHNbaV0uc2V0QXR0cmlidXRlKCdkYXRhLXBzd3AtdWlkJywgaSsxKTtcbiAgICAgICAgICBnYWxsZXJ5RWxlbWVudHNbaV0ub25jbGljayA9IG9uVGh1bWJuYWlsc0NsaWNrO1xuICAgICAgfVxuXG4gICAgICAvLyBQYXJzZSBVUkwgYW5kIG9wZW4gZ2FsbGVyeSBpZiBpdCBjb250YWlucyAjJnBpZD0zJmdpZD0xXG4gICAgICB2YXIgaGFzaERhdGEgPSBwaG90b3N3aXBlUGFyc2VIYXNoKCk7XG4gICAgICBpZihoYXNoRGF0YS5waWQgJiYgaGFzaERhdGEuZ2lkKSB7XG4gICAgICAgICAgb3BlblBob3RvU3dpcGUoIGhhc2hEYXRhLnBpZCwgIGdhbGxlcnlFbGVtZW50c1sgaGFzaERhdGEuZ2lkIC0gMSBdLCB0cnVlLCB0cnVlICk7XG4gICAgICB9XG4gIH07XG5cbiAgaW5pdFBob3RvU3dpcGVGcm9tRE9NKCcuZ2FsbGVyeScpO1xuIiwiLyohIFBob3RvU3dpcGUgRGVmYXVsdCBVSSAtIDQuMS4xIC0gMjAxNS0xMi0yNFxuKiBodHRwOi8vcGhvdG9zd2lwZS5jb21cbiogQ29weXJpZ2h0IChjKSAyMDE1IERtaXRyeSBTZW1lbm92OyAqL1xuLyoqXG4qXG4qIFVJIG9uIHRvcCBvZiBtYWluIHNsaWRpbmcgYXJlYSAoY2FwdGlvbiwgYXJyb3dzLCBjbG9zZSBidXR0b24sIGV0Yy4pLlxuKiBCdWlsdCBqdXN0IHVzaW5nIHB1YmxpYyBtZXRob2RzL3Byb3BlcnRpZXMgb2YgUGhvdG9Td2lwZS5cbipcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmYWN0b3J5KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICByb290LlBob3RvU3dpcGVVSV9EZWZhdWx0ID0gZmFjdG9yeSgpO1xuICB9XG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG5cblxudmFyIFBob3RvU3dpcGVVSV9EZWZhdWx0ID1cbiBmdW5jdGlvbihwc3dwLCBmcmFtZXdvcmspIHtcblxuICB2YXIgdWkgPSB0aGlzO1xuICB2YXIgX292ZXJsYXlVSVVwZGF0ZWQgPSBmYWxzZSxcbiAgICBfY29udHJvbHNWaXNpYmxlID0gdHJ1ZSxcbiAgICBfZnVsbHNjcmVuQVBJLFxuICAgIF9jb250cm9scyxcbiAgICBfY2FwdGlvbkNvbnRhaW5lcixcbiAgICBfZmFrZUNhcHRpb25Db250YWluZXIsXG4gICAgX2luZGV4SW5kaWNhdG9yLFxuICAgIF9zaGFyZUJ1dHRvbixcbiAgICBfc2hhcmVNb2RhbCxcbiAgICBfc2hhcmVNb2RhbEhpZGRlbiA9IHRydWUsXG4gICAgX2luaXRhbENsb3NlT25TY3JvbGxWYWx1ZSxcbiAgICBfaXNJZGxlLFxuICAgIF9saXN0ZW4sXG5cbiAgICBfbG9hZGluZ0luZGljYXRvcixcbiAgICBfbG9hZGluZ0luZGljYXRvckhpZGRlbixcbiAgICBfbG9hZGluZ0luZGljYXRvclRpbWVvdXQsXG5cbiAgICBfZ2FsbGVyeUhhc09uZVNsaWRlLFxuXG4gICAgX29wdGlvbnMsXG4gICAgX2RlZmF1bHRVSU9wdGlvbnMgPSB7XG4gICAgICBiYXJzU2l6ZToge3RvcDo0NCwgYm90dG9tOidhdXRvJ30sXG4gICAgICBjbG9zZUVsQ2xhc3NlczogWydpdGVtJywgJ2NhcHRpb24nLCAnem9vbS13cmFwJywgJ3VpJywgJ3RvcC1iYXInXSxcbiAgICAgIHRpbWVUb0lkbGU6IDQwMDAsXG4gICAgICB0aW1lVG9JZGxlT3V0c2lkZTogMTAwMCxcbiAgICAgIGxvYWRpbmdJbmRpY2F0b3JEZWxheTogMTAwMCwgLy8gMnNcblxuICAgICAgYWRkQ2FwdGlvbkhUTUxGbjogZnVuY3Rpb24oaXRlbSwgY2FwdGlvbkVsIC8qLCBpc0Zha2UgKi8pIHtcbiAgICAgICAgaWYoIWl0ZW0udGl0bGUpIHtcbiAgICAgICAgICBjYXB0aW9uRWwuY2hpbGRyZW5bMF0uaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNhcHRpb25FbC5jaGlsZHJlblswXS5pbm5lckhUTUwgPSBpdGVtLnRpdGxlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG5cbiAgICAgIGNsb3NlRWw6dHJ1ZSxcbiAgICAgIGNhcHRpb25FbDogdHJ1ZSxcbiAgICAgIGZ1bGxzY3JlZW5FbDogdHJ1ZSxcbiAgICAgIHpvb21FbDogdHJ1ZSxcbiAgICAgIHNoYXJlRWw6IHRydWUsXG4gICAgICBjb3VudGVyRWw6IHRydWUsXG4gICAgICBhcnJvd0VsOiB0cnVlLFxuICAgICAgcHJlbG9hZGVyRWw6IHRydWUsXG5cbiAgICAgIHRhcFRvQ2xvc2U6IGZhbHNlLFxuICAgICAgdGFwVG9Ub2dnbGVDb250cm9sczogdHJ1ZSxcblxuICAgICAgY2xpY2tUb0Nsb3NlTm9uWm9vbWFibGU6IHRydWUsXG5cbiAgICAgIHNoYXJlQnV0dG9uczogW1xuICAgICAgICB7aWQ6J2ZhY2Vib29rJywgbGFiZWw6J1NoYXJlIG9uIEZhY2Vib29rJywgdXJsOidodHRwczovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyL3NoYXJlci5waHA/dT17e3VybH19J30sXG4gICAgICAgIHtpZDondHdpdHRlcicsIGxhYmVsOidUd2VldCcsIHVybDonaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/dGV4dD17e3RleHR9fSZ1cmw9e3t1cmx9fSd9LFxuICAgICAgICB7aWQ6J2Rvd25sb2FkJywgbGFiZWw6J0Rvd25sb2FkIGltYWdlJywgdXJsOid7e3Jhd19pbWFnZV91cmx9fScsIGRvd25sb2FkOnRydWV9XG4gICAgICBdLFxuICAgICAgZ2V0SW1hZ2VVUkxGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcbiAgICAgICAgcmV0dXJuIHBzd3AuY3Vyckl0ZW0uc3JjIHx8ICcnO1xuICAgICAgfSxcbiAgICAgIGdldFBhZ2VVUkxGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgfSxcbiAgICAgIGdldFRleHRGb3JTaGFyZTogZnVuY3Rpb24oIC8qIHNoYXJlQnV0dG9uRGF0YSAqLyApIHtcbiAgICAgICAgcmV0dXJuIHBzd3AuY3Vyckl0ZW0udGl0bGUgfHwgJyc7XG4gICAgICB9LFxuXG4gICAgICBpbmRleEluZGljYXRvclNlcDogJyAvICcsXG4gICAgICBmaXRDb250cm9sc1dpZHRoOiAxMjAwXG5cbiAgICB9LFxuICAgIF9ibG9ja0NvbnRyb2xzVGFwLFxuICAgIF9ibG9ja0NvbnRyb2xzVGFwVGltZW91dDtcblxuXG5cbiAgdmFyIF9vbkNvbnRyb2xzVGFwID0gZnVuY3Rpb24oZSkge1xuICAgICAgaWYoX2Jsb2NrQ29udHJvbHNUYXApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cblxuICAgICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuXG4gICAgICBpZihfb3B0aW9ucy50aW1lVG9JZGxlICYmIF9vcHRpb25zLm1vdXNlVXNlZCAmJiAhX2lzSWRsZSkge1xuICAgICAgICAvLyByZXNldCBpZGxlIHRpbWVyXG4gICAgICAgIF9vbklkbGVNb3VzZU1vdmUoKTtcbiAgICAgIH1cblxuXG4gICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50LFxuICAgICAgICB1aUVsZW1lbnQsXG4gICAgICAgIGNsaWNrZWRDbGFzcyA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykgfHwgJycsXG4gICAgICAgIGZvdW5kO1xuXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgX3VpRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdWlFbGVtZW50ID0gX3VpRWxlbWVudHNbaV07XG4gICAgICAgIGlmKHVpRWxlbWVudC5vblRhcCAmJiBjbGlja2VkQ2xhc3MuaW5kZXhPZigncHN3cF9fJyArIHVpRWxlbWVudC5uYW1lICkgPiAtMSApIHtcbiAgICAgICAgICB1aUVsZW1lbnQub25UYXAoKTtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG5cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihmb3VuZCkge1xuICAgICAgICBpZihlLnN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgX2Jsb2NrQ29udHJvbHNUYXAgPSB0cnVlO1xuXG4gICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgQW5kcm9pZCBkb24ndCBwcmV2ZW50IGdob3N0IGNsaWNrIGV2ZW50XG4gICAgICAgIC8vIHdoZW4gcHJldmVudERlZmF1bHQoKSB3YXMgY2FsbGVkIG9uIHRvdWNoc3RhcnQgYW5kL29yIHRvdWNoZW5kLlxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGlzIGhhcHBlbnMgb24gdjQuMywgNC4yLCA0LjEsXG4gICAgICAgIC8vIG9sZGVyIHZlcnNpb25zIHN0cmFuZ2VseSB3b3JrIGNvcnJlY3RseSxcbiAgICAgICAgLy8gYnV0IGp1c3QgaW4gY2FzZSB3ZSBhZGQgZGVsYXkgb24gYWxsIG9mIHRoZW0pXG4gICAgICAgIHZhciB0YXBEZWxheSA9IGZyYW1ld29yay5mZWF0dXJlcy5pc09sZEFuZHJvaWQgPyA2MDAgOiAzMDtcbiAgICAgICAgX2Jsb2NrQ29udHJvbHNUYXBUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBfYmxvY2tDb250cm9sc1RhcCA9IGZhbHNlO1xuICAgICAgICB9LCB0YXBEZWxheSk7XG4gICAgICB9XG5cbiAgICB9LFxuICAgIF9maXRDb250cm9sc0luVmlld3BvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhcHN3cC5saWtlbHlUb3VjaERldmljZSB8fCBfb3B0aW9ucy5tb3VzZVVzZWQgfHwgc2NyZWVuLndpZHRoID4gX29wdGlvbnMuZml0Q29udHJvbHNXaWR0aDtcbiAgICB9LFxuICAgIF90b2dnbGVQc3dwQ2xhc3MgPSBmdW5jdGlvbihlbCwgY05hbWUsIGFkZCkge1xuICAgICAgZnJhbWV3b3JrWyAoYWRkID8gJ2FkZCcgOiAncmVtb3ZlJykgKyAnQ2xhc3MnIF0oZWwsICdwc3dwX18nICsgY05hbWUpO1xuICAgIH0sXG5cbiAgICAvLyBhZGQgY2xhc3Mgd2hlbiB0aGVyZSBpcyBqdXN0IG9uZSBpdGVtIGluIHRoZSBnYWxsZXJ5XG4gICAgLy8gKGJ5IGRlZmF1bHQgaXQgaGlkZXMgbGVmdC9yaWdodCBhcnJvd3MgYW5kIDFvZlggY291bnRlcilcbiAgICBfY291bnROdW1JdGVtcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGhhc09uZVNsaWRlID0gKF9vcHRpb25zLmdldE51bUl0ZW1zRm4oKSA9PT0gMSk7XG5cbiAgICAgIGlmKGhhc09uZVNsaWRlICE9PSBfZ2FsbGVyeUhhc09uZVNsaWRlKSB7XG4gICAgICAgIF90b2dnbGVQc3dwQ2xhc3MoX2NvbnRyb2xzLCAndWktLW9uZS1zbGlkZScsIGhhc09uZVNsaWRlKTtcbiAgICAgICAgX2dhbGxlcnlIYXNPbmVTbGlkZSA9IGhhc09uZVNsaWRlO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3RvZ2dsZVNoYXJlTW9kYWxDbGFzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgX3RvZ2dsZVBzd3BDbGFzcyhfc2hhcmVNb2RhbCwgJ3NoYXJlLW1vZGFsLS1oaWRkZW4nLCBfc2hhcmVNb2RhbEhpZGRlbik7XG4gICAgfSxcbiAgICBfdG9nZ2xlU2hhcmVNb2RhbCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICBfc2hhcmVNb2RhbEhpZGRlbiA9ICFfc2hhcmVNb2RhbEhpZGRlbjtcblxuXG4gICAgICBpZighX3NoYXJlTW9kYWxIaWRkZW4pIHtcbiAgICAgICAgX3RvZ2dsZVNoYXJlTW9kYWxDbGFzcygpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xuICAgICAgICAgICAgZnJhbWV3b3JrLmFkZENsYXNzKF9zaGFyZU1vZGFsLCAncHN3cF9fc2hhcmUtbW9kYWwtLWZhZGUtaW4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDMwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhfc2hhcmVNb2RhbCwgJ3Bzd3BfX3NoYXJlLW1vZGFsLS1mYWRlLWluJyk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYoX3NoYXJlTW9kYWxIaWRkZW4pIHtcbiAgICAgICAgICAgIF90b2dnbGVTaGFyZU1vZGFsQ2xhc3MoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDMwMCk7XG4gICAgICB9XG5cbiAgICAgIGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xuICAgICAgICBfdXBkYXRlU2hhcmVVUkxzKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIF9vcGVuV2luZG93UG9wdXAgPSBmdW5jdGlvbihlKSB7XG4gICAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG4gICAgICBwc3dwLnNob3V0KCdzaGFyZUxpbmtDbGljaycsIGUsIHRhcmdldCk7XG5cbiAgICAgIGlmKCF0YXJnZXQuaHJlZikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKCB0YXJnZXQuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpICkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgd2luZG93Lm9wZW4odGFyZ2V0LmhyZWYsICdwc3dwX3NoYXJlJywgJ3Njcm9sbGJhcnM9eWVzLHJlc2l6YWJsZT15ZXMsdG9vbGJhcj1ubywnK1xuICAgICAgICAgICAgICAgICAgICAnbG9jYXRpb249eWVzLHdpZHRoPTU1MCxoZWlnaHQ9NDIwLHRvcD0xMDAsbGVmdD0nICtcbiAgICAgICAgICAgICAgICAgICAgKHdpbmRvdy5zY3JlZW4gPyBNYXRoLnJvdW5kKHNjcmVlbi53aWR0aCAvIDIgLSAyNzUpIDogMTAwKSAgKTtcblxuICAgICAgaWYoIV9zaGFyZU1vZGFsSGlkZGVuKSB7XG4gICAgICAgIF90b2dnbGVTaGFyZU1vZGFsKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIF91cGRhdGVTaGFyZVVSTHMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzaGFyZUJ1dHRvbk91dCA9ICcnLFxuICAgICAgICBzaGFyZUJ1dHRvbkRhdGEsXG4gICAgICAgIHNoYXJlVVJMLFxuICAgICAgICBpbWFnZV91cmwsXG4gICAgICAgIHBhZ2VfdXJsLFxuICAgICAgICBzaGFyZV90ZXh0O1xuXG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgX29wdGlvbnMuc2hhcmVCdXR0b25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNoYXJlQnV0dG9uRGF0YSA9IF9vcHRpb25zLnNoYXJlQnV0dG9uc1tpXTtcblxuICAgICAgICBpbWFnZV91cmwgPSBfb3B0aW9ucy5nZXRJbWFnZVVSTEZvclNoYXJlKHNoYXJlQnV0dG9uRGF0YSk7XG4gICAgICAgIHBhZ2VfdXJsID0gX29wdGlvbnMuZ2V0UGFnZVVSTEZvclNoYXJlKHNoYXJlQnV0dG9uRGF0YSk7XG4gICAgICAgIHNoYXJlX3RleHQgPSBfb3B0aW9ucy5nZXRUZXh0Rm9yU2hhcmUoc2hhcmVCdXR0b25EYXRhKTtcblxuICAgICAgICBzaGFyZVVSTCA9IHNoYXJlQnV0dG9uRGF0YS51cmwucmVwbGFjZSgne3t1cmx9fScsIGVuY29kZVVSSUNvbXBvbmVudChwYWdlX3VybCkgKVxuICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoJ3t7aW1hZ2VfdXJsfX0nLCBlbmNvZGVVUklDb21wb25lbnQoaW1hZ2VfdXJsKSApXG4gICAgICAgICAgICAgICAgICAucmVwbGFjZSgne3tyYXdfaW1hZ2VfdXJsfX0nLCBpbWFnZV91cmwgKVxuICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoJ3t7dGV4dH19JywgZW5jb2RlVVJJQ29tcG9uZW50KHNoYXJlX3RleHQpICk7XG5cbiAgICAgICAgc2hhcmVCdXR0b25PdXQgKz0gJzxhIGhyZWY9XCInICsgc2hhcmVVUkwgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgJytcbiAgICAgICAgICAgICAgICAgICdjbGFzcz1cInBzd3BfX3NoYXJlLS0nICsgc2hhcmVCdXR0b25EYXRhLmlkICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAoc2hhcmVCdXR0b25EYXRhLmRvd25sb2FkID8gJ2Rvd25sb2FkJyA6ICcnKSArICc+JyArXG4gICAgICAgICAgICAgICAgICBzaGFyZUJ1dHRvbkRhdGEubGFiZWwgKyAnPC9hPic7XG5cbiAgICAgICAgaWYoX29wdGlvbnMucGFyc2VTaGFyZUJ1dHRvbk91dCkge1xuICAgICAgICAgIHNoYXJlQnV0dG9uT3V0ID0gX29wdGlvbnMucGFyc2VTaGFyZUJ1dHRvbk91dChzaGFyZUJ1dHRvbkRhdGEsIHNoYXJlQnV0dG9uT3V0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX3NoYXJlTW9kYWwuY2hpbGRyZW5bMF0uaW5uZXJIVE1MID0gc2hhcmVCdXR0b25PdXQ7XG4gICAgICBfc2hhcmVNb2RhbC5jaGlsZHJlblswXS5vbmNsaWNrID0gX29wZW5XaW5kb3dQb3B1cDtcblxuICAgIH0sXG4gICAgX2hhc0Nsb3NlQ2xhc3MgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgIGZvcih2YXIgIGkgPSAwOyBpIDwgX29wdGlvbnMuY2xvc2VFbENsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYoIGZyYW1ld29yay5oYXNDbGFzcyh0YXJnZXQsICdwc3dwX18nICsgX29wdGlvbnMuY2xvc2VFbENsYXNzZXNbaV0pICkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBfaWRsZUludGVydmFsLFxuICAgIF9pZGxlVGltZXIsXG4gICAgX2lkbGVJbmNyZW1lbnQgPSAwLFxuICAgIF9vbklkbGVNb3VzZU1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgIGNsZWFyVGltZW91dChfaWRsZVRpbWVyKTtcbiAgICAgIF9pZGxlSW5jcmVtZW50ID0gMDtcbiAgICAgIGlmKF9pc0lkbGUpIHtcbiAgICAgICAgdWkuc2V0SWRsZShmYWxzZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBfb25Nb3VzZUxlYXZlV2luZG93ID0gZnVuY3Rpb24oZSkge1xuICAgICAgZSA9IGUgPyBlIDogd2luZG93LmV2ZW50O1xuICAgICAgdmFyIGZyb20gPSBlLnJlbGF0ZWRUYXJnZXQgfHwgZS50b0VsZW1lbnQ7XG4gICAgICBpZiAoIWZyb20gfHwgZnJvbS5ub2RlTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChfaWRsZVRpbWVyKTtcbiAgICAgICAgX2lkbGVUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdWkuc2V0SWRsZSh0cnVlKTtcbiAgICAgICAgfSwgX29wdGlvbnMudGltZVRvSWRsZU91dHNpZGUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3NldHVwRnVsbHNjcmVlbkFQSSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYoX29wdGlvbnMuZnVsbHNjcmVlbkVsICYmICFmcmFtZXdvcmsuZmVhdHVyZXMuaXNPbGRBbmRyb2lkKSB7XG4gICAgICAgIGlmKCFfZnVsbHNjcmVuQVBJKSB7XG4gICAgICAgICAgX2Z1bGxzY3JlbkFQSSA9IHVpLmdldEZ1bGxzY3JlZW5BUEkoKTtcbiAgICAgICAgfVxuICAgICAgICBpZihfZnVsbHNjcmVuQVBJKSB7XG4gICAgICAgICAgZnJhbWV3b3JrLmJpbmQoZG9jdW1lbnQsIF9mdWxsc2NyZW5BUEkuZXZlbnRLLCB1aS51cGRhdGVGdWxsc2NyZWVuKTtcbiAgICAgICAgICB1aS51cGRhdGVGdWxsc2NyZWVuKCk7XG4gICAgICAgICAgZnJhbWV3b3JrLmFkZENsYXNzKHBzd3AudGVtcGxhdGUsICdwc3dwLS1zdXBwb3J0cy1mcycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhwc3dwLnRlbXBsYXRlLCAncHN3cC0tc3VwcG9ydHMtZnMnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgX3NldHVwTG9hZGluZ0luZGljYXRvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gU2V0dXAgbG9hZGluZyBpbmRpY2F0b3JcbiAgICAgIGlmKF9vcHRpb25zLnByZWxvYWRlckVsKSB7XG5cbiAgICAgICAgX3RvZ2dsZUxvYWRpbmdJbmRpY2F0b3IodHJ1ZSk7XG5cbiAgICAgICAgX2xpc3RlbignYmVmb3JlQ2hhbmdlJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICBjbGVhclRpbWVvdXQoX2xvYWRpbmdJbmRpY2F0b3JUaW1lb3V0KTtcblxuICAgICAgICAgIC8vIGRpc3BsYXkgbG9hZGluZyBpbmRpY2F0b3Igd2l0aCBkZWxheVxuICAgICAgICAgIF9sb2FkaW5nSW5kaWNhdG9yVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlmKHBzd3AuY3Vyckl0ZW0gJiYgcHN3cC5jdXJySXRlbS5sb2FkaW5nKSB7XG5cbiAgICAgICAgICAgICAgaWYoICFwc3dwLmFsbG93UHJvZ3Jlc3NpdmVJbWcoKSB8fCAocHN3cC5jdXJySXRlbS5pbWcgJiYgIXBzd3AuY3Vyckl0ZW0uaW1nLm5hdHVyYWxXaWR0aCkgICkge1xuICAgICAgICAgICAgICAgIC8vIHNob3cgcHJlbG9hZGVyIGlmIHByb2dyZXNzaXZlIGxvYWRpbmcgaXMgbm90IGVuYWJsZWQsXG4gICAgICAgICAgICAgICAgLy8gb3IgaW1hZ2Ugd2lkdGggaXMgbm90IGRlZmluZWQgeWV0IChiZWNhdXNlIG9mIHNsb3cgY29ubmVjdGlvbilcbiAgICAgICAgICAgICAgICBfdG9nZ2xlTG9hZGluZ0luZGljYXRvcihmYWxzZSk7XG4gICAgICAgICAgICAgICAgLy8gaXRlbXMtY29udHJvbGxlci5qcyBmdW5jdGlvbiBhbGxvd1Byb2dyZXNzaXZlSW1nXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3RvZ2dsZUxvYWRpbmdJbmRpY2F0b3IodHJ1ZSk7IC8vIGhpZGUgcHJlbG9hZGVyXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9LCBfb3B0aW9ucy5sb2FkaW5nSW5kaWNhdG9yRGVsYXkpO1xuXG4gICAgICAgIH0pO1xuICAgICAgICBfbGlzdGVuKCdpbWFnZUxvYWRDb21wbGV0ZScsIGZ1bmN0aW9uKGluZGV4LCBpdGVtKSB7XG4gICAgICAgICAgaWYocHN3cC5jdXJySXRlbSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgX3RvZ2dsZUxvYWRpbmdJbmRpY2F0b3IodHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgfVxuICAgIH0sXG4gICAgX3RvZ2dsZUxvYWRpbmdJbmRpY2F0b3IgPSBmdW5jdGlvbihoaWRlKSB7XG4gICAgICBpZiggX2xvYWRpbmdJbmRpY2F0b3JIaWRkZW4gIT09IGhpZGUgKSB7XG4gICAgICAgIF90b2dnbGVQc3dwQ2xhc3MoX2xvYWRpbmdJbmRpY2F0b3IsICdwcmVsb2FkZXItLWFjdGl2ZScsICFoaWRlKTtcbiAgICAgICAgX2xvYWRpbmdJbmRpY2F0b3JIaWRkZW4gPSBoaWRlO1xuICAgICAgfVxuICAgIH0sXG4gICAgX2FwcGx5TmF2QmFyR2FwcyA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHZhciBnYXAgPSBpdGVtLnZHYXA7XG5cbiAgICAgIGlmKCBfZml0Q29udHJvbHNJblZpZXdwb3J0KCkgKSB7XG5cbiAgICAgICAgdmFyIGJhcnMgPSBfb3B0aW9ucy5iYXJzU2l6ZTtcbiAgICAgICAgaWYoX29wdGlvbnMuY2FwdGlvbkVsICYmIGJhcnMuYm90dG9tID09PSAnYXV0bycpIHtcbiAgICAgICAgICBpZighX2Zha2VDYXB0aW9uQ29udGFpbmVyKSB7XG4gICAgICAgICAgICBfZmFrZUNhcHRpb25Db250YWluZXIgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2NhcHRpb24gcHN3cF9fY2FwdGlvbi0tZmFrZScpO1xuICAgICAgICAgICAgX2Zha2VDYXB0aW9uQ29udGFpbmVyLmFwcGVuZENoaWxkKCBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2NhcHRpb25fX2NlbnRlcicpICk7XG4gICAgICAgICAgICBfY29udHJvbHMuaW5zZXJ0QmVmb3JlKF9mYWtlQ2FwdGlvbkNvbnRhaW5lciwgX2NhcHRpb25Db250YWluZXIpO1xuICAgICAgICAgICAgZnJhbWV3b3JrLmFkZENsYXNzKF9jb250cm9scywgJ3Bzd3BfX3VpLS1maXQnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoIF9vcHRpb25zLmFkZENhcHRpb25IVE1MRm4oaXRlbSwgX2Zha2VDYXB0aW9uQ29udGFpbmVyLCB0cnVlKSApIHtcblxuICAgICAgICAgICAgdmFyIGNhcHRpb25TaXplID0gX2Zha2VDYXB0aW9uQ29udGFpbmVyLmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgIGdhcC5ib3R0b20gPSBwYXJzZUludChjYXB0aW9uU2l6ZSwxMCkgfHwgNDQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdhcC5ib3R0b20gPSBiYXJzLnRvcDsgLy8gaWYgbm8gY2FwdGlvbiwgc2V0IHNpemUgb2YgYm90dG9tIGdhcCB0byBzaXplIG9mIHRvcFxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnYXAuYm90dG9tID0gYmFycy5ib3R0b20gPT09ICdhdXRvJyA/IDAgOiBiYXJzLmJvdHRvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhlaWdodCBvZiB0b3AgYmFyIGlzIHN0YXRpYywgbm8gbmVlZCB0byBjYWxjdWxhdGUgaXRcbiAgICAgICAgZ2FwLnRvcCA9IGJhcnMudG9wO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2FwLnRvcCA9IGdhcC5ib3R0b20gPSAwO1xuICAgICAgfVxuICAgIH0sXG4gICAgX3NldHVwSWRsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gSGlkZSBjb250cm9scyB3aGVuIG1vdXNlIGlzIHVzZWRcbiAgICAgIGlmKF9vcHRpb25zLnRpbWVUb0lkbGUpIHtcbiAgICAgICAgX2xpc3RlbignbW91c2VVc2VkJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICBmcmFtZXdvcmsuYmluZChkb2N1bWVudCwgJ21vdXNlbW92ZScsIF9vbklkbGVNb3VzZU1vdmUpO1xuICAgICAgICAgIGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCAnbW91c2VvdXQnLCBfb25Nb3VzZUxlYXZlV2luZG93KTtcblxuICAgICAgICAgIF9pZGxlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF9pZGxlSW5jcmVtZW50Kys7XG4gICAgICAgICAgICBpZihfaWRsZUluY3JlbWVudCA9PT0gMikge1xuICAgICAgICAgICAgICB1aS5zZXRJZGxlKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIF9vcHRpb25zLnRpbWVUb0lkbGUgLyAyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBfc2V0dXBIaWRpbmdDb250cm9sc0R1cmluZ0dlc3R1cmVzID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIEhpZGUgY29udHJvbHMgb24gdmVydGljYWwgZHJhZ1xuICAgICAgX2xpc3Rlbignb25WZXJ0aWNhbERyYWcnLCBmdW5jdGlvbihub3cpIHtcbiAgICAgICAgaWYoX2NvbnRyb2xzVmlzaWJsZSAmJiBub3cgPCAwLjk1KSB7XG4gICAgICAgICAgdWkuaGlkZUNvbnRyb2xzKCk7XG4gICAgICAgIH0gZWxzZSBpZighX2NvbnRyb2xzVmlzaWJsZSAmJiBub3cgPj0gMC45NSkge1xuICAgICAgICAgIHVpLnNob3dDb250cm9scygpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gSGlkZSBjb250cm9scyB3aGVuIHBpbmNoaW5nIHRvIGNsb3NlXG4gICAgICB2YXIgcGluY2hDb250cm9sc0hpZGRlbjtcbiAgICAgIF9saXN0ZW4oJ29uUGluY2hDbG9zZScgLCBmdW5jdGlvbihub3cpIHtcbiAgICAgICAgaWYoX2NvbnRyb2xzVmlzaWJsZSAmJiBub3cgPCAwLjkpIHtcbiAgICAgICAgICB1aS5oaWRlQ29udHJvbHMoKTtcbiAgICAgICAgICBwaW5jaENvbnRyb2xzSGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmKHBpbmNoQ29udHJvbHNIaWRkZW4gJiYgIV9jb250cm9sc1Zpc2libGUgJiYgbm93ID4gMC45KSB7XG4gICAgICAgICAgdWkuc2hvd0NvbnRyb2xzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBfbGlzdGVuKCd6b29tR2VzdHVyZUVuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHBpbmNoQ29udHJvbHNIaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgaWYocGluY2hDb250cm9sc0hpZGRlbiAmJiAhX2NvbnRyb2xzVmlzaWJsZSkge1xuICAgICAgICAgIHVpLnNob3dDb250cm9scygpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH07XG5cblxuXG4gIHZhciBfdWlFbGVtZW50cyA9IFtcbiAgICB7XG4gICAgICBuYW1lOiAnY2FwdGlvbicsXG4gICAgICBvcHRpb246ICdjYXB0aW9uRWwnLFxuICAgICAgb25Jbml0OiBmdW5jdGlvbihlbCkge1xuICAgICAgICBfY2FwdGlvbkNvbnRhaW5lciA9IGVsO1xuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ3NoYXJlLW1vZGFsJyxcbiAgICAgIG9wdGlvbjogJ3NoYXJlRWwnLFxuICAgICAgb25Jbml0OiBmdW5jdGlvbihlbCkge1xuICAgICAgICBfc2hhcmVNb2RhbCA9IGVsO1xuICAgICAgfSxcbiAgICAgIG9uVGFwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RvZ2dsZVNoYXJlTW9kYWwoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdidXR0b24tLXNoYXJlJyxcbiAgICAgIG9wdGlvbjogJ3NoYXJlRWwnLFxuICAgICAgb25Jbml0OiBmdW5jdGlvbihlbCkge1xuICAgICAgICBfc2hhcmVCdXR0b24gPSBlbDtcbiAgICAgIH0sXG4gICAgICBvblRhcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIF90b2dnbGVTaGFyZU1vZGFsKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnYnV0dG9uLS16b29tJyxcbiAgICAgIG9wdGlvbjogJ3pvb21FbCcsXG4gICAgICBvblRhcDogcHN3cC50b2dnbGVEZXNrdG9wWm9vbVxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2NvdW50ZXInLFxuICAgICAgb3B0aW9uOiAnY291bnRlckVsJyxcbiAgICAgIG9uSW5pdDogZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgX2luZGV4SW5kaWNhdG9yID0gZWw7XG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnYnV0dG9uLS1jbG9zZScsXG4gICAgICBvcHRpb246ICdjbG9zZUVsJyxcbiAgICAgIG9uVGFwOiBwc3dwLmNsb3NlXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiAnYnV0dG9uLS1hcnJvdy0tbGVmdCcsXG4gICAgICBvcHRpb246ICdhcnJvd0VsJyxcbiAgICAgIG9uVGFwOiBwc3dwLnByZXZcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdidXR0b24tLWFycm93LS1yaWdodCcsXG4gICAgICBvcHRpb246ICdhcnJvd0VsJyxcbiAgICAgIG9uVGFwOiBwc3dwLm5leHRcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdidXR0b24tLWZzJyxcbiAgICAgIG9wdGlvbjogJ2Z1bGxzY3JlZW5FbCcsXG4gICAgICBvblRhcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKF9mdWxsc2NyZW5BUEkuaXNGdWxsc2NyZWVuKCkpIHtcbiAgICAgICAgICBfZnVsbHNjcmVuQVBJLmV4aXQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfZnVsbHNjcmVuQVBJLmVudGVyKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdwcmVsb2FkZXInLFxuICAgICAgb3B0aW9uOiAncHJlbG9hZGVyRWwnLFxuICAgICAgb25Jbml0OiBmdW5jdGlvbihlbCkge1xuICAgICAgICBfbG9hZGluZ0luZGljYXRvciA9IGVsO1xuICAgICAgfVxuICAgIH1cblxuICBdO1xuXG4gIHZhciBfc2V0dXBVSUVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW0sXG4gICAgICBjbGFzc0F0dHIsXG4gICAgICB1aUVsZW1lbnQ7XG5cbiAgICB2YXIgbG9vcFRocm91Z2hDaGlsZEVsZW1lbnRzID0gZnVuY3Rpb24oc0NoaWxkcmVuKSB7XG4gICAgICBpZighc0NoaWxkcmVuKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGwgPSBzQ2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpdGVtID0gc0NoaWxkcmVuW2ldO1xuICAgICAgICBjbGFzc0F0dHIgPSBpdGVtLmNsYXNzTmFtZTtcblxuICAgICAgICBmb3IodmFyIGEgPSAwOyBhIDwgX3VpRWxlbWVudHMubGVuZ3RoOyBhKyspIHtcbiAgICAgICAgICB1aUVsZW1lbnQgPSBfdWlFbGVtZW50c1thXTtcblxuICAgICAgICAgIGlmKGNsYXNzQXR0ci5pbmRleE9mKCdwc3dwX18nICsgdWlFbGVtZW50Lm5hbWUpID4gLTEgICkge1xuXG4gICAgICAgICAgICBpZiggX29wdGlvbnNbdWlFbGVtZW50Lm9wdGlvbl0gKSB7IC8vIGlmIGVsZW1lbnQgaXMgbm90IGRpc2FibGVkIGZyb20gb3B0aW9uc1xuXG4gICAgICAgICAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhpdGVtLCAncHN3cF9fZWxlbWVudC0tZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgaWYodWlFbGVtZW50Lm9uSW5pdCkge1xuICAgICAgICAgICAgICAgIHVpRWxlbWVudC5vbkluaXQoaXRlbSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvL2l0ZW0uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmcmFtZXdvcmsuYWRkQ2xhc3MoaXRlbSwgJ3Bzd3BfX2VsZW1lbnQtLWRpc2FibGVkJyk7XG4gICAgICAgICAgICAgIC8vaXRlbS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgbG9vcFRocm91Z2hDaGlsZEVsZW1lbnRzKF9jb250cm9scy5jaGlsZHJlbik7XG5cbiAgICB2YXIgdG9wQmFyID0gIGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3MoX2NvbnRyb2xzLCAncHN3cF9fdG9wLWJhcicpO1xuICAgIGlmKHRvcEJhcikge1xuICAgICAgbG9vcFRocm91Z2hDaGlsZEVsZW1lbnRzKCB0b3BCYXIuY2hpbGRyZW4gKTtcbiAgICB9XG4gIH07XG5cblxuXG5cbiAgdWkuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gZXh0ZW5kIG9wdGlvbnNcbiAgICBmcmFtZXdvcmsuZXh0ZW5kKHBzd3Aub3B0aW9ucywgX2RlZmF1bHRVSU9wdGlvbnMsIHRydWUpO1xuXG4gICAgLy8gY3JlYXRlIGxvY2FsIGxpbmsgZm9yIGZhc3QgYWNjZXNzXG4gICAgX29wdGlvbnMgPSBwc3dwLm9wdGlvbnM7XG5cbiAgICAvLyBmaW5kIHBzd3BfX3VpIGVsZW1lbnRcbiAgICBfY29udHJvbHMgPSBmcmFtZXdvcmsuZ2V0Q2hpbGRCeUNsYXNzKHBzd3Auc2Nyb2xsV3JhcCwgJ3Bzd3BfX3VpJyk7XG5cbiAgICAvLyBjcmVhdGUgbG9jYWwgbGlua1xuICAgIF9saXN0ZW4gPSBwc3dwLmxpc3RlbjtcblxuXG4gICAgX3NldHVwSGlkaW5nQ29udHJvbHNEdXJpbmdHZXN0dXJlcygpO1xuXG4gICAgLy8gdXBkYXRlIGNvbnRyb2xzIHdoZW4gc2xpZGVzIGNoYW5nZVxuICAgIF9saXN0ZW4oJ2JlZm9yZUNoYW5nZScsIHVpLnVwZGF0ZSk7XG5cbiAgICAvLyB0b2dnbGUgem9vbSBvbiBkb3VibGUtdGFwXG4gICAgX2xpc3RlbignZG91YmxlVGFwJywgZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIHZhciBpbml0aWFsWm9vbUxldmVsID0gcHN3cC5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsO1xuICAgICAgaWYocHN3cC5nZXRab29tTGV2ZWwoKSAhPT0gaW5pdGlhbFpvb21MZXZlbCkge1xuICAgICAgICBwc3dwLnpvb21Ubyhpbml0aWFsWm9vbUxldmVsLCBwb2ludCwgMzMzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBzd3Auem9vbVRvKF9vcHRpb25zLmdldERvdWJsZVRhcFpvb20oZmFsc2UsIHBzd3AuY3Vyckl0ZW0pLCBwb2ludCwgMzMzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFsbG93IHRleHQgc2VsZWN0aW9uIGluIGNhcHRpb25cbiAgICBfbGlzdGVuKCdwcmV2ZW50RHJhZ0V2ZW50JywgZnVuY3Rpb24oZSwgaXNEb3duLCBwcmV2ZW50T2JqKSB7XG4gICAgICB2YXIgdCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcbiAgICAgIGlmKFxuICAgICAgICB0ICYmXG4gICAgICAgIHQuZ2V0QXR0cmlidXRlKCdjbGFzcycpICYmIGUudHlwZS5pbmRleE9mKCdtb3VzZScpID4gLTEgJiZcbiAgICAgICAgKCB0LmdldEF0dHJpYnV0ZSgnY2xhc3MnKS5pbmRleE9mKCdfX2NhcHRpb24nKSA+IDAgfHwgKC8oU01BTEx8U1RST05HfEVNKS9pKS50ZXN0KHQudGFnTmFtZSkgKVxuICAgICAgKSB7XG4gICAgICAgIHByZXZlbnRPYmoucHJldmVudCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gYmluZCBldmVudHMgZm9yIFVJXG4gICAgX2xpc3RlbignYmluZEV2ZW50cycsIGZ1bmN0aW9uKCkge1xuICAgICAgZnJhbWV3b3JrLmJpbmQoX2NvbnRyb2xzLCAncHN3cFRhcCBjbGljaycsIF9vbkNvbnRyb2xzVGFwKTtcbiAgICAgIGZyYW1ld29yay5iaW5kKHBzd3Auc2Nyb2xsV3JhcCwgJ3Bzd3BUYXAnLCB1aS5vbkdsb2JhbFRhcCk7XG5cbiAgICAgIGlmKCFwc3dwLmxpa2VseVRvdWNoRGV2aWNlKSB7XG4gICAgICAgIGZyYW1ld29yay5iaW5kKHBzd3Auc2Nyb2xsV3JhcCwgJ21vdXNlb3ZlcicsIHVpLm9uTW91c2VPdmVyKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHVuYmluZCBldmVudHMgZm9yIFVJXG4gICAgX2xpc3RlbigndW5iaW5kRXZlbnRzJywgZnVuY3Rpb24oKSB7XG4gICAgICBpZighX3NoYXJlTW9kYWxIaWRkZW4pIHtcbiAgICAgICAgX3RvZ2dsZVNoYXJlTW9kYWwoKTtcbiAgICAgIH1cblxuICAgICAgaWYoX2lkbGVJbnRlcnZhbCkge1xuICAgICAgICBjbGVhckludGVydmFsKF9pZGxlSW50ZXJ2YWwpO1xuICAgICAgfVxuICAgICAgZnJhbWV3b3JrLnVuYmluZChkb2N1bWVudCwgJ21vdXNlb3V0JywgX29uTW91c2VMZWF2ZVdpbmRvdyk7XG4gICAgICBmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX29uSWRsZU1vdXNlTW92ZSk7XG4gICAgICBmcmFtZXdvcmsudW5iaW5kKF9jb250cm9scywgJ3Bzd3BUYXAgY2xpY2snLCBfb25Db250cm9sc1RhcCk7XG4gICAgICBmcmFtZXdvcmsudW5iaW5kKHBzd3Auc2Nyb2xsV3JhcCwgJ3Bzd3BUYXAnLCB1aS5vbkdsb2JhbFRhcCk7XG4gICAgICBmcmFtZXdvcmsudW5iaW5kKHBzd3Auc2Nyb2xsV3JhcCwgJ21vdXNlb3ZlcicsIHVpLm9uTW91c2VPdmVyKTtcblxuICAgICAgaWYoX2Z1bGxzY3JlbkFQSSkge1xuICAgICAgICBmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCBfZnVsbHNjcmVuQVBJLmV2ZW50SywgdWkudXBkYXRlRnVsbHNjcmVlbik7XG4gICAgICAgIGlmKF9mdWxsc2NyZW5BUEkuaXNGdWxsc2NyZWVuKCkpIHtcbiAgICAgICAgICBfb3B0aW9ucy5oaWRlQW5pbWF0aW9uRHVyYXRpb24gPSAwO1xuICAgICAgICAgIF9mdWxsc2NyZW5BUEkuZXhpdCgpO1xuICAgICAgICB9XG4gICAgICAgIF9mdWxsc2NyZW5BUEkgPSBudWxsO1xuICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICAvLyBjbGVhbiB1cCB0aGluZ3Mgd2hlbiBnYWxsZXJ5IGlzIGRlc3Ryb3llZFxuICAgIF9saXN0ZW4oJ2Rlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmKF9vcHRpb25zLmNhcHRpb25FbCkge1xuICAgICAgICBpZihfZmFrZUNhcHRpb25Db250YWluZXIpIHtcbiAgICAgICAgICBfY29udHJvbHMucmVtb3ZlQ2hpbGQoX2Zha2VDYXB0aW9uQ29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBmcmFtZXdvcmsucmVtb3ZlQ2xhc3MoX2NhcHRpb25Db250YWluZXIsICdwc3dwX19jYXB0aW9uLS1lbXB0eScpO1xuICAgICAgfVxuXG4gICAgICBpZihfc2hhcmVNb2RhbCkge1xuICAgICAgICBfc2hhcmVNb2RhbC5jaGlsZHJlblswXS5vbmNsaWNrID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGZyYW1ld29yay5yZW1vdmVDbGFzcyhfY29udHJvbHMsICdwc3dwX191aS0tb3Zlci1jbG9zZScpO1xuICAgICAgZnJhbWV3b3JrLmFkZENsYXNzKCBfY29udHJvbHMsICdwc3dwX191aS0taGlkZGVuJyk7XG4gICAgICB1aS5zZXRJZGxlKGZhbHNlKTtcbiAgICB9KTtcblxuXG4gICAgaWYoIV9vcHRpb25zLnNob3dBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgZnJhbWV3b3JrLnJlbW92ZUNsYXNzKCBfY29udHJvbHMsICdwc3dwX191aS0taGlkZGVuJyk7XG4gICAgfVxuICAgIF9saXN0ZW4oJ2luaXRpYWxab29tSW4nLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmKF9vcHRpb25zLnNob3dBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICBmcmFtZXdvcmsucmVtb3ZlQ2xhc3MoIF9jb250cm9scywgJ3Bzd3BfX3VpLS1oaWRkZW4nKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfbGlzdGVuKCdpbml0aWFsWm9vbU91dCcsIGZ1bmN0aW9uKCkge1xuICAgICAgZnJhbWV3b3JrLmFkZENsYXNzKCBfY29udHJvbHMsICdwc3dwX191aS0taGlkZGVuJyk7XG4gICAgfSk7XG5cbiAgICBfbGlzdGVuKCdwYXJzZVZlcnRpY2FsTWFyZ2luJywgX2FwcGx5TmF2QmFyR2Fwcyk7XG5cbiAgICBfc2V0dXBVSUVsZW1lbnRzKCk7XG5cbiAgICBpZihfb3B0aW9ucy5zaGFyZUVsICYmIF9zaGFyZUJ1dHRvbiAmJiBfc2hhcmVNb2RhbCkge1xuICAgICAgX3NoYXJlTW9kYWxIaWRkZW4gPSB0cnVlO1xuICAgIH1cblxuICAgIF9jb3VudE51bUl0ZW1zKCk7XG5cbiAgICBfc2V0dXBJZGxlKCk7XG5cbiAgICBfc2V0dXBGdWxsc2NyZWVuQVBJKCk7XG5cbiAgICBfc2V0dXBMb2FkaW5nSW5kaWNhdG9yKCk7XG4gIH07XG5cbiAgdWkuc2V0SWRsZSA9IGZ1bmN0aW9uKGlzSWRsZSkge1xuICAgIF9pc0lkbGUgPSBpc0lkbGU7XG4gICAgX3RvZ2dsZVBzd3BDbGFzcyhfY29udHJvbHMsICd1aS0taWRsZScsIGlzSWRsZSk7XG4gIH07XG5cbiAgdWkudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gRG9uJ3QgdXBkYXRlIFVJIGlmIGl0J3MgaGlkZGVuXG4gICAgaWYoX2NvbnRyb2xzVmlzaWJsZSAmJiBwc3dwLmN1cnJJdGVtKSB7XG5cbiAgICAgIHVpLnVwZGF0ZUluZGV4SW5kaWNhdG9yKCk7XG5cbiAgICAgIGlmKF9vcHRpb25zLmNhcHRpb25FbCkge1xuICAgICAgICBfb3B0aW9ucy5hZGRDYXB0aW9uSFRNTEZuKHBzd3AuY3Vyckl0ZW0sIF9jYXB0aW9uQ29udGFpbmVyKTtcblxuICAgICAgICBfdG9nZ2xlUHN3cENsYXNzKF9jYXB0aW9uQ29udGFpbmVyLCAnY2FwdGlvbi0tZW1wdHknLCAhcHN3cC5jdXJySXRlbS50aXRsZSk7XG4gICAgICB9XG5cbiAgICAgIF9vdmVybGF5VUlVcGRhdGVkID0gdHJ1ZTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBfb3ZlcmxheVVJVXBkYXRlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmKCFfc2hhcmVNb2RhbEhpZGRlbikge1xuICAgICAgX3RvZ2dsZVNoYXJlTW9kYWwoKTtcbiAgICB9XG5cbiAgICBfY291bnROdW1JdGVtcygpO1xuICB9O1xuXG4gIHVpLnVwZGF0ZUZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlKSB7XG5cbiAgICBpZihlKSB7XG4gICAgICAvLyBzb21lIGJyb3dzZXJzIGNoYW5nZSB3aW5kb3cgc2Nyb2xsIHBvc2l0aW9uIGR1cmluZyB0aGUgZnVsbHNjcmVlblxuICAgICAgLy8gc28gUGhvdG9Td2lwZSB1cGRhdGVzIGl0IGp1c3QgaW4gY2FzZVxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcHN3cC5zZXRTY3JvbGxPZmZzZXQoIDAsIGZyYW1ld29yay5nZXRTY3JvbGxZKCkgKTtcbiAgICAgIH0sIDUwKTtcbiAgICB9XG5cbiAgICAvLyB0b29nbGUgcHN3cC0tZnMgY2xhc3Mgb24gcm9vdCBlbGVtZW50XG4gICAgZnJhbWV3b3JrWyAoX2Z1bGxzY3JlbkFQSS5pc0Z1bGxzY3JlZW4oKSA/ICdhZGQnIDogJ3JlbW92ZScpICsgJ0NsYXNzJyBdKHBzd3AudGVtcGxhdGUsICdwc3dwLS1mcycpO1xuICB9O1xuXG4gIHVpLnVwZGF0ZUluZGV4SW5kaWNhdG9yID0gZnVuY3Rpb24oKSB7XG4gICAgaWYoX29wdGlvbnMuY291bnRlckVsKSB7XG4gICAgICBfaW5kZXhJbmRpY2F0b3IuaW5uZXJIVE1MID0gKHBzd3AuZ2V0Q3VycmVudEluZGV4KCkrMSkgK1xuICAgICAgICAgICAgICAgICAgICBfb3B0aW9ucy5pbmRleEluZGljYXRvclNlcCArXG4gICAgICAgICAgICAgICAgICAgIF9vcHRpb25zLmdldE51bUl0ZW1zRm4oKTtcbiAgICB9XG4gIH07XG5cbiAgdWkub25HbG9iYWxUYXAgPSBmdW5jdGlvbihlKSB7XG4gICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XG5cbiAgICBpZihfYmxvY2tDb250cm9sc1RhcCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmKGUuZGV0YWlsICYmIGUuZGV0YWlsLnBvaW50ZXJUeXBlID09PSAnbW91c2UnKSB7XG5cbiAgICAgIC8vIGNsb3NlIGdhbGxlcnkgaWYgY2xpY2tlZCBvdXRzaWRlIG9mIHRoZSBpbWFnZVxuICAgICAgaWYoX2hhc0Nsb3NlQ2xhc3ModGFyZ2V0KSkge1xuICAgICAgICBwc3dwLmNsb3NlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYoZnJhbWV3b3JrLmhhc0NsYXNzKHRhcmdldCwgJ3Bzd3BfX2ltZycpKSB7XG4gICAgICAgIGlmKHBzd3AuZ2V0Wm9vbUxldmVsKCkgPT09IDEgJiYgcHN3cC5nZXRab29tTGV2ZWwoKSA8PSBwc3dwLmN1cnJJdGVtLmZpdFJhdGlvKSB7XG4gICAgICAgICAgaWYoX29wdGlvbnMuY2xpY2tUb0Nsb3NlTm9uWm9vbWFibGUpIHtcbiAgICAgICAgICAgIHBzd3AuY2xvc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHN3cC50b2dnbGVEZXNrdG9wWm9vbShlLmRldGFpbC5yZWxlYXNlUG9pbnQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyB0YXAgYW55d2hlcmUgKGV4Y2VwdCBidXR0b25zKSB0byB0b2dnbGUgdmlzaWJpbGl0eSBvZiBjb250cm9sc1xuICAgICAgaWYoX29wdGlvbnMudGFwVG9Ub2dnbGVDb250cm9scykge1xuICAgICAgICBpZihfY29udHJvbHNWaXNpYmxlKSB7XG4gICAgICAgICAgdWkuaGlkZUNvbnRyb2xzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdWkuc2hvd0NvbnRyb2xzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gdGFwIHRvIGNsb3NlIGdhbGxlcnlcbiAgICAgIGlmKF9vcHRpb25zLnRhcFRvQ2xvc2UgJiYgKGZyYW1ld29yay5oYXNDbGFzcyh0YXJnZXQsICdwc3dwX19pbWcnKSB8fCBfaGFzQ2xvc2VDbGFzcyh0YXJnZXQpKSApIHtcbiAgICAgICAgcHN3cC5jbG9zZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICB9XG4gIH07XG4gIHVpLm9uTW91c2VPdmVyID0gZnVuY3Rpb24oZSkge1xuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5zcmNFbGVtZW50O1xuXG4gICAgLy8gYWRkIGNsYXNzIHdoZW4gbW91c2UgaXMgb3ZlciBhbiBlbGVtZW50IHRoYXQgc2hvdWxkIGNsb3NlIHRoZSBnYWxsZXJ5XG4gICAgX3RvZ2dsZVBzd3BDbGFzcyhfY29udHJvbHMsICd1aS0tb3Zlci1jbG9zZScsIF9oYXNDbG9zZUNsYXNzKHRhcmdldCkpO1xuICB9O1xuXG4gIHVpLmhpZGVDb250cm9scyA9IGZ1bmN0aW9uKCkge1xuICAgIGZyYW1ld29yay5hZGRDbGFzcyhfY29udHJvbHMsJ3Bzd3BfX3VpLS1oaWRkZW4nKTtcbiAgICBfY29udHJvbHNWaXNpYmxlID0gZmFsc2U7XG4gIH07XG5cbiAgdWkuc2hvd0NvbnRyb2xzID0gZnVuY3Rpb24oKSB7XG4gICAgX2NvbnRyb2xzVmlzaWJsZSA9IHRydWU7XG4gICAgaWYoIV9vdmVybGF5VUlVcGRhdGVkKSB7XG4gICAgICB1aS51cGRhdGUoKTtcbiAgICB9XG4gICAgZnJhbWV3b3JrLnJlbW92ZUNsYXNzKF9jb250cm9scywncHN3cF9fdWktLWhpZGRlbicpO1xuICB9O1xuXG4gIHVpLnN1cHBvcnRzRnVsbHNjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkID0gZG9jdW1lbnQ7XG4gICAgcmV0dXJuICEhKGQuZXhpdEZ1bGxzY3JlZW4gfHwgZC5tb3pDYW5jZWxGdWxsU2NyZWVuIHx8IGQud2Via2l0RXhpdEZ1bGxzY3JlZW4gfHwgZC5tc0V4aXRGdWxsc2NyZWVuKTtcbiAgfTtcblxuICB1aS5nZXRGdWxsc2NyZWVuQVBJID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRFID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgYXBpLFxuICAgICAgdEYgPSAnZnVsbHNjcmVlbmNoYW5nZSc7XG5cbiAgICBpZiAoZEUucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGFwaSA9IHtcbiAgICAgICAgZW50ZXJLOiAncmVxdWVzdEZ1bGxzY3JlZW4nLFxuICAgICAgICBleGl0SzogJ2V4aXRGdWxsc2NyZWVuJyxcbiAgICAgICAgZWxlbWVudEs6ICdmdWxsc2NyZWVuRWxlbWVudCcsXG4gICAgICAgIGV2ZW50SzogdEZcbiAgICAgIH07XG5cbiAgICB9IGVsc2UgaWYoZEUubW96UmVxdWVzdEZ1bGxTY3JlZW4gKSB7XG4gICAgICBhcGkgPSB7XG4gICAgICAgIGVudGVySzogJ21velJlcXVlc3RGdWxsU2NyZWVuJyxcbiAgICAgICAgZXhpdEs6ICdtb3pDYW5jZWxGdWxsU2NyZWVuJyxcbiAgICAgICAgZWxlbWVudEs6ICdtb3pGdWxsU2NyZWVuRWxlbWVudCcsXG4gICAgICAgIGV2ZW50SzogJ21veicgKyB0RlxuICAgICAgfTtcblxuXG5cbiAgICB9IGVsc2UgaWYoZEUud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICAgIGFwaSA9IHtcbiAgICAgICAgZW50ZXJLOiAnd2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4nLFxuICAgICAgICBleGl0SzogJ3dlYmtpdEV4aXRGdWxsc2NyZWVuJyxcbiAgICAgICAgZWxlbWVudEs6ICd3ZWJraXRGdWxsc2NyZWVuRWxlbWVudCcsXG4gICAgICAgIGV2ZW50SzogJ3dlYmtpdCcgKyB0RlxuICAgICAgfTtcblxuICAgIH0gZWxzZSBpZihkRS5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgICBhcGkgPSB7XG4gICAgICAgIGVudGVySzogJ21zUmVxdWVzdEZ1bGxzY3JlZW4nLFxuICAgICAgICBleGl0SzogJ21zRXhpdEZ1bGxzY3JlZW4nLFxuICAgICAgICBlbGVtZW50SzogJ21zRnVsbHNjcmVlbkVsZW1lbnQnLFxuICAgICAgICBldmVudEs6ICdNU0Z1bGxzY3JlZW5DaGFuZ2UnXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmKGFwaSkge1xuICAgICAgYXBpLmVudGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGRpc2FibGUgY2xvc2Utb24tc2Nyb2xsIGluIGZ1bGxzY3JlZW5cbiAgICAgICAgX2luaXRhbENsb3NlT25TY3JvbGxWYWx1ZSA9IF9vcHRpb25zLmNsb3NlT25TY3JvbGw7XG4gICAgICAgIF9vcHRpb25zLmNsb3NlT25TY3JvbGwgPSBmYWxzZTtcblxuICAgICAgICBpZih0aGlzLmVudGVySyA9PT0gJ3dlYmtpdFJlcXVlc3RGdWxsc2NyZWVuJykge1xuICAgICAgICAgIHBzd3AudGVtcGxhdGVbdGhpcy5lbnRlcktdKCBFbGVtZW50LkFMTE9XX0tFWUJPQVJEX0lOUFVUICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHBzd3AudGVtcGxhdGVbdGhpcy5lbnRlcktdKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBhcGkuZXhpdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBfb3B0aW9ucy5jbG9zZU9uU2Nyb2xsID0gX2luaXRhbENsb3NlT25TY3JvbGxWYWx1ZTtcblxuICAgICAgICByZXR1cm4gZG9jdW1lbnRbdGhpcy5leGl0S10oKTtcblxuICAgICAgfTtcbiAgICAgIGFwaS5pc0Z1bGxzY3JlZW4gPSBmdW5jdGlvbigpIHsgcmV0dXJuIGRvY3VtZW50W3RoaXMuZWxlbWVudEtdOyB9O1xuICAgIH1cblxuICAgIHJldHVybiBhcGk7XG4gIH07XG5cblxuXG59O1xucmV0dXJuIFBob3RvU3dpcGVVSV9EZWZhdWx0O1xuXG5cbn0pO1xuIiwiLyohIFBob3RvU3dpcGUgLSB2NC4xLjEgLSAyMDE1LTEyLTI0XG4qIGh0dHA6Ly9waG90b3N3aXBlLmNvbVxuKiBDb3B5cmlnaHQgKGMpIDIwMTUgRG1pdHJ5IFNlbWVub3Y7ICovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHsgXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZmFjdG9yeSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH0gZWxzZSB7XG5cdFx0cm9vdC5QaG90b1N3aXBlID0gZmFjdG9yeSgpO1xuXHR9XG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXHR2YXIgUGhvdG9Td2lwZSA9IGZ1bmN0aW9uKHRlbXBsYXRlLCBVaUNsYXNzLCBpdGVtcywgb3B0aW9ucyl7XG5cbi8qPj5mcmFtZXdvcmstYnJpZGdlKi9cbi8qKlxuICpcbiAqIFNldCBvZiBnZW5lcmljIGZ1bmN0aW9ucyB1c2VkIGJ5IGdhbGxlcnkuXG4gKiBcbiAqIFlvdSdyZSBmcmVlIHRvIG1vZGlmeSBhbnl0aGluZyBoZXJlIGFzIGxvbmcgYXMgZnVuY3Rpb25hbGl0eSBpcyBrZXB0LlxuICogXG4gKi9cbnZhciBmcmFtZXdvcmsgPSB7XG5cdGZlYXR1cmVzOiBudWxsLFxuXHRiaW5kOiBmdW5jdGlvbih0YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCB1bmJpbmQpIHtcblx0XHR2YXIgbWV0aG9kTmFtZSA9ICh1bmJpbmQgPyAncmVtb3ZlJyA6ICdhZGQnKSArICdFdmVudExpc3RlbmVyJztcblx0XHR0eXBlID0gdHlwZS5zcGxpdCgnICcpO1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCB0eXBlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZih0eXBlW2ldKSB7XG5cdFx0XHRcdHRhcmdldFttZXRob2ROYW1lXSggdHlwZVtpXSwgbGlzdGVuZXIsIGZhbHNlKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGlzQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xuXHRcdHJldHVybiAob2JqIGluc3RhbmNlb2YgQXJyYXkpO1xuXHR9LFxuXHRjcmVhdGVFbDogZnVuY3Rpb24oY2xhc3NlcywgdGFnKSB7XG5cdFx0dmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcgfHwgJ2RpdicpO1xuXHRcdGlmKGNsYXNzZXMpIHtcblx0XHRcdGVsLmNsYXNzTmFtZSA9IGNsYXNzZXM7XG5cdFx0fVxuXHRcdHJldHVybiBlbDtcblx0fSxcblx0Z2V0U2Nyb2xsWTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHlPZmZzZXQgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG5cdFx0cmV0dXJuIHlPZmZzZXQgIT09IHVuZGVmaW5lZCA/IHlPZmZzZXQgOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wO1xuXHR9LFxuXHR1bmJpbmQ6IGZ1bmN0aW9uKHRhcmdldCwgdHlwZSwgbGlzdGVuZXIpIHtcblx0XHRmcmFtZXdvcmsuYmluZCh0YXJnZXQsdHlwZSxsaXN0ZW5lcix0cnVlKTtcblx0fSxcblx0cmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKGVsLCBjbGFzc05hbWUpIHtcblx0XHR2YXIgcmVnID0gbmV3IFJlZ0V4cCgnKFxcXFxzfF4pJyArIGNsYXNzTmFtZSArICcoXFxcXHN8JCknKTtcblx0XHRlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZShyZWcsICcgJykucmVwbGFjZSgvXlxcc1xccyovLCAnJykucmVwbGFjZSgvXFxzXFxzKiQvLCAnJyk7IFxuXHR9LFxuXHRhZGRDbGFzczogZnVuY3Rpb24oZWwsIGNsYXNzTmFtZSkge1xuXHRcdGlmKCAhZnJhbWV3b3JrLmhhc0NsYXNzKGVsLGNsYXNzTmFtZSkgKSB7XG5cdFx0XHRlbC5jbGFzc05hbWUgKz0gKGVsLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArIGNsYXNzTmFtZTtcblx0XHR9XG5cdH0sXG5cdGhhc0NsYXNzOiBmdW5jdGlvbihlbCwgY2xhc3NOYW1lKSB7XG5cdFx0cmV0dXJuIGVsLmNsYXNzTmFtZSAmJiBuZXcgUmVnRXhwKCcoXnxcXFxccyknICsgY2xhc3NOYW1lICsgJyhcXFxcc3wkKScpLnRlc3QoZWwuY2xhc3NOYW1lKTtcblx0fSxcblx0Z2V0Q2hpbGRCeUNsYXNzOiBmdW5jdGlvbihwYXJlbnRFbCwgY2hpbGRDbGFzc05hbWUpIHtcblx0XHR2YXIgbm9kZSA9IHBhcmVudEVsLmZpcnN0Q2hpbGQ7XG5cdFx0d2hpbGUobm9kZSkge1xuXHRcdFx0aWYoIGZyYW1ld29yay5oYXNDbGFzcyhub2RlLCBjaGlsZENsYXNzTmFtZSkgKSB7XG5cdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0fVxuXHRcdFx0bm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG5cdFx0fVxuXHR9LFxuXHRhcnJheVNlYXJjaDogZnVuY3Rpb24oYXJyYXksIHZhbHVlLCBrZXkpIHtcblx0XHR2YXIgaSA9IGFycmF5Lmxlbmd0aDtcblx0XHR3aGlsZShpLS0pIHtcblx0XHRcdGlmKGFycmF5W2ldW2tleV0gPT09IHZhbHVlKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fSBcblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9LFxuXHRleHRlbmQ6IGZ1bmN0aW9uKG8xLCBvMiwgcHJldmVudE92ZXJ3cml0ZSkge1xuXHRcdGZvciAodmFyIHByb3AgaW4gbzIpIHtcblx0XHRcdGlmIChvMi5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdFx0XHRpZihwcmV2ZW50T3ZlcndyaXRlICYmIG8xLmhhc093blByb3BlcnR5KHByb3ApKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0bzFbcHJvcF0gPSBvMltwcm9wXTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGVhc2luZzoge1xuXHRcdHNpbmU6IHtcblx0XHRcdG91dDogZnVuY3Rpb24oaykge1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5zaW4oayAqIChNYXRoLlBJIC8gMikpO1xuXHRcdFx0fSxcblx0XHRcdGluT3V0OiBmdW5jdGlvbihrKSB7XG5cdFx0XHRcdHJldHVybiAtIChNYXRoLmNvcyhNYXRoLlBJICogaykgLSAxKSAvIDI7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRjdWJpYzoge1xuXHRcdFx0b3V0OiBmdW5jdGlvbihrKSB7XG5cdFx0XHRcdHJldHVybiAtLWsgKiBrICogayArIDE7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8qXG5cdFx0XHRlbGFzdGljOiB7XG5cdFx0XHRcdG91dDogZnVuY3Rpb24gKCBrICkge1xuXG5cdFx0XHRcdFx0dmFyIHMsIGEgPSAwLjEsIHAgPSAwLjQ7XG5cdFx0XHRcdFx0aWYgKCBrID09PSAwICkgcmV0dXJuIDA7XG5cdFx0XHRcdFx0aWYgKCBrID09PSAxICkgcmV0dXJuIDE7XG5cdFx0XHRcdFx0aWYgKCAhYSB8fCBhIDwgMSApIHsgYSA9IDE7IHMgPSBwIC8gNDsgfVxuXHRcdFx0XHRcdGVsc2UgcyA9IHAgKiBNYXRoLmFzaW4oIDEgLyBhICkgLyAoIDIgKiBNYXRoLlBJICk7XG5cdFx0XHRcdFx0cmV0dXJuICggYSAqIE1hdGgucG93KCAyLCAtIDEwICogaykgKiBNYXRoLnNpbiggKCBrIC0gcyApICogKCAyICogTWF0aC5QSSApIC8gcCApICsgMSApO1xuXG5cdFx0XHRcdH0sXG5cdFx0XHR9LFxuXHRcdFx0YmFjazoge1xuXHRcdFx0XHRvdXQ6IGZ1bmN0aW9uICggayApIHtcblx0XHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cdFx0XHRcdFx0cmV0dXJuIC0tayAqIGsgKiAoICggcyArIDEgKSAqIGsgKyBzICkgKyAxO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0Ki9cblx0fSxcblxuXHQvKipcblx0ICogXG5cdCAqIEByZXR1cm4ge29iamVjdH1cblx0ICogXG5cdCAqIHtcblx0ICogIHJhZiA6IHJlcXVlc3QgYW5pbWF0aW9uIGZyYW1lIGZ1bmN0aW9uXG5cdCAqICBjYWYgOiBjYW5jZWwgYW5pbWF0aW9uIGZyYW1lIGZ1bmN0aW9uXG5cdCAqICB0cmFuc2Zyb20gOiB0cmFuc2Zvcm0gcHJvcGVydHkga2V5ICh3aXRoIHZlbmRvciksIG9yIG51bGwgaWYgbm90IHN1cHBvcnRlZFxuXHQgKiAgb2xkSUUgOiBJRTggb3IgYmVsb3dcblx0ICogfVxuXHQgKiBcblx0ICovXG5cdGRldGVjdEZlYXR1cmVzOiBmdW5jdGlvbigpIHtcblx0XHRpZihmcmFtZXdvcmsuZmVhdHVyZXMpIHtcblx0XHRcdHJldHVybiBmcmFtZXdvcmsuZmVhdHVyZXM7XG5cdFx0fVxuXHRcdHZhciBoZWxwZXJFbCA9IGZyYW1ld29yay5jcmVhdGVFbCgpLFxuXHRcdFx0aGVscGVyU3R5bGUgPSBoZWxwZXJFbC5zdHlsZSxcblx0XHRcdHZlbmRvciA9ICcnLFxuXHRcdFx0ZmVhdHVyZXMgPSB7fTtcblxuXHRcdC8vIElFOCBhbmQgYmVsb3dcblx0XHRmZWF0dXJlcy5vbGRJRSA9IGRvY3VtZW50LmFsbCAmJiAhZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcjtcblxuXHRcdGZlYXR1cmVzLnRvdWNoID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93O1xuXG5cdFx0aWYod2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuXHRcdFx0ZmVhdHVyZXMucmFmID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTtcblx0XHRcdGZlYXR1cmVzLmNhZiA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZTtcblx0XHR9XG5cblx0XHRmZWF0dXJlcy5wb2ludGVyRXZlbnQgPSBuYXZpZ2F0b3IucG9pbnRlckVuYWJsZWQgfHwgbmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQ7XG5cblx0XHQvLyBmaXggZmFsc2UtcG9zaXRpdmUgZGV0ZWN0aW9uIG9mIG9sZCBBbmRyb2lkIGluIG5ldyBJRVxuXHRcdC8vIChJRTExIHVhIHN0cmluZyBjb250YWlucyBcIkFuZHJvaWQgNC4wXCIpXG5cdFx0XG5cdFx0aWYoIWZlYXR1cmVzLnBvaW50ZXJFdmVudCkgeyBcblxuXHRcdFx0dmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcblxuXHRcdFx0Ly8gRGV0ZWN0IGlmIGRldmljZSBpcyBpUGhvbmUgb3IgaVBvZCBhbmQgaWYgaXQncyBvbGRlciB0aGFuIGlPUyA4XG5cdFx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNDIyMzkyMFxuXHRcdFx0Ly8gXG5cdFx0XHQvLyBUaGlzIGRldGVjdGlvbiBpcyBtYWRlIGJlY2F1c2Ugb2YgYnVnZ3kgdG9wL2JvdHRvbSB0b29sYmFyc1xuXHRcdFx0Ly8gdGhhdCBkb24ndCB0cmlnZ2VyIHdpbmRvdy5yZXNpemUgZXZlbnQuXG5cdFx0XHQvLyBGb3IgbW9yZSBpbmZvIHJlZmVyIHRvIF9pc0ZpeGVkUG9zaXRpb24gdmFyaWFibGUgaW4gY29yZS5qc1xuXG5cdFx0XHRpZiAoL2lQKGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkpIHtcblx0XHRcdFx0dmFyIHYgPSAobmF2aWdhdG9yLmFwcFZlcnNpb24pLm1hdGNoKC9PUyAoXFxkKylfKFxcZCspXz8oXFxkKyk/Lyk7XG5cdFx0XHRcdGlmKHYgJiYgdi5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0diA9IHBhcnNlSW50KHZbMV0sIDEwKTtcblx0XHRcdFx0XHRpZih2ID49IDEgJiYgdiA8IDggKSB7XG5cdFx0XHRcdFx0XHRmZWF0dXJlcy5pc09sZElPU1Bob25lID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gRGV0ZWN0IG9sZCBBbmRyb2lkIChiZWZvcmUgS2l0S2F0KVxuXHRcdFx0Ly8gZHVlIHRvIGJ1Z3MgcmVsYXRlZCB0byBwb3NpdGlvbjpmaXhlZFxuXHRcdFx0Ly8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83MTg0NTczL3BpY2stdXAtdGhlLWFuZHJvaWQtdmVyc2lvbi1pbi10aGUtYnJvd3Nlci1ieS1qYXZhc2NyaXB0XG5cdFx0XHRcblx0XHRcdHZhciBtYXRjaCA9IHVhLm1hdGNoKC9BbmRyb2lkXFxzKFswLTlcXC5dKikvKTtcblx0XHRcdHZhciBhbmRyb2lkdmVyc2lvbiA9ICBtYXRjaCA/IG1hdGNoWzFdIDogMDtcblx0XHRcdGFuZHJvaWR2ZXJzaW9uID0gcGFyc2VGbG9hdChhbmRyb2lkdmVyc2lvbik7XG5cdFx0XHRpZihhbmRyb2lkdmVyc2lvbiA+PSAxICkge1xuXHRcdFx0XHRpZihhbmRyb2lkdmVyc2lvbiA8IDQuNCkge1xuXHRcdFx0XHRcdGZlYXR1cmVzLmlzT2xkQW5kcm9pZCA9IHRydWU7IC8vIGZvciBmaXhlZCBwb3NpdGlvbiBidWcgJiBwZXJmb3JtYW5jZVxuXHRcdFx0XHR9XG5cdFx0XHRcdGZlYXR1cmVzLmFuZHJvaWRWZXJzaW9uID0gYW5kcm9pZHZlcnNpb247IC8vIGZvciB0b3VjaGVuZCBidWdcblx0XHRcdH1cdFxuXHRcdFx0ZmVhdHVyZXMuaXNNb2JpbGVPcGVyYSA9IC9vcGVyYSBtaW5pfG9wZXJhIG1vYmkvaS50ZXN0KHVhKTtcblxuXHRcdFx0Ly8gcC5zLiB5ZXMsIHllcywgVUEgc25pZmZpbmcgaXMgYmFkLCBwcm9wb3NlIHlvdXIgc29sdXRpb24gZm9yIGFib3ZlIGJ1Z3MuXG5cdFx0fVxuXHRcdFxuXHRcdHZhciBzdHlsZUNoZWNrcyA9IFsndHJhbnNmb3JtJywgJ3BlcnNwZWN0aXZlJywgJ2FuaW1hdGlvbk5hbWUnXSxcblx0XHRcdHZlbmRvcnMgPSBbJycsICd3ZWJraXQnLCdNb3onLCdtcycsJ08nXSxcblx0XHRcdHN0eWxlQ2hlY2tJdGVtLFxuXHRcdFx0c3R5bGVOYW1lO1xuXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuXHRcdFx0dmVuZG9yID0gdmVuZG9yc1tpXTtcblxuXHRcdFx0Zm9yKHZhciBhID0gMDsgYSA8IDM7IGErKykge1xuXHRcdFx0XHRzdHlsZUNoZWNrSXRlbSA9IHN0eWxlQ2hlY2tzW2FdO1xuXG5cdFx0XHRcdC8vIHVwcGVyY2FzZSBmaXJzdCBsZXR0ZXIgb2YgcHJvcGVydHkgbmFtZSwgaWYgdmVuZG9yIGlzIHByZXNlbnRcblx0XHRcdFx0c3R5bGVOYW1lID0gdmVuZG9yICsgKHZlbmRvciA/IFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdHlsZUNoZWNrSXRlbS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0eWxlQ2hlY2tJdGVtLnNsaWNlKDEpIDogXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0eWxlQ2hlY2tJdGVtKTtcblx0XHRcdFxuXHRcdFx0XHRpZighZmVhdHVyZXNbc3R5bGVDaGVja0l0ZW1dICYmIHN0eWxlTmFtZSBpbiBoZWxwZXJTdHlsZSApIHtcblx0XHRcdFx0XHRmZWF0dXJlc1tzdHlsZUNoZWNrSXRlbV0gPSBzdHlsZU5hbWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYodmVuZG9yICYmICFmZWF0dXJlcy5yYWYpIHtcblx0XHRcdFx0dmVuZG9yID0gdmVuZG9yLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGZlYXR1cmVzLnJhZiA9IHdpbmRvd1t2ZW5kb3IrJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuXHRcdFx0XHRpZihmZWF0dXJlcy5yYWYpIHtcblx0XHRcdFx0XHRmZWF0dXJlcy5jYWYgPSB3aW5kb3dbdmVuZG9yKydDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8IFxuXHRcdFx0XHRcdFx0XHRcdFx0d2luZG93W3ZlbmRvcisnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0XHRcblx0XHRpZighZmVhdHVyZXMucmFmKSB7XG5cdFx0XHR2YXIgbGFzdFRpbWUgPSAwO1xuXHRcdFx0ZmVhdHVyZXMucmFmID0gZnVuY3Rpb24oZm4pIHtcblx0XHRcdFx0dmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdFx0XHRcdHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuXHRcdFx0XHR2YXIgaWQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgZm4oY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSwgdGltZVRvQ2FsbCk7XG5cdFx0XHRcdGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuXHRcdFx0XHRyZXR1cm4gaWQ7XG5cdFx0XHR9O1xuXHRcdFx0ZmVhdHVyZXMuY2FmID0gZnVuY3Rpb24oaWQpIHsgY2xlYXJUaW1lb3V0KGlkKTsgfTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgU1ZHIHN1cHBvcnRcblx0XHRmZWF0dXJlcy5zdmcgPSAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiBcblx0XHRcdFx0XHRcdCEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICdzdmcnKS5jcmVhdGVTVkdSZWN0O1xuXG5cdFx0ZnJhbWV3b3JrLmZlYXR1cmVzID0gZmVhdHVyZXM7XG5cblx0XHRyZXR1cm4gZmVhdHVyZXM7XG5cdH1cbn07XG5cbmZyYW1ld29yay5kZXRlY3RGZWF0dXJlcygpO1xuXG4vLyBPdmVycmlkZSBhZGRFdmVudExpc3RlbmVyIGZvciBvbGQgdmVyc2lvbnMgb2YgSUVcbmlmKGZyYW1ld29yay5mZWF0dXJlcy5vbGRJRSkge1xuXG5cdGZyYW1ld29yay5iaW5kID0gZnVuY3Rpb24odGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgdW5iaW5kKSB7XG5cdFx0XG5cdFx0dHlwZSA9IHR5cGUuc3BsaXQoJyAnKTtcblxuXHRcdHZhciBtZXRob2ROYW1lID0gKHVuYmluZCA/ICdkZXRhY2gnIDogJ2F0dGFjaCcpICsgJ0V2ZW50Jyxcblx0XHRcdGV2TmFtZSxcblx0XHRcdF9oYW5kbGVFdiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRsaXN0ZW5lci5oYW5kbGVFdmVudC5jYWxsKGxpc3RlbmVyKTtcblx0XHRcdH07XG5cblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdHlwZS5sZW5ndGg7IGkrKykge1xuXHRcdFx0ZXZOYW1lID0gdHlwZVtpXTtcblx0XHRcdGlmKGV2TmFtZSkge1xuXG5cdFx0XHRcdGlmKHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCcgJiYgbGlzdGVuZXIuaGFuZGxlRXZlbnQpIHtcblx0XHRcdFx0XHRpZighdW5iaW5kKSB7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lclsnb2xkSUUnICsgZXZOYW1lXSA9IF9oYW5kbGVFdjtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYoIWxpc3RlbmVyWydvbGRJRScgKyBldk5hbWVdKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0YXJnZXRbbWV0aG9kTmFtZV0oICdvbicgKyBldk5hbWUsIGxpc3RlbmVyWydvbGRJRScgKyBldk5hbWVdKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0YXJnZXRbbWV0aG9kTmFtZV0oICdvbicgKyBldk5hbWUsIGxpc3RlbmVyKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXHRcbn1cblxuLyo+PmZyYW1ld29yay1icmlkZ2UqL1xuXG4vKj4+Y29yZSovXG4vL2Z1bmN0aW9uKHRlbXBsYXRlLCBVaUNsYXNzLCBpdGVtcywgb3B0aW9ucylcblxudmFyIHNlbGYgPSB0aGlzO1xuXG4vKipcbiAqIFN0YXRpYyB2YXJzLCBkb24ndCBjaGFuZ2UgdW5sZXNzIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxuICovXG52YXIgRE9VQkxFX1RBUF9SQURJVVMgPSAyNSwgXG5cdE5VTV9IT0xERVJTID0gMztcblxuLyoqXG4gKiBPcHRpb25zXG4gKi9cbnZhciBfb3B0aW9ucyA9IHtcblx0YWxsb3dQYW5Ub05leHQ6dHJ1ZSxcblx0c3BhY2luZzogMC4xMixcblx0YmdPcGFjaXR5OiAxLFxuXHRtb3VzZVVzZWQ6IGZhbHNlLFxuXHRsb29wOiB0cnVlLFxuXHRwaW5jaFRvQ2xvc2U6IHRydWUsXG5cdGNsb3NlT25TY3JvbGw6IHRydWUsXG5cdGNsb3NlT25WZXJ0aWNhbERyYWc6IHRydWUsXG5cdHZlcnRpY2FsRHJhZ1JhbmdlOiAwLjc1LFxuXHRoaWRlQW5pbWF0aW9uRHVyYXRpb246IDMzMyxcblx0c2hvd0FuaW1hdGlvbkR1cmF0aW9uOiAzMzMsXG5cdHNob3dIaWRlT3BhY2l0eTogZmFsc2UsXG5cdGZvY3VzOiB0cnVlLFxuXHRlc2NLZXk6IHRydWUsXG5cdGFycm93S2V5czogdHJ1ZSxcblx0bWFpblNjcm9sbEVuZEZyaWN0aW9uOiAwLjM1LFxuXHRwYW5FbmRGcmljdGlvbjogMC4zNSxcblx0aXNDbGlja2FibGVFbGVtZW50OiBmdW5jdGlvbihlbCkge1xuICAgICAgICByZXR1cm4gZWwudGFnTmFtZSA9PT0gJ0EnO1xuICAgIH0sXG4gICAgZ2V0RG91YmxlVGFwWm9vbTogZnVuY3Rpb24oaXNNb3VzZUNsaWNrLCBpdGVtKSB7XG4gICAgXHRpZihpc01vdXNlQ2xpY2spIHtcbiAgICBcdFx0cmV0dXJuIDE7XG4gICAgXHR9IGVsc2Uge1xuICAgIFx0XHRyZXR1cm4gaXRlbS5pbml0aWFsWm9vbUxldmVsIDwgMC43ID8gMSA6IDEuMzM7XG4gICAgXHR9XG4gICAgfSxcbiAgICBtYXhTcHJlYWRab29tOiAxLjMzLFxuXHRtb2RhbDogdHJ1ZSxcblxuXHQvLyBub3QgZnVsbHkgaW1wbGVtZW50ZWQgeWV0XG5cdHNjYWxlTW9kZTogJ2ZpdCcgLy8gVE9ET1xufTtcbmZyYW1ld29yay5leHRlbmQoX29wdGlvbnMsIG9wdGlvbnMpO1xuXG5cbi8qKlxuICogUHJpdmF0ZSBoZWxwZXIgdmFyaWFibGVzICYgZnVuY3Rpb25zXG4gKi9cblxudmFyIF9nZXRFbXB0eVBvaW50ID0gZnVuY3Rpb24oKSB7IFxuXHRcdHJldHVybiB7eDowLHk6MH07IFxuXHR9O1xuXG52YXIgX2lzT3Blbixcblx0X2lzRGVzdHJveWluZyxcblx0X2Nsb3NlZEJ5U2Nyb2xsLFxuXHRfY3VycmVudEl0ZW1JbmRleCxcblx0X2NvbnRhaW5lclN0eWxlLFxuXHRfY29udGFpbmVyU2hpZnRJbmRleCxcblx0X2N1cnJQYW5EaXN0ID0gX2dldEVtcHR5UG9pbnQoKSxcblx0X3N0YXJ0UGFuT2Zmc2V0ID0gX2dldEVtcHR5UG9pbnQoKSxcblx0X3Bhbk9mZnNldCA9IF9nZXRFbXB0eVBvaW50KCksXG5cdF91cE1vdmVFdmVudHMsIC8vIGRyYWcgbW92ZSwgZHJhZyBlbmQgJiBkcmFnIGNhbmNlbCBldmVudHMgYXJyYXlcblx0X2Rvd25FdmVudHMsIC8vIGRyYWcgc3RhcnQgZXZlbnRzIGFycmF5XG5cdF9nbG9iYWxFdmVudEhhbmRsZXJzLFxuXHRfdmlld3BvcnRTaXplID0ge30sXG5cdF9jdXJyWm9vbUxldmVsLFxuXHRfc3RhcnRab29tTGV2ZWwsXG5cdF90cmFuc2xhdGVQcmVmaXgsXG5cdF90cmFuc2xhdGVTdWZpeCxcblx0X3VwZGF0ZVNpemVJbnRlcnZhbCxcblx0X2l0ZW1zTmVlZFVwZGF0ZSxcblx0X2N1cnJQb3NpdGlvbkluZGV4ID0gMCxcblx0X29mZnNldCA9IHt9LFxuXHRfc2xpZGVTaXplID0gX2dldEVtcHR5UG9pbnQoKSwgLy8gc2l6ZSBvZiBzbGlkZSBhcmVhLCBpbmNsdWRpbmcgc3BhY2luZ1xuXHRfaXRlbUhvbGRlcnMsXG5cdF9wcmV2SXRlbUluZGV4LFxuXHRfaW5kZXhEaWZmID0gMCwgLy8gZGlmZmVyZW5jZSBvZiBpbmRleGVzIHNpbmNlIGxhc3QgY29udGVudCB1cGRhdGVcblx0X2RyYWdTdGFydEV2ZW50LFxuXHRfZHJhZ01vdmVFdmVudCxcblx0X2RyYWdFbmRFdmVudCxcblx0X2RyYWdDYW5jZWxFdmVudCxcblx0X3RyYW5zZm9ybUtleSxcblx0X3BvaW50ZXJFdmVudEVuYWJsZWQsXG5cdF9pc0ZpeGVkUG9zaXRpb24gPSB0cnVlLFxuXHRfbGlrZWx5VG91Y2hEZXZpY2UsXG5cdF9tb2R1bGVzID0gW10sXG5cdF9yZXF1ZXN0QUYsXG5cdF9jYW5jZWxBRixcblx0X2luaXRhbENsYXNzTmFtZSxcblx0X2luaXRhbFdpbmRvd1Njcm9sbFksXG5cdF9vbGRJRSxcblx0X2N1cnJlbnRXaW5kb3dTY3JvbGxZLFxuXHRfZmVhdHVyZXMsXG5cdF93aW5kb3dWaXNpYmxlU2l6ZSA9IHt9LFxuXHRfcmVuZGVyTWF4UmVzb2x1dGlvbiA9IGZhbHNlLFxuXG5cdC8vIFJlZ2lzdGVycyBQaG90b1NXaXBlIG1vZHVsZSAoSGlzdG9yeSwgQ29udHJvbGxlciAuLi4pXG5cdF9yZWdpc3Rlck1vZHVsZSA9IGZ1bmN0aW9uKG5hbWUsIG1vZHVsZSkge1xuXHRcdGZyYW1ld29yay5leHRlbmQoc2VsZiwgbW9kdWxlLnB1YmxpY01ldGhvZHMpO1xuXHRcdF9tb2R1bGVzLnB1c2gobmFtZSk7XG5cdH0sXG5cblx0X2dldExvb3BlZElkID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0XHR2YXIgbnVtU2xpZGVzID0gX2dldE51bUl0ZW1zKCk7XG5cdFx0aWYoaW5kZXggPiBudW1TbGlkZXMgLSAxKSB7XG5cdFx0XHRyZXR1cm4gaW5kZXggLSBudW1TbGlkZXM7XG5cdFx0fSBlbHNlICBpZihpbmRleCA8IDApIHtcblx0XHRcdHJldHVybiBudW1TbGlkZXMgKyBpbmRleDtcblx0XHR9XG5cdFx0cmV0dXJuIGluZGV4O1xuXHR9LFxuXHRcblx0Ly8gTWljcm8gYmluZC90cmlnZ2VyXG5cdF9saXN0ZW5lcnMgPSB7fSxcblx0X2xpc3RlbiA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XG5cdFx0aWYoIV9saXN0ZW5lcnNbbmFtZV0pIHtcblx0XHRcdF9saXN0ZW5lcnNbbmFtZV0gPSBbXTtcblx0XHR9XG5cdFx0cmV0dXJuIF9saXN0ZW5lcnNbbmFtZV0ucHVzaChmbik7XG5cdH0sXG5cdF9zaG91dCA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gX2xpc3RlbmVyc1tuYW1lXTtcblxuXHRcdGlmKGxpc3RlbmVycykge1xuXHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXHRcdFx0YXJncy5zaGlmdCgpO1xuXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1tpXS5hcHBseShzZWxmLCBhcmdzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0X2dldEN1cnJlbnRUaW1lID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHR9LFxuXHRfYXBwbHlCZ09wYWNpdHkgPSBmdW5jdGlvbihvcGFjaXR5KSB7XG5cdFx0X2JnT3BhY2l0eSA9IG9wYWNpdHk7XG5cdFx0c2VsZi5iZy5zdHlsZS5vcGFjaXR5ID0gb3BhY2l0eSAqIF9vcHRpb25zLmJnT3BhY2l0eTtcblx0fSxcblxuXHRfYXBwbHlab29tVHJhbnNmb3JtID0gZnVuY3Rpb24oc3R5bGVPYmoseCx5LHpvb20saXRlbSkge1xuXHRcdGlmKCFfcmVuZGVyTWF4UmVzb2x1dGlvbiB8fCAoaXRlbSAmJiBpdGVtICE9PSBzZWxmLmN1cnJJdGVtKSApIHtcblx0XHRcdHpvb20gPSB6b29tIC8gKGl0ZW0gPyBpdGVtLmZpdFJhdGlvIDogc2VsZi5jdXJySXRlbS5maXRSYXRpbyk7XHRcblx0XHR9XG5cdFx0XHRcblx0XHRzdHlsZU9ialtfdHJhbnNmb3JtS2V5XSA9IF90cmFuc2xhdGVQcmVmaXggKyB4ICsgJ3B4LCAnICsgeSArICdweCcgKyBfdHJhbnNsYXRlU3VmaXggKyAnIHNjYWxlKCcgKyB6b29tICsgJyknO1xuXHR9LFxuXHRfYXBwbHlDdXJyZW50Wm9vbVBhbiA9IGZ1bmN0aW9uKCBhbGxvd1JlbmRlclJlc29sdXRpb24gKSB7XG5cdFx0aWYoX2N1cnJab29tRWxlbWVudFN0eWxlKSB7XG5cblx0XHRcdGlmKGFsbG93UmVuZGVyUmVzb2x1dGlvbikge1xuXHRcdFx0XHRpZihfY3Vyclpvb21MZXZlbCA+IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pIHtcblx0XHRcdFx0XHRpZighX3JlbmRlck1heFJlc29sdXRpb24pIHtcblx0XHRcdFx0XHRcdF9zZXRJbWFnZVNpemUoc2VsZi5jdXJySXRlbSwgZmFsc2UsIHRydWUpO1xuXHRcdFx0XHRcdFx0X3JlbmRlck1heFJlc29sdXRpb24gPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZihfcmVuZGVyTWF4UmVzb2x1dGlvbikge1xuXHRcdFx0XHRcdFx0X3NldEltYWdlU2l6ZShzZWxmLmN1cnJJdGVtKTtcblx0XHRcdFx0XHRcdF9yZW5kZXJNYXhSZXNvbHV0aW9uID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblxuXHRcdFx0X2FwcGx5Wm9vbVRyYW5zZm9ybShfY3Vyclpvb21FbGVtZW50U3R5bGUsIF9wYW5PZmZzZXQueCwgX3Bhbk9mZnNldC55LCBfY3Vyclpvb21MZXZlbCk7XG5cdFx0fVxuXHR9LFxuXHRfYXBwbHlab29tUGFuVG9JdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdGlmKGl0ZW0uY29udGFpbmVyKSB7XG5cblx0XHRcdF9hcHBseVpvb21UcmFuc2Zvcm0oaXRlbS5jb250YWluZXIuc3R5bGUsIFxuXHRcdFx0XHRcdFx0XHRcdGl0ZW0uaW5pdGlhbFBvc2l0aW9uLngsIFxuXHRcdFx0XHRcdFx0XHRcdGl0ZW0uaW5pdGlhbFBvc2l0aW9uLnksIFxuXHRcdFx0XHRcdFx0XHRcdGl0ZW0uaW5pdGlhbFpvb21MZXZlbCxcblx0XHRcdFx0XHRcdFx0XHRpdGVtKTtcblx0XHR9XG5cdH0sXG5cdF9zZXRUcmFuc2xhdGVYID0gZnVuY3Rpb24oeCwgZWxTdHlsZSkge1xuXHRcdGVsU3R5bGVbX3RyYW5zZm9ybUtleV0gPSBfdHJhbnNsYXRlUHJlZml4ICsgeCArICdweCwgMHB4JyArIF90cmFuc2xhdGVTdWZpeDtcblx0fSxcblx0X21vdmVNYWluU2Nyb2xsID0gZnVuY3Rpb24oeCwgZHJhZ2dpbmcpIHtcblxuXHRcdGlmKCFfb3B0aW9ucy5sb29wICYmIGRyYWdnaW5nKSB7XG5cdFx0XHR2YXIgbmV3U2xpZGVJbmRleE9mZnNldCA9IF9jdXJyZW50SXRlbUluZGV4ICsgKF9zbGlkZVNpemUueCAqIF9jdXJyUG9zaXRpb25JbmRleCAtIHgpIC8gX3NsaWRlU2l6ZS54LFxuXHRcdFx0XHRkZWx0YSA9IE1hdGgucm91bmQoeCAtIF9tYWluU2Nyb2xsUG9zLngpO1xuXG5cdFx0XHRpZiggKG5ld1NsaWRlSW5kZXhPZmZzZXQgPCAwICYmIGRlbHRhID4gMCkgfHwgXG5cdFx0XHRcdChuZXdTbGlkZUluZGV4T2Zmc2V0ID49IF9nZXROdW1JdGVtcygpIC0gMSAmJiBkZWx0YSA8IDApICkge1xuXHRcdFx0XHR4ID0gX21haW5TY3JvbGxQb3MueCArIGRlbHRhICogX29wdGlvbnMubWFpblNjcm9sbEVuZEZyaWN0aW9uO1xuXHRcdFx0fSBcblx0XHR9XG5cdFx0XG5cdFx0X21haW5TY3JvbGxQb3MueCA9IHg7XG5cdFx0X3NldFRyYW5zbGF0ZVgoeCwgX2NvbnRhaW5lclN0eWxlKTtcblx0fSxcblx0X2NhbGN1bGF0ZVBhbk9mZnNldCA9IGZ1bmN0aW9uKGF4aXMsIHpvb21MZXZlbCkge1xuXHRcdHZhciBtID0gX21pZFpvb21Qb2ludFtheGlzXSAtIF9vZmZzZXRbYXhpc107XG5cdFx0cmV0dXJuIF9zdGFydFBhbk9mZnNldFtheGlzXSArIF9jdXJyUGFuRGlzdFtheGlzXSArIG0gLSBtICogKCB6b29tTGV2ZWwgLyBfc3RhcnRab29tTGV2ZWwgKTtcblx0fSxcblx0XG5cdF9lcXVhbGl6ZVBvaW50cyA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRcdHAxLnggPSBwMi54O1xuXHRcdHAxLnkgPSBwMi55O1xuXHRcdGlmKHAyLmlkKSB7XG5cdFx0XHRwMS5pZCA9IHAyLmlkO1xuXHRcdH1cblx0fSxcblx0X3JvdW5kUG9pbnQgPSBmdW5jdGlvbihwKSB7XG5cdFx0cC54ID0gTWF0aC5yb3VuZChwLngpO1xuXHRcdHAueSA9IE1hdGgucm91bmQocC55KTtcblx0fSxcblxuXHRfbW91c2VNb3ZlVGltZW91dCA9IG51bGwsXG5cdF9vbkZpcnN0TW91c2VNb3ZlID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gV2FpdCB1bnRpbCBtb3VzZSBtb3ZlIGV2ZW50IGlzIGZpcmVkIGF0IGxlYXN0IHR3aWNlIGR1cmluZyAxMDBtc1xuXHRcdC8vIFdlIGRvIHRoaXMsIGJlY2F1c2Ugc29tZSBtb2JpbGUgYnJvd3NlcnMgdHJpZ2dlciBpdCBvbiB0b3VjaHN0YXJ0XG5cdFx0aWYoX21vdXNlTW92ZVRpbWVvdXQgKSB7IFxuXHRcdFx0ZnJhbWV3b3JrLnVuYmluZChkb2N1bWVudCwgJ21vdXNlbW92ZScsIF9vbkZpcnN0TW91c2VNb3ZlKTtcblx0XHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWhhc19tb3VzZScpO1xuXHRcdFx0X29wdGlvbnMubW91c2VVc2VkID0gdHJ1ZTtcblx0XHRcdF9zaG91dCgnbW91c2VVc2VkJyk7XG5cdFx0fVxuXHRcdF9tb3VzZU1vdmVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdF9tb3VzZU1vdmVUaW1lb3V0ID0gbnVsbDtcblx0XHR9LCAxMDApO1xuXHR9LFxuXG5cdF9iaW5kRXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0ZnJhbWV3b3JrLmJpbmQoZG9jdW1lbnQsICdrZXlkb3duJywgc2VsZik7XG5cblx0XHRpZihfZmVhdHVyZXMudHJhbnNmb3JtKSB7XG5cdFx0XHQvLyBkb24ndCBiaW5kIGNsaWNrIGV2ZW50IGluIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0cmFuc2Zvcm0gKG1vc3RseSBJRTgpXG5cdFx0XHRmcmFtZXdvcmsuYmluZChzZWxmLnNjcm9sbFdyYXAsICdjbGljaycsIHNlbGYpO1xuXHRcdH1cblx0XHRcblxuXHRcdGlmKCFfb3B0aW9ucy5tb3VzZVVzZWQpIHtcblx0XHRcdGZyYW1ld29yay5iaW5kKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgX29uRmlyc3RNb3VzZU1vdmUpO1xuXHRcdH1cblxuXHRcdGZyYW1ld29yay5iaW5kKHdpbmRvdywgJ3Jlc2l6ZSBzY3JvbGwnLCBzZWxmKTtcblxuXHRcdF9zaG91dCgnYmluZEV2ZW50cycpO1xuXHR9LFxuXG5cdF91bmJpbmRFdmVudHMgPSBmdW5jdGlvbigpIHtcblx0XHRmcmFtZXdvcmsudW5iaW5kKHdpbmRvdywgJ3Jlc2l6ZScsIHNlbGYpO1xuXHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCAnc2Nyb2xsJywgX2dsb2JhbEV2ZW50SGFuZGxlcnMuc2Nyb2xsKTtcblx0XHRmcmFtZXdvcmsudW5iaW5kKGRvY3VtZW50LCAna2V5ZG93bicsIHNlbGYpO1xuXHRcdGZyYW1ld29yay51bmJpbmQoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBfb25GaXJzdE1vdXNlTW92ZSk7XG5cblx0XHRpZihfZmVhdHVyZXMudHJhbnNmb3JtKSB7XG5cdFx0XHRmcmFtZXdvcmsudW5iaW5kKHNlbGYuc2Nyb2xsV3JhcCwgJ2NsaWNrJywgc2VsZik7XG5cdFx0fVxuXG5cdFx0aWYoX2lzRHJhZ2dpbmcpIHtcblx0XHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCBfdXBNb3ZlRXZlbnRzLCBzZWxmKTtcblx0XHR9XG5cblx0XHRfc2hvdXQoJ3VuYmluZEV2ZW50cycpO1xuXHR9LFxuXHRcblx0X2NhbGN1bGF0ZVBhbkJvdW5kcyA9IGZ1bmN0aW9uKHpvb21MZXZlbCwgdXBkYXRlKSB7XG5cdFx0dmFyIGJvdW5kcyA9IF9jYWxjdWxhdGVJdGVtU2l6ZSggc2VsZi5jdXJySXRlbSwgX3ZpZXdwb3J0U2l6ZSwgem9vbUxldmVsICk7XG5cdFx0aWYodXBkYXRlKSB7XG5cdFx0XHRfY3VyclBhbkJvdW5kcyA9IGJvdW5kcztcblx0XHR9XG5cdFx0cmV0dXJuIGJvdW5kcztcblx0fSxcblx0XG5cdF9nZXRNaW5ab29tTGV2ZWwgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0aWYoIWl0ZW0pIHtcblx0XHRcdGl0ZW0gPSBzZWxmLmN1cnJJdGVtO1xuXHRcdH1cblx0XHRyZXR1cm4gaXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXHR9LFxuXHRfZ2V0TWF4Wm9vbUxldmVsID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdGlmKCFpdGVtKSB7XG5cdFx0XHRpdGVtID0gc2VsZi5jdXJySXRlbTtcblx0XHR9XG5cdFx0cmV0dXJuIGl0ZW0udyA+IDAgPyBfb3B0aW9ucy5tYXhTcHJlYWRab29tIDogMTtcblx0fSxcblxuXHQvLyBSZXR1cm4gdHJ1ZSBpZiBvZmZzZXQgaXMgb3V0IG9mIHRoZSBib3VuZHNcblx0X21vZGlmeURlc3RQYW5PZmZzZXQgPSBmdW5jdGlvbihheGlzLCBkZXN0UGFuQm91bmRzLCBkZXN0UGFuT2Zmc2V0LCBkZXN0Wm9vbUxldmVsKSB7XG5cdFx0aWYoZGVzdFpvb21MZXZlbCA9PT0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsKSB7XG5cdFx0XHRkZXN0UGFuT2Zmc2V0W2F4aXNdID0gc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb25bYXhpc107XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVzdFBhbk9mZnNldFtheGlzXSA9IF9jYWxjdWxhdGVQYW5PZmZzZXQoYXhpcywgZGVzdFpvb21MZXZlbCk7IFxuXG5cdFx0XHRpZihkZXN0UGFuT2Zmc2V0W2F4aXNdID4gZGVzdFBhbkJvdW5kcy5taW5bYXhpc10pIHtcblx0XHRcdFx0ZGVzdFBhbk9mZnNldFtheGlzXSA9IGRlc3RQYW5Cb3VuZHMubWluW2F4aXNdO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH0gZWxzZSBpZihkZXN0UGFuT2Zmc2V0W2F4aXNdIDwgZGVzdFBhbkJvdW5kcy5tYXhbYXhpc10gKSB7XG5cdFx0XHRcdGRlc3RQYW5PZmZzZXRbYXhpc10gPSBkZXN0UGFuQm91bmRzLm1heFtheGlzXTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRfc2V0dXBUcmFuc2Zvcm1zID0gZnVuY3Rpb24oKSB7XG5cblx0XHRpZihfdHJhbnNmb3JtS2V5KSB7XG5cdFx0XHQvLyBzZXR1cCAzZCB0cmFuc2Zvcm1zXG5cdFx0XHR2YXIgYWxsb3czZFRyYW5zZm9ybSA9IF9mZWF0dXJlcy5wZXJzcGVjdGl2ZSAmJiAhX2xpa2VseVRvdWNoRGV2aWNlO1xuXHRcdFx0X3RyYW5zbGF0ZVByZWZpeCA9ICd0cmFuc2xhdGUnICsgKGFsbG93M2RUcmFuc2Zvcm0gPyAnM2QoJyA6ICcoJyk7XG5cdFx0XHRfdHJhbnNsYXRlU3VmaXggPSBfZmVhdHVyZXMucGVyc3BlY3RpdmUgPyAnLCAwcHgpJyA6ICcpJztcdFxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIE92ZXJyaWRlIHpvb20vcGFuL21vdmUgZnVuY3Rpb25zIGluIGNhc2Ugb2xkIGJyb3dzZXIgaXMgdXNlZCAobW9zdCBsaWtlbHkgSUUpXG5cdFx0Ly8gKHNvIHRoZXkgdXNlIGxlZnQvdG9wL3dpZHRoL2hlaWdodCwgaW5zdGVhZCBvZiBDU1MgdHJhbnNmb3JtKVxuXHRcblx0XHRfdHJhbnNmb3JtS2V5ID0gJ2xlZnQnO1xuXHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWllJyk7XG5cblx0XHRfc2V0VHJhbnNsYXRlWCA9IGZ1bmN0aW9uKHgsIGVsU3R5bGUpIHtcblx0XHRcdGVsU3R5bGUubGVmdCA9IHggKyAncHgnO1xuXHRcdH07XG5cdFx0X2FwcGx5Wm9vbVBhblRvSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuXHRcdFx0dmFyIHpvb21SYXRpbyA9IGl0ZW0uZml0UmF0aW8gPiAxID8gMSA6IGl0ZW0uZml0UmF0aW8sXG5cdFx0XHRcdHMgPSBpdGVtLmNvbnRhaW5lci5zdHlsZSxcblx0XHRcdFx0dyA9IHpvb21SYXRpbyAqIGl0ZW0udyxcblx0XHRcdFx0aCA9IHpvb21SYXRpbyAqIGl0ZW0uaDtcblxuXHRcdFx0cy53aWR0aCA9IHcgKyAncHgnO1xuXHRcdFx0cy5oZWlnaHQgPSBoICsgJ3B4Jztcblx0XHRcdHMubGVmdCA9IGl0ZW0uaW5pdGlhbFBvc2l0aW9uLnggKyAncHgnO1xuXHRcdFx0cy50b3AgPSBpdGVtLmluaXRpYWxQb3NpdGlvbi55ICsgJ3B4JztcblxuXHRcdH07XG5cdFx0X2FwcGx5Q3VycmVudFpvb21QYW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmKF9jdXJyWm9vbUVsZW1lbnRTdHlsZSkge1xuXG5cdFx0XHRcdHZhciBzID0gX2N1cnJab29tRWxlbWVudFN0eWxlLFxuXHRcdFx0XHRcdGl0ZW0gPSBzZWxmLmN1cnJJdGVtLFxuXHRcdFx0XHRcdHpvb21SYXRpbyA9IGl0ZW0uZml0UmF0aW8gPiAxID8gMSA6IGl0ZW0uZml0UmF0aW8sXG5cdFx0XHRcdFx0dyA9IHpvb21SYXRpbyAqIGl0ZW0udyxcblx0XHRcdFx0XHRoID0gem9vbVJhdGlvICogaXRlbS5oO1xuXG5cdFx0XHRcdHMud2lkdGggPSB3ICsgJ3B4Jztcblx0XHRcdFx0cy5oZWlnaHQgPSBoICsgJ3B4JztcblxuXG5cdFx0XHRcdHMubGVmdCA9IF9wYW5PZmZzZXQueCArICdweCc7XG5cdFx0XHRcdHMudG9wID0gX3Bhbk9mZnNldC55ICsgJ3B4Jztcblx0XHRcdH1cblx0XHRcdFxuXHRcdH07XG5cdH0sXG5cblx0X29uS2V5RG93biA9IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIga2V5ZG93bkFjdGlvbiA9ICcnO1xuXHRcdGlmKF9vcHRpb25zLmVzY0tleSAmJiBlLmtleUNvZGUgPT09IDI3KSB7IFxuXHRcdFx0a2V5ZG93bkFjdGlvbiA9ICdjbG9zZSc7XG5cdFx0fSBlbHNlIGlmKF9vcHRpb25zLmFycm93S2V5cykge1xuXHRcdFx0aWYoZS5rZXlDb2RlID09PSAzNykge1xuXHRcdFx0XHRrZXlkb3duQWN0aW9uID0gJ3ByZXYnO1xuXHRcdFx0fSBlbHNlIGlmKGUua2V5Q29kZSA9PT0gMzkpIHsgXG5cdFx0XHRcdGtleWRvd25BY3Rpb24gPSAnbmV4dCc7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoa2V5ZG93bkFjdGlvbikge1xuXHRcdFx0Ly8gZG9uJ3QgZG8gYW55dGhpbmcgaWYgc3BlY2lhbCBrZXkgcHJlc3NlZCB0byBwcmV2ZW50IGZyb20gb3ZlcnJpZGluZyBkZWZhdWx0IGJyb3dzZXIgYWN0aW9uc1xuXHRcdFx0Ly8gZS5nLiBpbiBDaHJvbWUgb24gTWFjIGNtZCthcnJvdy1sZWZ0IHJldHVybnMgdG8gcHJldmlvdXMgcGFnZVxuXHRcdFx0aWYoICFlLmN0cmxLZXkgJiYgIWUuYWx0S2V5ICYmICFlLnNoaWZ0S2V5ICYmICFlLm1ldGFLZXkgKSB7XG5cdFx0XHRcdGlmKGUucHJldmVudERlZmF1bHQpIHtcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXHRcdFx0XHR9IFxuXHRcdFx0XHRzZWxmW2tleWRvd25BY3Rpb25dKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9LFxuXG5cdF9vbkdsb2JhbENsaWNrID0gZnVuY3Rpb24oZSkge1xuXHRcdGlmKCFlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gZG9uJ3QgYWxsb3cgY2xpY2sgZXZlbnQgdG8gcGFzcyB0aHJvdWdoIHdoZW4gdHJpZ2dlcmluZyBhZnRlciBkcmFnIG9yIHNvbWUgb3RoZXIgZ2VzdHVyZVxuXHRcdGlmKF9tb3ZlZCB8fCBfem9vbVN0YXJ0ZWQgfHwgX21haW5TY3JvbGxBbmltYXRpbmcgfHwgX3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cdH0sXG5cblx0X3VwZGF0ZVBhZ2VTY3JvbGxPZmZzZXQgPSBmdW5jdGlvbigpIHtcblx0XHRzZWxmLnNldFNjcm9sbE9mZnNldCgwLCBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpKTtcdFx0XG5cdH07XG5cdFxuXG5cblx0XG5cblxuXG4vLyBNaWNybyBhbmltYXRpb24gZW5naW5lXG52YXIgX2FuaW1hdGlvbnMgPSB7fSxcblx0X251bUFuaW1hdGlvbnMgPSAwLFxuXHRfc3RvcEFuaW1hdGlvbiA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRpZihfYW5pbWF0aW9uc1tuYW1lXSkge1xuXHRcdFx0aWYoX2FuaW1hdGlvbnNbbmFtZV0ucmFmKSB7XG5cdFx0XHRcdF9jYW5jZWxBRiggX2FuaW1hdGlvbnNbbmFtZV0ucmFmICk7XG5cdFx0XHR9XG5cdFx0XHRfbnVtQW5pbWF0aW9ucy0tO1xuXHRcdFx0ZGVsZXRlIF9hbmltYXRpb25zW25hbWVdO1xuXHRcdH1cblx0fSxcblx0X3JlZ2lzdGVyU3RhcnRBbmltYXRpb24gPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0aWYoX2FuaW1hdGlvbnNbbmFtZV0pIHtcblx0XHRcdF9zdG9wQW5pbWF0aW9uKG5hbWUpO1xuXHRcdH1cblx0XHRpZighX2FuaW1hdGlvbnNbbmFtZV0pIHtcblx0XHRcdF9udW1BbmltYXRpb25zKys7XG5cdFx0XHRfYW5pbWF0aW9uc1tuYW1lXSA9IHt9O1xuXHRcdH1cblx0fSxcblx0X3N0b3BBbGxBbmltYXRpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBfYW5pbWF0aW9ucykge1xuXG5cdFx0XHRpZiggX2FuaW1hdGlvbnMuaGFzT3duUHJvcGVydHkoIHByb3AgKSApIHtcblx0XHRcdFx0X3N0b3BBbmltYXRpb24ocHJvcCk7XG5cdFx0XHR9IFxuXHRcdFx0XG5cdFx0fVxuXHR9LFxuXHRfYW5pbWF0ZVByb3AgPSBmdW5jdGlvbihuYW1lLCBiLCBlbmRQcm9wLCBkLCBlYXNpbmdGbiwgb25VcGRhdGUsIG9uQ29tcGxldGUpIHtcblx0XHR2YXIgc3RhcnRBbmltVGltZSA9IF9nZXRDdXJyZW50VGltZSgpLCB0O1xuXHRcdF9yZWdpc3RlclN0YXJ0QW5pbWF0aW9uKG5hbWUpO1xuXG5cdFx0dmFyIGFuaW1sb29wID0gZnVuY3Rpb24oKXtcblx0XHRcdGlmICggX2FuaW1hdGlvbnNbbmFtZV0gKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHR0ID0gX2dldEN1cnJlbnRUaW1lKCkgLSBzdGFydEFuaW1UaW1lOyAvLyB0aW1lIGRpZmZcblx0XHRcdFx0Ly9iIC0gYmVnaW5uaW5nIChzdGFydCBwcm9wKVxuXHRcdFx0XHQvL2QgLSBhbmltIGR1cmF0aW9uXG5cblx0XHRcdFx0aWYgKCB0ID49IGQgKSB7XG5cdFx0XHRcdFx0X3N0b3BBbmltYXRpb24obmFtZSk7XG5cdFx0XHRcdFx0b25VcGRhdGUoZW5kUHJvcCk7XG5cdFx0XHRcdFx0aWYob25Db21wbGV0ZSkge1xuXHRcdFx0XHRcdFx0b25Db21wbGV0ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0b25VcGRhdGUoIChlbmRQcm9wIC0gYikgKiBlYXNpbmdGbih0L2QpICsgYiApO1xuXG5cdFx0XHRcdF9hbmltYXRpb25zW25hbWVdLnJhZiA9IF9yZXF1ZXN0QUYoYW5pbWxvb3ApO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0YW5pbWxvb3AoKTtcblx0fTtcblx0XG5cblxudmFyIHB1YmxpY01ldGhvZHMgPSB7XG5cblx0Ly8gbWFrZSBhIGZldyBsb2NhbCB2YXJpYWJsZXMgYW5kIGZ1bmN0aW9ucyBwdWJsaWNcblx0c2hvdXQ6IF9zaG91dCxcblx0bGlzdGVuOiBfbGlzdGVuLFxuXHR2aWV3cG9ydFNpemU6IF92aWV3cG9ydFNpemUsXG5cdG9wdGlvbnM6IF9vcHRpb25zLFxuXG5cdGlzTWFpblNjcm9sbEFuaW1hdGluZzogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF9tYWluU2Nyb2xsQW5pbWF0aW5nO1xuXHR9LFxuXHRnZXRab29tTGV2ZWw6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfY3Vyclpvb21MZXZlbDtcblx0fSxcblx0Z2V0Q3VycmVudEluZGV4OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX2N1cnJlbnRJdGVtSW5kZXg7XG5cdH0sXG5cdGlzRHJhZ2dpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfaXNEcmFnZ2luZztcblx0fSxcdFxuXHRpc1pvb21pbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfaXNab29taW5nO1xuXHR9LFxuXHRzZXRTY3JvbGxPZmZzZXQ6IGZ1bmN0aW9uKHgseSkge1xuXHRcdF9vZmZzZXQueCA9IHg7XG5cdFx0X2N1cnJlbnRXaW5kb3dTY3JvbGxZID0gX29mZnNldC55ID0geTtcblx0XHRfc2hvdXQoJ3VwZGF0ZVNjcm9sbE9mZnNldCcsIF9vZmZzZXQpO1xuXHR9LFxuXHRhcHBseVpvb21QYW46IGZ1bmN0aW9uKHpvb21MZXZlbCxwYW5YLHBhblksYWxsb3dSZW5kZXJSZXNvbHV0aW9uKSB7XG5cdFx0X3Bhbk9mZnNldC54ID0gcGFuWDtcblx0XHRfcGFuT2Zmc2V0LnkgPSBwYW5ZO1xuXHRcdF9jdXJyWm9vbUxldmVsID0gem9vbUxldmVsO1xuXHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCBhbGxvd1JlbmRlclJlc29sdXRpb24gKTtcblx0fSxcblxuXHRpbml0OiBmdW5jdGlvbigpIHtcblxuXHRcdGlmKF9pc09wZW4gfHwgX2lzRGVzdHJveWluZykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBpO1xuXG5cdFx0c2VsZi5mcmFtZXdvcmsgPSBmcmFtZXdvcms7IC8vIGJhc2ljIGZ1bmN0aW9uYWxpdHlcblx0XHRzZWxmLnRlbXBsYXRlID0gdGVtcGxhdGU7IC8vIHJvb3QgRE9NIGVsZW1lbnQgb2YgUGhvdG9Td2lwZVxuXHRcdHNlbGYuYmcgPSBmcmFtZXdvcmsuZ2V0Q2hpbGRCeUNsYXNzKHRlbXBsYXRlLCAncHN3cF9fYmcnKTtcblxuXHRcdF9pbml0YWxDbGFzc05hbWUgPSB0ZW1wbGF0ZS5jbGFzc05hbWU7XG5cdFx0X2lzT3BlbiA9IHRydWU7XG5cdFx0XHRcdFxuXHRcdF9mZWF0dXJlcyA9IGZyYW1ld29yay5kZXRlY3RGZWF0dXJlcygpO1xuXHRcdF9yZXF1ZXN0QUYgPSBfZmVhdHVyZXMucmFmO1xuXHRcdF9jYW5jZWxBRiA9IF9mZWF0dXJlcy5jYWY7XG5cdFx0X3RyYW5zZm9ybUtleSA9IF9mZWF0dXJlcy50cmFuc2Zvcm07XG5cdFx0X29sZElFID0gX2ZlYXR1cmVzLm9sZElFO1xuXHRcdFxuXHRcdHNlbGYuc2Nyb2xsV3JhcCA9IGZyYW1ld29yay5nZXRDaGlsZEJ5Q2xhc3ModGVtcGxhdGUsICdwc3dwX19zY3JvbGwtd3JhcCcpO1xuXHRcdHNlbGYuY29udGFpbmVyID0gZnJhbWV3b3JrLmdldENoaWxkQnlDbGFzcyhzZWxmLnNjcm9sbFdyYXAsICdwc3dwX19jb250YWluZXInKTtcblxuXHRcdF9jb250YWluZXJTdHlsZSA9IHNlbGYuY29udGFpbmVyLnN0eWxlOyAvLyBmb3IgZmFzdCBhY2Nlc3NcblxuXHRcdC8vIE9iamVjdHMgdGhhdCBob2xkIHNsaWRlcyAodGhlcmUgYXJlIG9ubHkgMyBpbiBET00pXG5cdFx0c2VsZi5pdGVtSG9sZGVycyA9IF9pdGVtSG9sZGVycyA9IFtcblx0XHRcdHtlbDpzZWxmLmNvbnRhaW5lci5jaGlsZHJlblswXSAsIHdyYXA6MCwgaW5kZXg6IC0xfSxcblx0XHRcdHtlbDpzZWxmLmNvbnRhaW5lci5jaGlsZHJlblsxXSAsIHdyYXA6MCwgaW5kZXg6IC0xfSxcblx0XHRcdHtlbDpzZWxmLmNvbnRhaW5lci5jaGlsZHJlblsyXSAsIHdyYXA6MCwgaW5kZXg6IC0xfVxuXHRcdF07XG5cblx0XHQvLyBoaWRlIG5lYXJieSBpdGVtIGhvbGRlcnMgdW50aWwgaW5pdGlhbCB6b29tIGFuaW1hdGlvbiBmaW5pc2hlcyAodG8gYXZvaWQgZXh0cmEgUGFpbnRzKVxuXHRcdF9pdGVtSG9sZGVyc1swXS5lbC5zdHlsZS5kaXNwbGF5ID0gX2l0ZW1Ib2xkZXJzWzJdLmVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cblx0XHRfc2V0dXBUcmFuc2Zvcm1zKCk7XG5cblx0XHQvLyBTZXR1cCBnbG9iYWwgZXZlbnRzXG5cdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMgPSB7XG5cdFx0XHRyZXNpemU6IHNlbGYudXBkYXRlU2l6ZSxcblx0XHRcdHNjcm9sbDogX3VwZGF0ZVBhZ2VTY3JvbGxPZmZzZXQsXG5cdFx0XHRrZXlkb3duOiBfb25LZXlEb3duLFxuXHRcdFx0Y2xpY2s6IF9vbkdsb2JhbENsaWNrXG5cdFx0fTtcblxuXHRcdC8vIGRpc2FibGUgc2hvdy9oaWRlIGVmZmVjdHMgb24gb2xkIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBDU1MgYW5pbWF0aW9ucyBvciB0cmFuc2Zvcm1zLCBcblx0XHQvLyBvbGQgSU9TLCBBbmRyb2lkIGFuZCBPcGVyYSBtb2JpbGUuIEJsYWNrYmVycnkgc2VlbXMgdG8gd29yayBmaW5lLCBldmVuIG9sZGVyIG1vZGVscy5cblx0XHR2YXIgb2xkUGhvbmUgPSBfZmVhdHVyZXMuaXNPbGRJT1NQaG9uZSB8fCBfZmVhdHVyZXMuaXNPbGRBbmRyb2lkIHx8IF9mZWF0dXJlcy5pc01vYmlsZU9wZXJhO1xuXHRcdGlmKCFfZmVhdHVyZXMuYW5pbWF0aW9uTmFtZSB8fCAhX2ZlYXR1cmVzLnRyYW5zZm9ybSB8fCBvbGRQaG9uZSkge1xuXHRcdFx0X29wdGlvbnMuc2hvd0FuaW1hdGlvbkR1cmF0aW9uID0gX29wdGlvbnMuaGlkZUFuaW1hdGlvbkR1cmF0aW9uID0gMDtcblx0XHR9XG5cblx0XHQvLyBpbml0IG1vZHVsZXNcblx0XHRmb3IoaSA9IDA7IGkgPCBfbW9kdWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0c2VsZlsnaW5pdCcgKyBfbW9kdWxlc1tpXV0oKTtcblx0XHR9XG5cdFx0XG5cdFx0Ly8gaW5pdFxuXHRcdGlmKFVpQ2xhc3MpIHtcblx0XHRcdHZhciB1aSA9IHNlbGYudWkgPSBuZXcgVWlDbGFzcyhzZWxmLCBmcmFtZXdvcmspO1xuXHRcdFx0dWkuaW5pdCgpO1xuXHRcdH1cblxuXHRcdF9zaG91dCgnZmlyc3RVcGRhdGUnKTtcblx0XHRfY3VycmVudEl0ZW1JbmRleCA9IF9jdXJyZW50SXRlbUluZGV4IHx8IF9vcHRpb25zLmluZGV4IHx8IDA7XG5cdFx0Ly8gdmFsaWRhdGUgaW5kZXhcblx0XHRpZiggaXNOYU4oX2N1cnJlbnRJdGVtSW5kZXgpIHx8IF9jdXJyZW50SXRlbUluZGV4IDwgMCB8fCBfY3VycmVudEl0ZW1JbmRleCA+PSBfZ2V0TnVtSXRlbXMoKSApIHtcblx0XHRcdF9jdXJyZW50SXRlbUluZGV4ID0gMDtcblx0XHR9XG5cdFx0c2VsZi5jdXJySXRlbSA9IF9nZXRJdGVtQXQoIF9jdXJyZW50SXRlbUluZGV4ICk7XG5cblx0XHRcblx0XHRpZihfZmVhdHVyZXMuaXNPbGRJT1NQaG9uZSB8fCBfZmVhdHVyZXMuaXNPbGRBbmRyb2lkKSB7XG5cdFx0XHRfaXNGaXhlZFBvc2l0aW9uID0gZmFsc2U7XG5cdFx0fVxuXHRcdFxuXHRcdHRlbXBsYXRlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcblx0XHRpZihfb3B0aW9ucy5tb2RhbCkge1xuXHRcdFx0aWYoIV9pc0ZpeGVkUG9zaXRpb24pIHtcblx0XHRcdFx0dGVtcGxhdGUuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS50b3AgPSBmcmFtZXdvcmsuZ2V0U2Nyb2xsWSgpICsgJ3B4Jztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRlbXBsYXRlLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZihfY3VycmVudFdpbmRvd1Njcm9sbFkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0X3Nob3V0KCdpbml0aWFsTGF5b3V0Jyk7XG5cdFx0XHRfY3VycmVudFdpbmRvd1Njcm9sbFkgPSBfaW5pdGFsV2luZG93U2Nyb2xsWSA9IGZyYW1ld29yay5nZXRTY3JvbGxZKCk7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGFkZCBjbGFzc2VzIHRvIHJvb3QgZWxlbWVudCBvZiBQaG90b1N3aXBlXG5cdFx0dmFyIHJvb3RDbGFzc2VzID0gJ3Bzd3AtLW9wZW4gJztcblx0XHRpZihfb3B0aW9ucy5tYWluQ2xhc3MpIHtcblx0XHRcdHJvb3RDbGFzc2VzICs9IF9vcHRpb25zLm1haW5DbGFzcyArICcgJztcblx0XHR9XG5cdFx0aWYoX29wdGlvbnMuc2hvd0hpZGVPcGFjaXR5KSB7XG5cdFx0XHRyb290Q2xhc3NlcyArPSAncHN3cC0tYW5pbWF0ZV9vcGFjaXR5ICc7XG5cdFx0fVxuXHRcdHJvb3RDbGFzc2VzICs9IF9saWtlbHlUb3VjaERldmljZSA/ICdwc3dwLS10b3VjaCcgOiAncHN3cC0tbm90b3VjaCc7XG5cdFx0cm9vdENsYXNzZXMgKz0gX2ZlYXR1cmVzLmFuaW1hdGlvbk5hbWUgPyAnIHBzd3AtLWNzc19hbmltYXRpb24nIDogJyc7XG5cdFx0cm9vdENsYXNzZXMgKz0gX2ZlYXR1cmVzLnN2ZyA/ICcgcHN3cC0tc3ZnJyA6ICcnO1xuXHRcdGZyYW1ld29yay5hZGRDbGFzcyh0ZW1wbGF0ZSwgcm9vdENsYXNzZXMpO1xuXG5cdFx0c2VsZi51cGRhdGVTaXplKCk7XG5cblx0XHQvLyBpbml0aWFsIHVwZGF0ZVxuXHRcdF9jb250YWluZXJTaGlmdEluZGV4ID0gLTE7XG5cdFx0X2luZGV4RGlmZiA9IG51bGw7XG5cdFx0Zm9yKGkgPSAwOyBpIDwgTlVNX0hPTERFUlM7IGkrKykge1xuXHRcdFx0X3NldFRyYW5zbGF0ZVgoIChpK19jb250YWluZXJTaGlmdEluZGV4KSAqIF9zbGlkZVNpemUueCwgX2l0ZW1Ib2xkZXJzW2ldLmVsLnN0eWxlKTtcblx0XHR9XG5cblx0XHRpZighX29sZElFKSB7XG5cdFx0XHRmcmFtZXdvcmsuYmluZChzZWxmLnNjcm9sbFdyYXAsIF9kb3duRXZlbnRzLCBzZWxmKTsgLy8gbm8gZHJhZ2dpbmcgZm9yIG9sZCBJRVxuXHRcdH1cdFxuXG5cdFx0X2xpc3RlbignaW5pdGlhbFpvb21JbkVuZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zZXRDb250ZW50KF9pdGVtSG9sZGVyc1swXSwgX2N1cnJlbnRJdGVtSW5kZXgtMSk7XG5cdFx0XHRzZWxmLnNldENvbnRlbnQoX2l0ZW1Ib2xkZXJzWzJdLCBfY3VycmVudEl0ZW1JbmRleCsxKTtcblxuXHRcdFx0X2l0ZW1Ib2xkZXJzWzBdLmVsLnN0eWxlLmRpc3BsYXkgPSBfaXRlbUhvbGRlcnNbMl0uZWwuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cblx0XHRcdGlmKF9vcHRpb25zLmZvY3VzKSB7XG5cdFx0XHRcdC8vIGZvY3VzIGNhdXNlcyBsYXlvdXQsIFxuXHRcdFx0XHQvLyB3aGljaCBjYXVzZXMgbGFnIGR1cmluZyB0aGUgYW5pbWF0aW9uLCBcblx0XHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSBkZWxheSBpdCB1bnRpbGwgdGhlIGluaXRpYWwgem9vbSB0cmFuc2l0aW9uIGVuZHNcblx0XHRcdFx0dGVtcGxhdGUuZm9jdXMoKTtcblx0XHRcdH1cblx0XHRcdCBcblxuXHRcdFx0X2JpbmRFdmVudHMoKTtcblx0XHR9KTtcblxuXHRcdC8vIHNldCBjb250ZW50IGZvciBjZW50ZXIgc2xpZGUgKGZpcnN0IHRpbWUpXG5cdFx0c2VsZi5zZXRDb250ZW50KF9pdGVtSG9sZGVyc1sxXSwgX2N1cnJlbnRJdGVtSW5kZXgpO1xuXHRcdFxuXHRcdHNlbGYudXBkYXRlQ3Vyckl0ZW0oKTtcblxuXHRcdF9zaG91dCgnYWZ0ZXJJbml0Jyk7XG5cblx0XHRpZighX2lzRml4ZWRQb3NpdGlvbikge1xuXG5cdFx0XHQvLyBPbiBhbGwgdmVyc2lvbnMgb2YgaU9TIGxvd2VyIHRoYW4gOC4wLCB3ZSBjaGVjayBzaXplIG9mIHZpZXdwb3J0IGV2ZXJ5IHNlY29uZC5cblx0XHRcdC8vIFxuXHRcdFx0Ly8gVGhpcyBpcyBkb25lIHRvIGRldGVjdCB3aGVuIFNhZmFyaSB0b3AgJiBib3R0b20gYmFycyBhcHBlYXIsIFxuXHRcdFx0Ly8gYXMgdGhpcyBhY3Rpb24gZG9lc24ndCB0cmlnZ2VyIGFueSBldmVudHMgKGxpa2UgcmVzaXplKS4gXG5cdFx0XHQvLyBcblx0XHRcdC8vIE9uIGlPUzggdGhleSBmaXhlZCB0aGlzLlxuXHRcdFx0Ly8gXG5cdFx0XHQvLyAxMCBOb3YgMjAxNDogaU9TIDcgdXNhZ2UgfjQwJS4gaU9TIDggdXNhZ2UgNTYlLlxuXHRcdFx0XG5cdFx0XHRfdXBkYXRlU2l6ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmKCFfbnVtQW5pbWF0aW9ucyAmJiAhX2lzRHJhZ2dpbmcgJiYgIV9pc1pvb21pbmcgJiYgKF9jdXJyWm9vbUxldmVsID09PSBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwpICApIHtcblx0XHRcdFx0XHRzZWxmLnVwZGF0ZVNpemUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgMTAwMCk7XG5cdFx0fVxuXG5cdFx0ZnJhbWV3b3JrLmFkZENsYXNzKHRlbXBsYXRlLCAncHN3cC0tdmlzaWJsZScpO1xuXHR9LFxuXG5cdC8vIENsb3NlIHRoZSBnYWxsZXJ5LCB0aGVuIGRlc3Ryb3kgaXRcblx0Y2xvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdGlmKCFfaXNPcGVuKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0X2lzT3BlbiA9IGZhbHNlO1xuXHRcdF9pc0Rlc3Ryb3lpbmcgPSB0cnVlO1xuXHRcdF9zaG91dCgnY2xvc2UnKTtcblx0XHRfdW5iaW5kRXZlbnRzKCk7XG5cblx0XHRfc2hvd09ySGlkZShzZWxmLmN1cnJJdGVtLCBudWxsLCB0cnVlLCBzZWxmLmRlc3Ryb3kpO1xuXHR9LFxuXG5cdC8vIGRlc3Ryb3lzIHRoZSBnYWxsZXJ5ICh1bmJpbmRzIGV2ZW50cywgY2xlYW5zIHVwIGludGVydmFscyBhbmQgdGltZW91dHMgdG8gYXZvaWQgbWVtb3J5IGxlYWtzKVxuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHRfc2hvdXQoJ2Rlc3Ryb3knKTtcblxuXHRcdGlmKF9zaG93T3JIaWRlVGltZW91dCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9zaG93T3JIaWRlVGltZW91dCk7XG5cdFx0fVxuXHRcdFxuXHRcdHRlbXBsYXRlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXHRcdHRlbXBsYXRlLmNsYXNzTmFtZSA9IF9pbml0YWxDbGFzc05hbWU7XG5cblx0XHRpZihfdXBkYXRlU2l6ZUludGVydmFsKSB7XG5cdFx0XHRjbGVhckludGVydmFsKF91cGRhdGVTaXplSW50ZXJ2YWwpO1xuXHRcdH1cblxuXHRcdGZyYW1ld29yay51bmJpbmQoc2VsZi5zY3JvbGxXcmFwLCBfZG93bkV2ZW50cywgc2VsZik7XG5cblx0XHQvLyB3ZSB1bmJpbmQgc2Nyb2xsIGV2ZW50IGF0IHRoZSBlbmQsIGFzIGNsb3NpbmcgYW5pbWF0aW9uIG1heSBkZXBlbmQgb24gaXRcblx0XHRmcmFtZXdvcmsudW5iaW5kKHdpbmRvdywgJ3Njcm9sbCcsIHNlbGYpO1xuXG5cdFx0X3N0b3BEcmFnVXBkYXRlTG9vcCgpO1xuXG5cdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cblx0XHRfbGlzdGVuZXJzID0gbnVsbDtcblx0fSxcblxuXHQvKipcblx0ICogUGFuIGltYWdlIHRvIHBvc2l0aW9uXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSB4ICAgICBcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgIFxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IGZvcmNlIFdpbGwgaWdub3JlIGJvdW5kcyBpZiBzZXQgdG8gdHJ1ZS5cblx0ICovXG5cdHBhblRvOiBmdW5jdGlvbih4LHksZm9yY2UpIHtcblx0XHRpZighZm9yY2UpIHtcblx0XHRcdGlmKHggPiBfY3VyclBhbkJvdW5kcy5taW4ueCkge1xuXHRcdFx0XHR4ID0gX2N1cnJQYW5Cb3VuZHMubWluLng7XG5cdFx0XHR9IGVsc2UgaWYoeCA8IF9jdXJyUGFuQm91bmRzLm1heC54KSB7XG5cdFx0XHRcdHggPSBfY3VyclBhbkJvdW5kcy5tYXgueDtcblx0XHRcdH1cblxuXHRcdFx0aWYoeSA+IF9jdXJyUGFuQm91bmRzLm1pbi55KSB7XG5cdFx0XHRcdHkgPSBfY3VyclBhbkJvdW5kcy5taW4ueTtcblx0XHRcdH0gZWxzZSBpZih5IDwgX2N1cnJQYW5Cb3VuZHMubWF4LnkpIHtcblx0XHRcdFx0eSA9IF9jdXJyUGFuQm91bmRzLm1heC55O1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHRfcGFuT2Zmc2V0LnggPSB4O1xuXHRcdF9wYW5PZmZzZXQueSA9IHk7XG5cdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcblx0fSxcblx0XG5cdGhhbmRsZUV2ZW50OiBmdW5jdGlvbiAoZSkge1xuXHRcdGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcblx0XHRpZihfZ2xvYmFsRXZlbnRIYW5kbGVyc1tlLnR5cGVdKSB7XG5cdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tlLnR5cGVdKGUpO1xuXHRcdH1cblx0fSxcblxuXG5cdGdvVG86IGZ1bmN0aW9uKGluZGV4KSB7XG5cblx0XHRpbmRleCA9IF9nZXRMb29wZWRJZChpbmRleCk7XG5cblx0XHR2YXIgZGlmZiA9IGluZGV4IC0gX2N1cnJlbnRJdGVtSW5kZXg7XG5cdFx0X2luZGV4RGlmZiA9IGRpZmY7XG5cblx0XHRfY3VycmVudEl0ZW1JbmRleCA9IGluZGV4O1xuXHRcdHNlbGYuY3Vyckl0ZW0gPSBfZ2V0SXRlbUF0KCBfY3VycmVudEl0ZW1JbmRleCApO1xuXHRcdF9jdXJyUG9zaXRpb25JbmRleCAtPSBkaWZmO1xuXHRcdFxuXHRcdF9tb3ZlTWFpblNjcm9sbChfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXgpO1xuXHRcdFxuXG5cdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cdFx0X21haW5TY3JvbGxBbmltYXRpbmcgPSBmYWxzZTtcblxuXHRcdHNlbGYudXBkYXRlQ3Vyckl0ZW0oKTtcblx0fSxcblx0bmV4dDogZnVuY3Rpb24oKSB7XG5cdFx0c2VsZi5nb1RvKCBfY3VycmVudEl0ZW1JbmRleCArIDEpO1xuXHR9LFxuXHRwcmV2OiBmdW5jdGlvbigpIHtcblx0XHRzZWxmLmdvVG8oIF9jdXJyZW50SXRlbUluZGV4IC0gMSk7XG5cdH0sXG5cblx0Ly8gdXBkYXRlIGN1cnJlbnQgem9vbS9wYW4gb2JqZWN0c1xuXHR1cGRhdGVDdXJyWm9vbUl0ZW06IGZ1bmN0aW9uKGVtdWxhdGVTZXRDb250ZW50KSB7XG5cdFx0aWYoZW11bGF0ZVNldENvbnRlbnQpIHtcblx0XHRcdF9zaG91dCgnYmVmb3JlQ2hhbmdlJywgMCk7XG5cdFx0fVxuXG5cdFx0Ly8gaXRlbUhvbGRlclsxXSBpcyBtaWRkbGUgKGN1cnJlbnQpIGl0ZW1cblx0XHRpZihfaXRlbUhvbGRlcnNbMV0uZWwuY2hpbGRyZW4ubGVuZ3RoKSB7XG5cdFx0XHR2YXIgem9vbUVsZW1lbnQgPSBfaXRlbUhvbGRlcnNbMV0uZWwuY2hpbGRyZW5bMF07XG5cdFx0XHRpZiggZnJhbWV3b3JrLmhhc0NsYXNzKHpvb21FbGVtZW50LCAncHN3cF9fem9vbS13cmFwJykgKSB7XG5cdFx0XHRcdF9jdXJyWm9vbUVsZW1lbnRTdHlsZSA9IHpvb21FbGVtZW50LnN0eWxlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gbnVsbDtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0X2N1cnJab29tRWxlbWVudFN0eWxlID0gbnVsbDtcblx0XHR9XG5cdFx0XG5cdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcdFxuXHRcdF9zdGFydFpvb21MZXZlbCA9IF9jdXJyWm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXG5cdFx0X3Bhbk9mZnNldC54ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLng7XG5cdFx0X3Bhbk9mZnNldC55ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLnk7XG5cblx0XHRpZihlbXVsYXRlU2V0Q29udGVudCkge1xuXHRcdFx0X3Nob3V0KCdhZnRlckNoYW5nZScpO1xuXHRcdH1cblx0fSxcblxuXG5cdGludmFsaWRhdGVDdXJySXRlbXM6IGZ1bmN0aW9uKCkge1xuXHRcdF9pdGVtc05lZWRVcGRhdGUgPSB0cnVlO1xuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBOVU1fSE9MREVSUzsgaSsrKSB7XG5cdFx0XHRpZiggX2l0ZW1Ib2xkZXJzW2ldLml0ZW0gKSB7XG5cdFx0XHRcdF9pdGVtSG9sZGVyc1tpXS5pdGVtLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0dXBkYXRlQ3Vyckl0ZW06IGZ1bmN0aW9uKGJlZm9yZUFuaW1hdGlvbikge1xuXG5cdFx0aWYoX2luZGV4RGlmZiA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBkaWZmQWJzID0gTWF0aC5hYnMoX2luZGV4RGlmZiksXG5cdFx0XHR0ZW1wSG9sZGVyO1xuXG5cdFx0aWYoYmVmb3JlQW5pbWF0aW9uICYmIGRpZmZBYnMgPCAyKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cblx0XHRzZWxmLmN1cnJJdGVtID0gX2dldEl0ZW1BdCggX2N1cnJlbnRJdGVtSW5kZXggKTtcblx0XHRfcmVuZGVyTWF4UmVzb2x1dGlvbiA9IGZhbHNlO1xuXHRcdFxuXHRcdF9zaG91dCgnYmVmb3JlQ2hhbmdlJywgX2luZGV4RGlmZik7XG5cblx0XHRpZihkaWZmQWJzID49IE5VTV9IT0xERVJTKSB7XG5cdFx0XHRfY29udGFpbmVyU2hpZnRJbmRleCArPSBfaW5kZXhEaWZmICsgKF9pbmRleERpZmYgPiAwID8gLU5VTV9IT0xERVJTIDogTlVNX0hPTERFUlMpO1xuXHRcdFx0ZGlmZkFicyA9IE5VTV9IT0xERVJTO1xuXHRcdH1cblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgZGlmZkFiczsgaSsrKSB7XG5cdFx0XHRpZihfaW5kZXhEaWZmID4gMCkge1xuXHRcdFx0XHR0ZW1wSG9sZGVyID0gX2l0ZW1Ib2xkZXJzLnNoaWZ0KCk7XG5cdFx0XHRcdF9pdGVtSG9sZGVyc1tOVU1fSE9MREVSUy0xXSA9IHRlbXBIb2xkZXI7IC8vIG1vdmUgZmlyc3QgdG8gbGFzdFxuXG5cdFx0XHRcdF9jb250YWluZXJTaGlmdEluZGV4Kys7XG5cdFx0XHRcdF9zZXRUcmFuc2xhdGVYKCAoX2NvbnRhaW5lclNoaWZ0SW5kZXgrMikgKiBfc2xpZGVTaXplLngsIHRlbXBIb2xkZXIuZWwuc3R5bGUpO1xuXHRcdFx0XHRzZWxmLnNldENvbnRlbnQodGVtcEhvbGRlciwgX2N1cnJlbnRJdGVtSW5kZXggLSBkaWZmQWJzICsgaSArIDEgKyAxKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRlbXBIb2xkZXIgPSBfaXRlbUhvbGRlcnMucG9wKCk7XG5cdFx0XHRcdF9pdGVtSG9sZGVycy51bnNoaWZ0KCB0ZW1wSG9sZGVyICk7IC8vIG1vdmUgbGFzdCB0byBmaXJzdFxuXG5cdFx0XHRcdF9jb250YWluZXJTaGlmdEluZGV4LS07XG5cdFx0XHRcdF9zZXRUcmFuc2xhdGVYKCBfY29udGFpbmVyU2hpZnRJbmRleCAqIF9zbGlkZVNpemUueCwgdGVtcEhvbGRlci5lbC5zdHlsZSk7XG5cdFx0XHRcdHNlbGYuc2V0Q29udGVudCh0ZW1wSG9sZGVyLCBfY3VycmVudEl0ZW1JbmRleCArIGRpZmZBYnMgLSBpIC0gMSAtIDEpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fVxuXG5cdFx0Ly8gcmVzZXQgem9vbS9wYW4gb24gcHJldmlvdXMgaXRlbVxuXHRcdGlmKF9jdXJyWm9vbUVsZW1lbnRTdHlsZSAmJiBNYXRoLmFicyhfaW5kZXhEaWZmKSA9PT0gMSkge1xuXG5cdFx0XHR2YXIgcHJldkl0ZW0gPSBfZ2V0SXRlbUF0KF9wcmV2SXRlbUluZGV4KTtcblx0XHRcdGlmKHByZXZJdGVtLmluaXRpYWxab29tTGV2ZWwgIT09IF9jdXJyWm9vbUxldmVsKSB7XG5cdFx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShwcmV2SXRlbSAsIF92aWV3cG9ydFNpemUgKTtcblx0XHRcdFx0X3NldEltYWdlU2l6ZShwcmV2SXRlbSk7XG5cdFx0XHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0oIHByZXZJdGVtICk7IFx0XHRcdFx0XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHQvLyByZXNldCBkaWZmIGFmdGVyIHVwZGF0ZVxuXHRcdF9pbmRleERpZmYgPSAwO1xuXG5cdFx0c2VsZi51cGRhdGVDdXJyWm9vbUl0ZW0oKTtcblxuXHRcdF9wcmV2SXRlbUluZGV4ID0gX2N1cnJlbnRJdGVtSW5kZXg7XG5cblx0XHRfc2hvdXQoJ2FmdGVyQ2hhbmdlJyk7XG5cdFx0XG5cdH0sXG5cblxuXG5cdHVwZGF0ZVNpemU6IGZ1bmN0aW9uKGZvcmNlKSB7XG5cdFx0XG5cdFx0aWYoIV9pc0ZpeGVkUG9zaXRpb24gJiYgX29wdGlvbnMubW9kYWwpIHtcblx0XHRcdHZhciB3aW5kb3dTY3JvbGxZID0gZnJhbWV3b3JrLmdldFNjcm9sbFkoKTtcblx0XHRcdGlmKF9jdXJyZW50V2luZG93U2Nyb2xsWSAhPT0gd2luZG93U2Nyb2xsWSkge1xuXHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS50b3AgPSB3aW5kb3dTY3JvbGxZICsgJ3B4Jztcblx0XHRcdFx0X2N1cnJlbnRXaW5kb3dTY3JvbGxZID0gd2luZG93U2Nyb2xsWTtcblx0XHRcdH1cblx0XHRcdGlmKCFmb3JjZSAmJiBfd2luZG93VmlzaWJsZVNpemUueCA9PT0gd2luZG93LmlubmVyV2lkdGggJiYgX3dpbmRvd1Zpc2libGVTaXplLnkgPT09IHdpbmRvdy5pbm5lckhlaWdodCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRfd2luZG93VmlzaWJsZVNpemUueCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRcdFx0X3dpbmRvd1Zpc2libGVTaXplLnkgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cblx0XHRcdC8vdGVtcGxhdGUuc3R5bGUud2lkdGggPSBfd2luZG93VmlzaWJsZVNpemUueCArICdweCc7XG5cdFx0XHR0ZW1wbGF0ZS5zdHlsZS5oZWlnaHQgPSBfd2luZG93VmlzaWJsZVNpemUueSArICdweCc7XG5cdFx0fVxuXG5cblxuXHRcdF92aWV3cG9ydFNpemUueCA9IHNlbGYuc2Nyb2xsV3JhcC5jbGllbnRXaWR0aDtcblx0XHRfdmlld3BvcnRTaXplLnkgPSBzZWxmLnNjcm9sbFdyYXAuY2xpZW50SGVpZ2h0O1xuXG5cdFx0X3VwZGF0ZVBhZ2VTY3JvbGxPZmZzZXQoKTtcblxuXHRcdF9zbGlkZVNpemUueCA9IF92aWV3cG9ydFNpemUueCArIE1hdGgucm91bmQoX3ZpZXdwb3J0U2l6ZS54ICogX29wdGlvbnMuc3BhY2luZyk7XG5cdFx0X3NsaWRlU2l6ZS55ID0gX3ZpZXdwb3J0U2l6ZS55O1xuXG5cdFx0X21vdmVNYWluU2Nyb2xsKF9zbGlkZVNpemUueCAqIF9jdXJyUG9zaXRpb25JbmRleCk7XG5cblx0XHRfc2hvdXQoJ2JlZm9yZVJlc2l6ZScpOyAvLyBldmVuIG1heSBiZSB1c2VkIGZvciBleGFtcGxlIHRvIHN3aXRjaCBpbWFnZSBzb3VyY2VzXG5cblxuXHRcdC8vIGRvbid0IHJlLWNhbGN1bGF0ZSBzaXplIG9uIGluaXRhbCBzaXplIHVwZGF0ZVxuXHRcdGlmKF9jb250YWluZXJTaGlmdEluZGV4ICE9PSB1bmRlZmluZWQpIHtcblxuXHRcdFx0dmFyIGhvbGRlcixcblx0XHRcdFx0aXRlbSxcblx0XHRcdFx0aEluZGV4O1xuXG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgTlVNX0hPTERFUlM7IGkrKykge1xuXHRcdFx0XHRob2xkZXIgPSBfaXRlbUhvbGRlcnNbaV07XG5cdFx0XHRcdF9zZXRUcmFuc2xhdGVYKCAoaStfY29udGFpbmVyU2hpZnRJbmRleCkgKiBfc2xpZGVTaXplLngsIGhvbGRlci5lbC5zdHlsZSk7XG5cblx0XHRcdFx0aEluZGV4ID0gX2N1cnJlbnRJdGVtSW5kZXgraS0xO1xuXG5cdFx0XHRcdGlmKF9vcHRpb25zLmxvb3AgJiYgX2dldE51bUl0ZW1zKCkgPiAyKSB7XG5cdFx0XHRcdFx0aEluZGV4ID0gX2dldExvb3BlZElkKGhJbmRleCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyB1cGRhdGUgem9vbSBsZXZlbCBvbiBpdGVtcyBhbmQgcmVmcmVzaCBzb3VyY2UgKGlmIG5lZWRzVXBkYXRlKVxuXHRcdFx0XHRpdGVtID0gX2dldEl0ZW1BdCggaEluZGV4ICk7XG5cblx0XHRcdFx0Ly8gcmUtcmVuZGVyIGdhbGxlcnkgaXRlbSBpZiBgbmVlZHNVcGRhdGVgLFxuXHRcdFx0XHQvLyBvciBkb2Vzbid0IGhhdmUgYGJvdW5kc2AgKGVudGlyZWx5IG5ldyBzbGlkZSBvYmplY3QpXG5cdFx0XHRcdGlmKCBpdGVtICYmIChfaXRlbXNOZWVkVXBkYXRlIHx8IGl0ZW0ubmVlZHNVcGRhdGUgfHwgIWl0ZW0uYm91bmRzKSApIHtcblxuXHRcdFx0XHRcdHNlbGYuY2xlYW5TbGlkZSggaXRlbSApO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHNlbGYuc2V0Q29udGVudCggaG9sZGVyLCBoSW5kZXggKTtcblxuXHRcdFx0XHRcdC8vIGlmIFwiY2VudGVyXCIgc2xpZGVcblx0XHRcdFx0XHRpZihpID09PSAxKSB7XG5cdFx0XHRcdFx0XHRzZWxmLmN1cnJJdGVtID0gaXRlbTtcblx0XHRcdFx0XHRcdHNlbGYudXBkYXRlQ3Vyclpvb21JdGVtKHRydWUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGl0ZW0ubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuXHRcdFx0XHR9IGVsc2UgaWYoaG9sZGVyLmluZGV4ID09PSAtMSAmJiBoSW5kZXggPj0gMCkge1xuXHRcdFx0XHRcdC8vIGFkZCBjb250ZW50IGZpcnN0IHRpbWVcblx0XHRcdFx0XHRzZWxmLnNldENvbnRlbnQoIGhvbGRlciwgaEluZGV4ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoaXRlbSAmJiBpdGVtLmNvbnRhaW5lcikge1xuXHRcdFx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShpdGVtLCBfdmlld3BvcnRTaXplKTtcblx0XHRcdFx0XHRfc2V0SW1hZ2VTaXplKGl0ZW0pO1xuXHRcdFx0XHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0oIGl0ZW0gKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdF9pdGVtc05lZWRVcGRhdGUgPSBmYWxzZTtcblx0XHR9XHRcblxuXHRcdF9zdGFydFpvb21MZXZlbCA9IF9jdXJyWm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXHRcdF9jdXJyUGFuQm91bmRzID0gc2VsZi5jdXJySXRlbS5ib3VuZHM7XG5cblx0XHRpZihfY3VyclBhbkJvdW5kcykge1xuXHRcdFx0X3Bhbk9mZnNldC54ID0gX2N1cnJQYW5Cb3VuZHMuY2VudGVyLng7XG5cdFx0XHRfcGFuT2Zmc2V0LnkgPSBfY3VyclBhbkJvdW5kcy5jZW50ZXIueTtcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCB0cnVlICk7XG5cdFx0fVxuXHRcdFxuXHRcdF9zaG91dCgncmVzaXplJyk7XG5cdH0sXG5cdFxuXHQvLyBab29tIGN1cnJlbnQgaXRlbSB0b1xuXHR6b29tVG86IGZ1bmN0aW9uKGRlc3Rab29tTGV2ZWwsIGNlbnRlclBvaW50LCBzcGVlZCwgZWFzaW5nRm4sIHVwZGF0ZUZuKSB7XG5cdFx0Lypcblx0XHRcdGlmKGRlc3Rab29tTGV2ZWwgPT09ICdmaXQnKSB7XG5cdFx0XHRcdGRlc3Rab29tTGV2ZWwgPSBzZWxmLmN1cnJJdGVtLmZpdFJhdGlvO1xuXHRcdFx0fSBlbHNlIGlmKGRlc3Rab29tTGV2ZWwgPT09ICdmaWxsJykge1xuXHRcdFx0XHRkZXN0Wm9vbUxldmVsID0gc2VsZi5jdXJySXRlbS5maWxsUmF0aW87XG5cdFx0XHR9XG5cdFx0Ki9cblxuXHRcdGlmKGNlbnRlclBvaW50KSB7XG5cdFx0XHRfc3RhcnRab29tTGV2ZWwgPSBfY3Vyclpvb21MZXZlbDtcblx0XHRcdF9taWRab29tUG9pbnQueCA9IE1hdGguYWJzKGNlbnRlclBvaW50LngpIC0gX3Bhbk9mZnNldC54IDtcblx0XHRcdF9taWRab29tUG9pbnQueSA9IE1hdGguYWJzKGNlbnRlclBvaW50LnkpIC0gX3Bhbk9mZnNldC55IDtcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfc3RhcnRQYW5PZmZzZXQsIF9wYW5PZmZzZXQpO1xuXHRcdH1cblxuXHRcdHZhciBkZXN0UGFuQm91bmRzID0gX2NhbGN1bGF0ZVBhbkJvdW5kcyhkZXN0Wm9vbUxldmVsLCBmYWxzZSksXG5cdFx0XHRkZXN0UGFuT2Zmc2V0ID0ge307XG5cblx0XHRfbW9kaWZ5RGVzdFBhbk9mZnNldCgneCcsIGRlc3RQYW5Cb3VuZHMsIGRlc3RQYW5PZmZzZXQsIGRlc3Rab29tTGV2ZWwpO1xuXHRcdF9tb2RpZnlEZXN0UGFuT2Zmc2V0KCd5JywgZGVzdFBhbkJvdW5kcywgZGVzdFBhbk9mZnNldCwgZGVzdFpvb21MZXZlbCk7XG5cblx0XHR2YXIgaW5pdGlhbFpvb21MZXZlbCA9IF9jdXJyWm9vbUxldmVsO1xuXHRcdHZhciBpbml0aWFsUGFuT2Zmc2V0ID0ge1xuXHRcdFx0eDogX3Bhbk9mZnNldC54LFxuXHRcdFx0eTogX3Bhbk9mZnNldC55XG5cdFx0fTtcblxuXHRcdF9yb3VuZFBvaW50KGRlc3RQYW5PZmZzZXQpO1xuXG5cdFx0dmFyIG9uVXBkYXRlID0gZnVuY3Rpb24obm93KSB7XG5cdFx0XHRpZihub3cgPT09IDEpIHtcblx0XHRcdFx0X2N1cnJab29tTGV2ZWwgPSBkZXN0Wm9vbUxldmVsO1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnggPSBkZXN0UGFuT2Zmc2V0Lng7XG5cdFx0XHRcdF9wYW5PZmZzZXQueSA9IGRlc3RQYW5PZmZzZXQueTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gKGRlc3Rab29tTGV2ZWwgLSBpbml0aWFsWm9vbUxldmVsKSAqIG5vdyArIGluaXRpYWxab29tTGV2ZWw7XG5cdFx0XHRcdF9wYW5PZmZzZXQueCA9IChkZXN0UGFuT2Zmc2V0LnggLSBpbml0aWFsUGFuT2Zmc2V0LngpICogbm93ICsgaW5pdGlhbFBhbk9mZnNldC54O1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSAoZGVzdFBhbk9mZnNldC55IC0gaW5pdGlhbFBhbk9mZnNldC55KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueTtcblx0XHRcdH1cblxuXHRcdFx0aWYodXBkYXRlRm4pIHtcblx0XHRcdFx0dXBkYXRlRm4obm93KTtcblx0XHRcdH1cblxuXHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oIG5vdyA9PT0gMSApO1xuXHRcdH07XG5cblx0XHRpZihzcGVlZCkge1xuXHRcdFx0X2FuaW1hdGVQcm9wKCdjdXN0b21ab29tVG8nLCAwLCAxLCBzcGVlZCwgZWFzaW5nRm4gfHwgZnJhbWV3b3JrLmVhc2luZy5zaW5lLmluT3V0LCBvblVwZGF0ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9uVXBkYXRlKDEpO1xuXHRcdH1cblx0fVxuXG5cbn07XG5cblxuLyo+PmNvcmUqL1xuXG4vKj4+Z2VzdHVyZXMqL1xuLyoqXG4gKiBNb3VzZS90b3VjaC9wb2ludGVyIGV2ZW50IGhhbmRsZXJzLlxuICogXG4gKiBzZXBhcmF0ZWQgZnJvbSBAY29yZS5qcyBmb3IgcmVhZGFiaWxpdHlcbiAqL1xuXG52YXIgTUlOX1NXSVBFX0RJU1RBTkNFID0gMzAsXG5cdERJUkVDVElPTl9DSEVDS19PRkZTRVQgPSAxMDsgLy8gYW1vdW50IG9mIHBpeGVscyB0byBkcmFnIHRvIGRldGVybWluZSBkaXJlY3Rpb24gb2Ygc3dpcGVcblxudmFyIF9nZXN0dXJlU3RhcnRUaW1lLFxuXHRfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lLFxuXG5cdC8vIHBvb2wgb2Ygb2JqZWN0cyB0aGF0IGFyZSB1c2VkIGR1cmluZyBkcmFnZ2luZyBvZiB6b29taW5nXG5cdHAgPSB7fSwgLy8gZmlyc3QgcG9pbnRcblx0cDIgPSB7fSwgLy8gc2Vjb25kIHBvaW50IChmb3Igem9vbSBnZXN0dXJlKVxuXHRkZWx0YSA9IHt9LFxuXHRfY3VyclBvaW50ID0ge30sXG5cdF9zdGFydFBvaW50ID0ge30sXG5cdF9jdXJyUG9pbnRlcnMgPSBbXSxcblx0X3N0YXJ0TWFpblNjcm9sbFBvcyA9IHt9LFxuXHRfcmVsZWFzZUFuaW1EYXRhLFxuXHRfcG9zUG9pbnRzID0gW10sIC8vIGFycmF5IG9mIHBvaW50cyBkdXJpbmcgZHJhZ2dpbmcsIHVzZWQgdG8gZGV0ZXJtaW5lIHR5cGUgb2YgZ2VzdHVyZVxuXHRfdGVtcFBvaW50ID0ge30sXG5cblx0X2lzWm9vbWluZ0luLFxuXHRfdmVydGljYWxEcmFnSW5pdGlhdGVkLFxuXHRfb2xkQW5kcm9pZFRvdWNoRW5kVGltZW91dCxcblx0X2N1cnJab29tZWRJdGVtSW5kZXggPSAwLFxuXHRfY2VudGVyUG9pbnQgPSBfZ2V0RW1wdHlQb2ludCgpLFxuXHRfbGFzdFJlbGVhc2VUaW1lID0gMCxcblx0X2lzRHJhZ2dpbmcsIC8vIGF0IGxlYXN0IG9uZSBwb2ludGVyIGlzIGRvd25cblx0X2lzTXVsdGl0b3VjaCwgLy8gYXQgbGVhc3QgdHdvIF9wb2ludGVycyBhcmUgZG93blxuXHRfem9vbVN0YXJ0ZWQsIC8vIHpvb20gbGV2ZWwgY2hhbmdlZCBkdXJpbmcgem9vbSBnZXN0dXJlXG5cdF9tb3ZlZCxcblx0X2RyYWdBbmltRnJhbWUsXG5cdF9tYWluU2Nyb2xsU2hpZnRlZCxcblx0X2N1cnJlbnRQb2ludHMsIC8vIGFycmF5IG9mIGN1cnJlbnQgdG91Y2ggcG9pbnRzXG5cdF9pc1pvb21pbmcsXG5cdF9jdXJyUG9pbnRzRGlzdGFuY2UsXG5cdF9zdGFydFBvaW50c0Rpc3RhbmNlLFxuXHRfY3VyclBhbkJvdW5kcyxcblx0X21haW5TY3JvbGxQb3MgPSBfZ2V0RW1wdHlQb2ludCgpLFxuXHRfY3Vyclpvb21FbGVtZW50U3R5bGUsXG5cdF9tYWluU2Nyb2xsQW5pbWF0aW5nLCAvLyB0cnVlLCBpZiBhbmltYXRpb24gYWZ0ZXIgc3dpcGUgZ2VzdHVyZSBpcyBydW5uaW5nXG5cdF9taWRab29tUG9pbnQgPSBfZ2V0RW1wdHlQb2ludCgpLFxuXHRfY3VyckNlbnRlclBvaW50ID0gX2dldEVtcHR5UG9pbnQoKSxcblx0X2RpcmVjdGlvbixcblx0X2lzRmlyc3RNb3ZlLFxuXHRfb3BhY2l0eUNoYW5nZWQsXG5cdF9iZ09wYWNpdHksXG5cdF93YXNPdmVySW5pdGlhbFpvb20sXG5cblx0X2lzRXF1YWxQb2ludHMgPSBmdW5jdGlvbihwMSwgcDIpIHtcblx0XHRyZXR1cm4gcDEueCA9PT0gcDIueCAmJiBwMS55ID09PSBwMi55O1xuXHR9LFxuXHRfaXNOZWFyYnlQb2ludHMgPSBmdW5jdGlvbih0b3VjaDAsIHRvdWNoMSkge1xuXHRcdHJldHVybiBNYXRoLmFicyh0b3VjaDAueCAtIHRvdWNoMS54KSA8IERPVUJMRV9UQVBfUkFESVVTICYmIE1hdGguYWJzKHRvdWNoMC55IC0gdG91Y2gxLnkpIDwgRE9VQkxFX1RBUF9SQURJVVM7XG5cdH0sXG5cdF9jYWxjdWxhdGVQb2ludHNEaXN0YW5jZSA9IGZ1bmN0aW9uKHAxLCBwMikge1xuXHRcdF90ZW1wUG9pbnQueCA9IE1hdGguYWJzKCBwMS54IC0gcDIueCApO1xuXHRcdF90ZW1wUG9pbnQueSA9IE1hdGguYWJzKCBwMS55IC0gcDIueSApO1xuXHRcdHJldHVybiBNYXRoLnNxcnQoX3RlbXBQb2ludC54ICogX3RlbXBQb2ludC54ICsgX3RlbXBQb2ludC55ICogX3RlbXBQb2ludC55KTtcblx0fSxcblx0X3N0b3BEcmFnVXBkYXRlTG9vcCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmKF9kcmFnQW5pbUZyYW1lKSB7XG5cdFx0XHRfY2FuY2VsQUYoX2RyYWdBbmltRnJhbWUpO1xuXHRcdFx0X2RyYWdBbmltRnJhbWUgPSBudWxsO1xuXHRcdH1cblx0fSxcblx0X2RyYWdVcGRhdGVMb29wID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYoX2lzRHJhZ2dpbmcpIHtcblx0XHRcdF9kcmFnQW5pbUZyYW1lID0gX3JlcXVlc3RBRihfZHJhZ1VwZGF0ZUxvb3ApO1xuXHRcdFx0X3JlbmRlck1vdmVtZW50KCk7XG5cdFx0fVxuXHR9LFxuXHRfY2FuUGFuID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICEoX29wdGlvbnMuc2NhbGVNb2RlID09PSAnZml0JyAmJiBfY3Vyclpvb21MZXZlbCA9PT0gIHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCk7XG5cdH0sXG5cdFxuXHQvLyBmaW5kIHRoZSBjbG9zZXN0IHBhcmVudCBET00gZWxlbWVudFxuXHRfY2xvc2VzdEVsZW1lbnQgPSBmdW5jdGlvbihlbCwgZm4pIHtcblx0ICBcdGlmKCFlbCB8fCBlbCA9PT0gZG9jdW1lbnQpIHtcblx0ICBcdFx0cmV0dXJuIGZhbHNlO1xuXHQgIFx0fVxuXG5cdCAgXHQvLyBkb24ndCBzZWFyY2ggZWxlbWVudHMgYWJvdmUgcHN3cF9fc2Nyb2xsLXdyYXBcblx0ICBcdGlmKGVsLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSAmJiBlbC5nZXRBdHRyaWJ1dGUoJ2NsYXNzJykuaW5kZXhPZigncHN3cF9fc2Nyb2xsLXdyYXAnKSA+IC0xICkge1xuXHQgIFx0XHRyZXR1cm4gZmFsc2U7XG5cdCAgXHR9XG5cblx0ICBcdGlmKCBmbihlbCkgKSB7XG5cdCAgXHRcdHJldHVybiBlbDtcblx0ICBcdH1cblxuXHQgIFx0cmV0dXJuIF9jbG9zZXN0RWxlbWVudChlbC5wYXJlbnROb2RlLCBmbik7XG5cdH0sXG5cblx0X3ByZXZlbnRPYmogPSB7fSxcblx0X3ByZXZlbnREZWZhdWx0RXZlbnRCZWhhdmlvdXIgPSBmdW5jdGlvbihlLCBpc0Rvd24pIHtcblx0ICAgIF9wcmV2ZW50T2JqLnByZXZlbnQgPSAhX2Nsb3Nlc3RFbGVtZW50KGUudGFyZ2V0LCBfb3B0aW9ucy5pc0NsaWNrYWJsZUVsZW1lbnQpO1xuXG5cdFx0X3Nob3V0KCdwcmV2ZW50RHJhZ0V2ZW50JywgZSwgaXNEb3duLCBfcHJldmVudE9iaik7XG5cdFx0cmV0dXJuIF9wcmV2ZW50T2JqLnByZXZlbnQ7XG5cblx0fSxcblx0X2NvbnZlcnRUb3VjaFRvUG9pbnQgPSBmdW5jdGlvbih0b3VjaCwgcCkge1xuXHRcdHAueCA9IHRvdWNoLnBhZ2VYO1xuXHRcdHAueSA9IHRvdWNoLnBhZ2VZO1xuXHRcdHAuaWQgPSB0b3VjaC5pZGVudGlmaWVyO1xuXHRcdHJldHVybiBwO1xuXHR9LFxuXHRfZmluZENlbnRlck9mUG9pbnRzID0gZnVuY3Rpb24ocDEsIHAyLCBwQ2VudGVyKSB7XG5cdFx0cENlbnRlci54ID0gKHAxLnggKyBwMi54KSAqIDAuNTtcblx0XHRwQ2VudGVyLnkgPSAocDEueSArIHAyLnkpICogMC41O1xuXHR9LFxuXHRfcHVzaFBvc1BvaW50ID0gZnVuY3Rpb24odGltZSwgeCwgeSkge1xuXHRcdGlmKHRpbWUgLSBfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lID4gNTApIHtcblx0XHRcdHZhciBvID0gX3Bvc1BvaW50cy5sZW5ndGggPiAyID8gX3Bvc1BvaW50cy5zaGlmdCgpIDoge307XG5cdFx0XHRvLnggPSB4O1xuXHRcdFx0by55ID0geTsgXG5cdFx0XHRfcG9zUG9pbnRzLnB1c2gobyk7XG5cdFx0XHRfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lID0gdGltZTtcblx0XHR9XG5cdH0sXG5cblx0X2NhbGN1bGF0ZVZlcnRpY2FsRHJhZ09wYWNpdHlSYXRpbyA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB5T2Zmc2V0ID0gX3Bhbk9mZnNldC55IC0gc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb24ueTsgLy8gZGlmZmVyZW5jZSBiZXR3ZWVuIGluaXRpYWwgYW5kIGN1cnJlbnQgcG9zaXRpb25cblx0XHRyZXR1cm4gMSAtICBNYXRoLmFicyggeU9mZnNldCAvIChfdmlld3BvcnRTaXplLnkgLyAyKSAgKTtcblx0fSxcblxuXHRcblx0Ly8gcG9pbnRzIHBvb2wsIHJldXNlZCBkdXJpbmcgdG91Y2ggZXZlbnRzXG5cdF9lUG9pbnQxID0ge30sXG5cdF9lUG9pbnQyID0ge30sXG5cdF90ZW1wUG9pbnRzQXJyID0gW10sXG5cdF90ZW1wQ291bnRlcixcblx0X2dldFRvdWNoUG9pbnRzID0gZnVuY3Rpb24oZSkge1xuXHRcdC8vIGNsZWFuIHVwIHByZXZpb3VzIHBvaW50cywgd2l0aG91dCByZWNyZWF0aW5nIGFycmF5XG5cdFx0d2hpbGUoX3RlbXBQb2ludHNBcnIubGVuZ3RoID4gMCkge1xuXHRcdFx0X3RlbXBQb2ludHNBcnIucG9wKCk7XG5cdFx0fVxuXG5cdFx0aWYoIV9wb2ludGVyRXZlbnRFbmFibGVkKSB7XG5cdFx0XHRpZihlLnR5cGUuaW5kZXhPZigndG91Y2gnKSA+IC0xKSB7XG5cblx0XHRcdFx0aWYoZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMF0gPSBfY29udmVydFRvdWNoVG9Qb2ludChlLnRvdWNoZXNbMF0sIF9lUG9pbnQxKTtcblx0XHRcdFx0XHRpZihlLnRvdWNoZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMV0gPSBfY29udmVydFRvdWNoVG9Qb2ludChlLnRvdWNoZXNbMV0sIF9lUG9pbnQyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRfZVBvaW50MS54ID0gZS5wYWdlWDtcblx0XHRcdFx0X2VQb2ludDEueSA9IGUucGFnZVk7XG5cdFx0XHRcdF9lUG9pbnQxLmlkID0gJyc7XG5cdFx0XHRcdF90ZW1wUG9pbnRzQXJyWzBdID0gX2VQb2ludDE7Ly9fZVBvaW50MTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0X3RlbXBDb3VudGVyID0gMDtcblx0XHRcdC8vIHdlIGNhbiB1c2UgZm9yRWFjaCwgYXMgcG9pbnRlciBldmVudHMgYXJlIHN1cHBvcnRlZCBvbmx5IGluIG1vZGVybiBicm93c2Vyc1xuXHRcdFx0X2N1cnJQb2ludGVycy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcblx0XHRcdFx0aWYoX3RlbXBDb3VudGVyID09PSAwKSB7XG5cdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMF0gPSBwO1xuXHRcdFx0XHR9IGVsc2UgaWYoX3RlbXBDb3VudGVyID09PSAxKSB7XG5cdFx0XHRcdFx0X3RlbXBQb2ludHNBcnJbMV0gPSBwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdF90ZW1wQ291bnRlcisrO1xuXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0cmV0dXJuIF90ZW1wUG9pbnRzQXJyO1xuXHR9LFxuXG5cdF9wYW5Pck1vdmVNYWluU2Nyb2xsID0gZnVuY3Rpb24oYXhpcywgZGVsdGEpIHtcblxuXHRcdHZhciBwYW5GcmljdGlvbixcblx0XHRcdG92ZXJEaWZmID0gMCxcblx0XHRcdG5ld09mZnNldCA9IF9wYW5PZmZzZXRbYXhpc10gKyBkZWx0YVtheGlzXSxcblx0XHRcdHN0YXJ0T3ZlckRpZmYsXG5cdFx0XHRkaXIgPSBkZWx0YVtheGlzXSA+IDAsXG5cdFx0XHRuZXdNYWluU2Nyb2xsUG9zaXRpb24gPSBfbWFpblNjcm9sbFBvcy54ICsgZGVsdGEueCxcblx0XHRcdG1haW5TY3JvbGxEaWZmID0gX21haW5TY3JvbGxQb3MueCAtIF9zdGFydE1haW5TY3JvbGxQb3MueCxcblx0XHRcdG5ld1BhblBvcyxcblx0XHRcdG5ld01haW5TY3JvbGxQb3M7XG5cblx0XHQvLyBjYWxjdWxhdGUgZmRpc3RhbmNlIG92ZXIgdGhlIGJvdW5kcyBhbmQgZnJpY3Rpb25cblx0XHRpZihuZXdPZmZzZXQgPiBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10gfHwgbmV3T2Zmc2V0IDwgX2N1cnJQYW5Cb3VuZHMubWF4W2F4aXNdKSB7XG5cdFx0XHRwYW5GcmljdGlvbiA9IF9vcHRpb25zLnBhbkVuZEZyaWN0aW9uO1xuXHRcdFx0Ly8gTGluZWFyIGluY3JlYXNpbmcgb2YgZnJpY3Rpb24sIHNvIGF0IDEvNCBvZiB2aWV3cG9ydCBpdCdzIGF0IG1heCB2YWx1ZS4gXG5cdFx0XHQvLyBMb29rcyBub3QgYXMgbmljZSBhcyB3YXMgZXhwZWN0ZWQuIExlZnQgZm9yIGhpc3RvcnkuXG5cdFx0XHQvLyBwYW5GcmljdGlvbiA9ICgxIC0gKF9wYW5PZmZzZXRbYXhpc10gKyBkZWx0YVtheGlzXSArIHBhbkJvdW5kcy5taW5bYXhpc10pIC8gKF92aWV3cG9ydFNpemVbYXhpc10gLyA0KSApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYW5GcmljdGlvbiA9IDE7XG5cdFx0fVxuXHRcdFxuXHRcdG5ld09mZnNldCA9IF9wYW5PZmZzZXRbYXhpc10gKyBkZWx0YVtheGlzXSAqIHBhbkZyaWN0aW9uO1xuXG5cdFx0Ly8gbW92ZSBtYWluIHNjcm9sbCBvciBzdGFydCBwYW5uaW5nXG5cdFx0aWYoX29wdGlvbnMuYWxsb3dQYW5Ub05leHQgfHwgX2N1cnJab29tTGV2ZWwgPT09IHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCkge1xuXG5cblx0XHRcdGlmKCFfY3Vyclpvb21FbGVtZW50U3R5bGUpIHtcblx0XHRcdFx0XG5cdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XG5cblx0XHRcdH0gZWxzZSBpZihfZGlyZWN0aW9uID09PSAnaCcgJiYgYXhpcyA9PT0gJ3gnICYmICFfem9vbVN0YXJ0ZWQgKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihkaXIpIHtcblx0XHRcdFx0XHRpZihuZXdPZmZzZXQgPiBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10pIHtcblx0XHRcdFx0XHRcdHBhbkZyaWN0aW9uID0gX29wdGlvbnMucGFuRW5kRnJpY3Rpb247XG5cdFx0XHRcdFx0XHRvdmVyRGlmZiA9IF9jdXJyUGFuQm91bmRzLm1pbltheGlzXSAtIG5ld09mZnNldDtcblx0XHRcdFx0XHRcdHN0YXJ0T3ZlckRpZmYgPSBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10gLSBfc3RhcnRQYW5PZmZzZXRbYXhpc107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vIGRyYWcgcmlnaHRcblx0XHRcdFx0XHRpZiggKHN0YXJ0T3ZlckRpZmYgPD0gMCB8fCBtYWluU2Nyb2xsRGlmZiA8IDApICYmIF9nZXROdW1JdGVtcygpID4gMSApIHtcblx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XG5cdFx0XHRcdFx0XHRpZihtYWluU2Nyb2xsRGlmZiA8IDAgJiYgbmV3TWFpblNjcm9sbFBvc2l0aW9uID4gX3N0YXJ0TWFpblNjcm9sbFBvcy54KSB7XG5cdFx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBfc3RhcnRNYWluU2Nyb2xsUG9zLng7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmKF9jdXJyUGFuQm91bmRzLm1pbi54ICE9PSBfY3VyclBhbkJvdW5kcy5tYXgueCkge1xuXHRcdFx0XHRcdFx0XHRuZXdQYW5Qb3MgPSBuZXdPZmZzZXQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRcdGlmKG5ld09mZnNldCA8IF9jdXJyUGFuQm91bmRzLm1heFtheGlzXSApIHtcblx0XHRcdFx0XHRcdHBhbkZyaWN0aW9uID1fb3B0aW9ucy5wYW5FbmRGcmljdGlvbjtcblx0XHRcdFx0XHRcdG92ZXJEaWZmID0gbmV3T2Zmc2V0IC0gX2N1cnJQYW5Cb3VuZHMubWF4W2F4aXNdO1xuXHRcdFx0XHRcdFx0c3RhcnRPdmVyRGlmZiA9IF9zdGFydFBhbk9mZnNldFtheGlzXSAtIF9jdXJyUGFuQm91bmRzLm1heFtheGlzXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiggKHN0YXJ0T3ZlckRpZmYgPD0gMCB8fCBtYWluU2Nyb2xsRGlmZiA+IDApICYmIF9nZXROdW1JdGVtcygpID4gMSApIHtcblx0XHRcdFx0XHRcdG5ld01haW5TY3JvbGxQb3MgPSBuZXdNYWluU2Nyb2xsUG9zaXRpb247XG5cblx0XHRcdFx0XHRcdGlmKG1haW5TY3JvbGxEaWZmID4gMCAmJiBuZXdNYWluU2Nyb2xsUG9zaXRpb24gPCBfc3RhcnRNYWluU2Nyb2xsUG9zLngpIHtcblx0XHRcdFx0XHRcdFx0bmV3TWFpblNjcm9sbFBvcyA9IF9zdGFydE1haW5TY3JvbGxQb3MueDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZihfY3VyclBhbkJvdW5kcy5taW4ueCAhPT0gX2N1cnJQYW5Cb3VuZHMubWF4LngpIHtcblx0XHRcdFx0XHRcdFx0bmV3UGFuUG9zID0gbmV3T2Zmc2V0O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHQvL1xuXHRcdFx0fVxuXG5cdFx0XHRpZihheGlzID09PSAneCcpIHtcblxuXHRcdFx0XHRpZihuZXdNYWluU2Nyb2xsUG9zICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRfbW92ZU1haW5TY3JvbGwobmV3TWFpblNjcm9sbFBvcywgdHJ1ZSk7XG5cdFx0XHRcdFx0aWYobmV3TWFpblNjcm9sbFBvcyA9PT0gX3N0YXJ0TWFpblNjcm9sbFBvcy54KSB7XG5cdFx0XHRcdFx0XHRfbWFpblNjcm9sbFNoaWZ0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X21haW5TY3JvbGxTaGlmdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihfY3VyclBhbkJvdW5kcy5taW4ueCAhPT0gX2N1cnJQYW5Cb3VuZHMubWF4LngpIHtcblx0XHRcdFx0XHRpZihuZXdQYW5Qb3MgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0X3Bhbk9mZnNldC54ID0gbmV3UGFuUG9zO1xuXHRcdFx0XHRcdH0gZWxzZSBpZighX21haW5TY3JvbGxTaGlmdGVkKSB7XG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggKz0gZGVsdGEueCAqIHBhbkZyaWN0aW9uO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBuZXdNYWluU2Nyb2xsUG9zICE9PSB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRpZighX21haW5TY3JvbGxBbmltYXRpbmcpIHtcblx0XHRcdFxuXHRcdFx0aWYoIV9tYWluU2Nyb2xsU2hpZnRlZCkge1xuXHRcdFx0XHRpZihfY3Vyclpvb21MZXZlbCA+IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pIHtcblx0XHRcdFx0XHRfcGFuT2Zmc2V0W2F4aXNdICs9IGRlbHRhW2F4aXNdICogcGFuRnJpY3Rpb247XG5cdFx0XHRcdFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdFxuXHRcdH1cblx0XHRcblx0fSxcblxuXHQvLyBQb2ludGVyZG93bi90b3VjaHN0YXJ0L21vdXNlZG93biBoYW5kbGVyXG5cdF9vbkRyYWdTdGFydCA9IGZ1bmN0aW9uKGUpIHtcblxuXHRcdC8vIEFsbG93IGRyYWdnaW5nIG9ubHkgdmlhIGxlZnQgbW91c2UgYnV0dG9uLlxuXHRcdC8vIEFzIHRoaXMgaGFuZGxlciBpcyBub3QgYWRkZWQgaW4gSUU4IC0gd2UgaWdub3JlIGUud2hpY2hcblx0XHQvLyBcblx0XHQvLyBodHRwOi8vd3d3LnF1aXJrc21vZGUub3JnL2pzL2V2ZW50c19wcm9wZXJ0aWVzLmh0bWxcblx0XHQvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvZXZlbnQuYnV0dG9uXG5cdFx0aWYoZS50eXBlID09PSAnbW91c2Vkb3duJyAmJiBlLmJ1dHRvbiA+IDAgICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmKF9pbml0aWFsWm9vbVJ1bm5pbmcpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZihfb2xkQW5kcm9pZFRvdWNoRW5kVGltZW91dCAmJiBlLnR5cGUgPT09ICdtb3VzZWRvd24nKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYoX3ByZXZlbnREZWZhdWx0RXZlbnRCZWhhdmlvdXIoZSwgdHJ1ZSkpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cblxuXG5cdFx0X3Nob3V0KCdwb2ludGVyRG93bicpO1xuXG5cdFx0aWYoX3BvaW50ZXJFdmVudEVuYWJsZWQpIHtcblx0XHRcdHZhciBwb2ludGVySW5kZXggPSBmcmFtZXdvcmsuYXJyYXlTZWFyY2goX2N1cnJQb2ludGVycywgZS5wb2ludGVySWQsICdpZCcpO1xuXHRcdFx0aWYocG9pbnRlckluZGV4IDwgMCkge1xuXHRcdFx0XHRwb2ludGVySW5kZXggPSBfY3VyclBvaW50ZXJzLmxlbmd0aDtcblx0XHRcdH1cblx0XHRcdF9jdXJyUG9pbnRlcnNbcG9pbnRlckluZGV4XSA9IHt4OmUucGFnZVgsIHk6ZS5wYWdlWSwgaWQ6IGUucG9pbnRlcklkfTtcblx0XHR9XG5cdFx0XG5cblxuXHRcdHZhciBzdGFydFBvaW50c0xpc3QgPSBfZ2V0VG91Y2hQb2ludHMoZSksXG5cdFx0XHRudW1Qb2ludHMgPSBzdGFydFBvaW50c0xpc3QubGVuZ3RoO1xuXG5cdFx0X2N1cnJlbnRQb2ludHMgPSBudWxsO1xuXG5cdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cblx0XHQvLyBpbml0IGRyYWdcblx0XHRpZighX2lzRHJhZ2dpbmcgfHwgbnVtUG9pbnRzID09PSAxKSB7XG5cblx0XHRcdFxuXG5cdFx0XHRfaXNEcmFnZ2luZyA9IF9pc0ZpcnN0TW92ZSA9IHRydWU7XG5cdFx0XHRmcmFtZXdvcmsuYmluZCh3aW5kb3csIF91cE1vdmVFdmVudHMsIHNlbGYpO1xuXG5cdFx0XHRfaXNab29taW5nSW4gPSBcblx0XHRcdFx0X3dhc092ZXJJbml0aWFsWm9vbSA9IFxuXHRcdFx0XHRfb3BhY2l0eUNoYW5nZWQgPSBcblx0XHRcdFx0X3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCA9IFxuXHRcdFx0XHRfbWFpblNjcm9sbFNoaWZ0ZWQgPSBcblx0XHRcdFx0X21vdmVkID0gXG5cdFx0XHRcdF9pc011bHRpdG91Y2ggPSBcblx0XHRcdFx0X3pvb21TdGFydGVkID0gZmFsc2U7XG5cblx0XHRcdF9kaXJlY3Rpb24gPSBudWxsO1xuXG5cdFx0XHRfc2hvdXQoJ2ZpcnN0VG91Y2hTdGFydCcsIHN0YXJ0UG9pbnRzTGlzdCk7XG5cblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfc3RhcnRQYW5PZmZzZXQsIF9wYW5PZmZzZXQpO1xuXG5cdFx0XHRfY3VyclBhbkRpc3QueCA9IF9jdXJyUGFuRGlzdC55ID0gMDtcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfY3VyclBvaW50LCBzdGFydFBvaW50c0xpc3RbMF0pO1xuXHRcdFx0X2VxdWFsaXplUG9pbnRzKF9zdGFydFBvaW50LCBfY3VyclBvaW50KTtcblxuXHRcdFx0Ly9fZXF1YWxpemVQb2ludHMoX3N0YXJ0TWFpblNjcm9sbFBvcywgX21haW5TY3JvbGxQb3MpO1xuXHRcdFx0X3N0YXJ0TWFpblNjcm9sbFBvcy54ID0gX3NsaWRlU2l6ZS54ICogX2N1cnJQb3NpdGlvbkluZGV4O1xuXG5cdFx0XHRfcG9zUG9pbnRzID0gW3tcblx0XHRcdFx0eDogX2N1cnJQb2ludC54LFxuXHRcdFx0XHR5OiBfY3VyclBvaW50Lnlcblx0XHRcdH1dO1xuXG5cdFx0XHRfZ2VzdHVyZUNoZWNrU3BlZWRUaW1lID0gX2dlc3R1cmVTdGFydFRpbWUgPSBfZ2V0Q3VycmVudFRpbWUoKTtcblxuXHRcdFx0Ly9fbWFpblNjcm9sbEFuaW1hdGlvbkVuZCh0cnVlKTtcblx0XHRcdF9jYWxjdWxhdGVQYW5Cb3VuZHMoIF9jdXJyWm9vbUxldmVsLCB0cnVlICk7XG5cdFx0XHRcblx0XHRcdC8vIFN0YXJ0IHJlbmRlcmluZ1xuXHRcdFx0X3N0b3BEcmFnVXBkYXRlTG9vcCgpO1xuXHRcdFx0X2RyYWdVcGRhdGVMb29wKCk7XG5cdFx0XHRcblx0XHR9XG5cblx0XHQvLyBpbml0IHpvb21cblx0XHRpZighX2lzWm9vbWluZyAmJiBudW1Qb2ludHMgPiAxICYmICFfbWFpblNjcm9sbEFuaW1hdGluZyAmJiAhX21haW5TY3JvbGxTaGlmdGVkKSB7XG5cdFx0XHRfc3RhcnRab29tTGV2ZWwgPSBfY3Vyclpvb21MZXZlbDtcblx0XHRcdF96b29tU3RhcnRlZCA9IGZhbHNlOyAvLyB0cnVlIGlmIHpvb20gY2hhbmdlZCBhdCBsZWFzdCBvbmNlXG5cblx0XHRcdF9pc1pvb21pbmcgPSBfaXNNdWx0aXRvdWNoID0gdHJ1ZTtcblx0XHRcdF9jdXJyUGFuRGlzdC55ID0gX2N1cnJQYW5EaXN0LnggPSAwO1xuXG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX3N0YXJ0UGFuT2Zmc2V0LCBfcGFuT2Zmc2V0KTtcblxuXHRcdFx0X2VxdWFsaXplUG9pbnRzKHAsIHN0YXJ0UG9pbnRzTGlzdFswXSk7XG5cdFx0XHRfZXF1YWxpemVQb2ludHMocDIsIHN0YXJ0UG9pbnRzTGlzdFsxXSk7XG5cblx0XHRcdF9maW5kQ2VudGVyT2ZQb2ludHMocCwgcDIsIF9jdXJyQ2VudGVyUG9pbnQpO1xuXG5cdFx0XHRfbWlkWm9vbVBvaW50LnggPSBNYXRoLmFicyhfY3VyckNlbnRlclBvaW50LngpIC0gX3Bhbk9mZnNldC54O1xuXHRcdFx0X21pZFpvb21Qb2ludC55ID0gTWF0aC5hYnMoX2N1cnJDZW50ZXJQb2ludC55KSAtIF9wYW5PZmZzZXQueTtcblx0XHRcdF9jdXJyUG9pbnRzRGlzdGFuY2UgPSBfc3RhcnRQb2ludHNEaXN0YW5jZSA9IF9jYWxjdWxhdGVQb2ludHNEaXN0YW5jZShwLCBwMik7XG5cdFx0fVxuXG5cblx0fSxcblxuXHQvLyBQb2ludGVybW92ZS90b3VjaG1vdmUvbW91c2Vtb3ZlIGhhbmRsZXJcblx0X29uRHJhZ01vdmUgPSBmdW5jdGlvbihlKSB7XG5cblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRpZihfcG9pbnRlckV2ZW50RW5hYmxlZCkge1xuXHRcdFx0dmFyIHBvaW50ZXJJbmRleCA9IGZyYW1ld29yay5hcnJheVNlYXJjaChfY3VyclBvaW50ZXJzLCBlLnBvaW50ZXJJZCwgJ2lkJyk7XG5cdFx0XHRpZihwb2ludGVySW5kZXggPiAtMSkge1xuXHRcdFx0XHR2YXIgcCA9IF9jdXJyUG9pbnRlcnNbcG9pbnRlckluZGV4XTtcblx0XHRcdFx0cC54ID0gZS5wYWdlWDtcblx0XHRcdFx0cC55ID0gZS5wYWdlWTsgXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoX2lzRHJhZ2dpbmcpIHtcblx0XHRcdHZhciB0b3VjaGVzTGlzdCA9IF9nZXRUb3VjaFBvaW50cyhlKTtcblx0XHRcdGlmKCFfZGlyZWN0aW9uICYmICFfbW92ZWQgJiYgIV9pc1pvb21pbmcpIHtcblxuXHRcdFx0XHRpZihfbWFpblNjcm9sbFBvcy54ICE9PSBfc2xpZGVTaXplLnggKiBfY3VyclBvc2l0aW9uSW5kZXgpIHtcblx0XHRcdFx0XHQvLyBpZiBtYWluIHNjcm9sbCBwb3NpdGlvbiBpcyBzaGlmdGVkIOKAkyBkaXJlY3Rpb24gaXMgYWx3YXlzIGhvcml6b250YWxcblx0XHRcdFx0XHRfZGlyZWN0aW9uID0gJ2gnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHZhciBkaWZmID0gTWF0aC5hYnModG91Y2hlc0xpc3RbMF0ueCAtIF9jdXJyUG9pbnQueCkgLSBNYXRoLmFicyh0b3VjaGVzTGlzdFswXS55IC0gX2N1cnJQb2ludC55KTtcblx0XHRcdFx0XHQvLyBjaGVjayB0aGUgZGlyZWN0aW9uIG9mIG1vdmVtZW50XG5cdFx0XHRcdFx0aWYoTWF0aC5hYnMoZGlmZikgPj0gRElSRUNUSU9OX0NIRUNLX09GRlNFVCkge1xuXHRcdFx0XHRcdFx0X2RpcmVjdGlvbiA9IGRpZmYgPiAwID8gJ2gnIDogJ3YnO1xuXHRcdFx0XHRcdFx0X2N1cnJlbnRQb2ludHMgPSB0b3VjaGVzTGlzdDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRfY3VycmVudFBvaW50cyA9IHRvdWNoZXNMaXN0O1xuXHRcdFx0fVxuXHRcdH1cdFxuXHR9LFxuXHQvLyBcblx0X3JlbmRlck1vdmVtZW50ID0gIGZ1bmN0aW9uKCkge1xuXG5cdFx0aWYoIV9jdXJyZW50UG9pbnRzKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIG51bVBvaW50cyA9IF9jdXJyZW50UG9pbnRzLmxlbmd0aDtcblxuXHRcdGlmKG51bVBvaW50cyA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdF9lcXVhbGl6ZVBvaW50cyhwLCBfY3VycmVudFBvaW50c1swXSk7XG5cblx0XHRkZWx0YS54ID0gcC54IC0gX2N1cnJQb2ludC54O1xuXHRcdGRlbHRhLnkgPSBwLnkgLSBfY3VyclBvaW50Lnk7XG5cblx0XHRpZihfaXNab29taW5nICYmIG51bVBvaW50cyA+IDEpIHtcblx0XHRcdC8vIEhhbmRsZSBiZWhhdmlvdXIgZm9yIG1vcmUgdGhhbiAxIHBvaW50XG5cblx0XHRcdF9jdXJyUG9pbnQueCA9IHAueDtcblx0XHRcdF9jdXJyUG9pbnQueSA9IHAueTtcblx0XHRcblx0XHRcdC8vIGNoZWNrIGlmIG9uZSBvZiB0d28gcG9pbnRzIGNoYW5nZWRcblx0XHRcdGlmKCAhZGVsdGEueCAmJiAhZGVsdGEueSAmJiBfaXNFcXVhbFBvaW50cyhfY3VycmVudFBvaW50c1sxXSwgcDIpICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhwMiwgX2N1cnJlbnRQb2ludHNbMV0pO1xuXG5cblx0XHRcdGlmKCFfem9vbVN0YXJ0ZWQpIHtcblx0XHRcdFx0X3pvb21TdGFydGVkID0gdHJ1ZTtcblx0XHRcdFx0X3Nob3V0KCd6b29tR2VzdHVyZVN0YXJ0ZWQnKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gRGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG5cdFx0XHR2YXIgcG9pbnRzRGlzdGFuY2UgPSBfY2FsY3VsYXRlUG9pbnRzRGlzdGFuY2UocCxwMik7XG5cblx0XHRcdHZhciB6b29tTGV2ZWwgPSBfY2FsY3VsYXRlWm9vbUxldmVsKHBvaW50c0Rpc3RhbmNlKTtcblxuXHRcdFx0Ly8gc2xpZ2h0bHkgb3ZlciB0aGUgb2YgaW5pdGlhbCB6b29tIGxldmVsXG5cdFx0XHRpZih6b29tTGV2ZWwgPiBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgKyBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgLyAxNSkge1xuXHRcdFx0XHRfd2FzT3ZlckluaXRpYWxab29tID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQXBwbHkgdGhlIGZyaWN0aW9uIGlmIHpvb20gbGV2ZWwgaXMgb3V0IG9mIHRoZSBib3VuZHNcblx0XHRcdHZhciB6b29tRnJpY3Rpb24gPSAxLFxuXHRcdFx0XHRtaW5ab29tTGV2ZWwgPSBfZ2V0TWluWm9vbUxldmVsKCksXG5cdFx0XHRcdG1heFpvb21MZXZlbCA9IF9nZXRNYXhab29tTGV2ZWwoKTtcblxuXHRcdFx0aWYgKCB6b29tTGV2ZWwgPCBtaW5ab29tTGV2ZWwgKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihfb3B0aW9ucy5waW5jaFRvQ2xvc2UgJiYgIV93YXNPdmVySW5pdGlhbFpvb20gJiYgX3N0YXJ0Wm9vbUxldmVsIDw9IHNlbGYuY3Vyckl0ZW0uaW5pdGlhbFpvb21MZXZlbCkge1xuXHRcdFx0XHRcdC8vIGZhZGUgb3V0IGJhY2tncm91bmQgaWYgem9vbWluZyBvdXRcblx0XHRcdFx0XHR2YXIgbWludXNEaWZmID0gbWluWm9vbUxldmVsIC0gem9vbUxldmVsO1xuXHRcdFx0XHRcdHZhciBwZXJjZW50ID0gMSAtIG1pbnVzRGlmZiAvIChtaW5ab29tTGV2ZWwgLyAxLjIpO1xuXG5cdFx0XHRcdFx0X2FwcGx5QmdPcGFjaXR5KHBlcmNlbnQpO1xuXHRcdFx0XHRcdF9zaG91dCgnb25QaW5jaENsb3NlJywgcGVyY2VudCk7XG5cdFx0XHRcdFx0X29wYWNpdHlDaGFuZ2VkID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR6b29tRnJpY3Rpb24gPSAobWluWm9vbUxldmVsIC0gem9vbUxldmVsKSAvIG1pblpvb21MZXZlbDtcblx0XHRcdFx0XHRpZih6b29tRnJpY3Rpb24gPiAxKSB7XG5cdFx0XHRcdFx0XHR6b29tRnJpY3Rpb24gPSAxO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR6b29tTGV2ZWwgPSBtaW5ab29tTGV2ZWwgLSB6b29tRnJpY3Rpb24gKiAobWluWm9vbUxldmVsIC8gMyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9IGVsc2UgaWYgKCB6b29tTGV2ZWwgPiBtYXhab29tTGV2ZWwgKSB7XG5cdFx0XHRcdC8vIDEuNSAtIGV4dHJhIHpvb20gbGV2ZWwgYWJvdmUgdGhlIG1heC4gRS5nLiBpZiBtYXggaXMgeDYsIHJlYWwgbWF4IDYgKyAxLjUgPSA3LjVcblx0XHRcdFx0em9vbUZyaWN0aW9uID0gKHpvb21MZXZlbCAtIG1heFpvb21MZXZlbCkgLyAoIG1pblpvb21MZXZlbCAqIDYgKTtcblx0XHRcdFx0aWYoem9vbUZyaWN0aW9uID4gMSkge1xuXHRcdFx0XHRcdHpvb21GcmljdGlvbiA9IDE7XG5cdFx0XHRcdH1cblx0XHRcdFx0em9vbUxldmVsID0gbWF4Wm9vbUxldmVsICsgem9vbUZyaWN0aW9uICogbWluWm9vbUxldmVsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZih6b29tRnJpY3Rpb24gPCAwKSB7XG5cdFx0XHRcdHpvb21GcmljdGlvbiA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGRpc3RhbmNlIGJldHdlZW4gdG91Y2ggcG9pbnRzIGFmdGVyIGZyaWN0aW9uIGlzIGFwcGxpZWRcblx0XHRcdF9jdXJyUG9pbnRzRGlzdGFuY2UgPSBwb2ludHNEaXN0YW5jZTtcblxuXHRcdFx0Ly8gX2NlbnRlclBvaW50IC0gVGhlIHBvaW50IGluIHRoZSBtaWRkbGUgb2YgdHdvIHBvaW50ZXJzXG5cdFx0XHRfZmluZENlbnRlck9mUG9pbnRzKHAsIHAyLCBfY2VudGVyUG9pbnQpO1xuXHRcdFxuXHRcdFx0Ly8gcGFuaW5nIHdpdGggdHdvIHBvaW50ZXJzIHByZXNzZWRcblx0XHRcdF9jdXJyUGFuRGlzdC54ICs9IF9jZW50ZXJQb2ludC54IC0gX2N1cnJDZW50ZXJQb2ludC54O1xuXHRcdFx0X2N1cnJQYW5EaXN0LnkgKz0gX2NlbnRlclBvaW50LnkgLSBfY3VyckNlbnRlclBvaW50Lnk7XG5cdFx0XHRfZXF1YWxpemVQb2ludHMoX2N1cnJDZW50ZXJQb2ludCwgX2NlbnRlclBvaW50KTtcblxuXHRcdFx0X3Bhbk9mZnNldC54ID0gX2NhbGN1bGF0ZVBhbk9mZnNldCgneCcsIHpvb21MZXZlbCk7XG5cdFx0XHRfcGFuT2Zmc2V0LnkgPSBfY2FsY3VsYXRlUGFuT2Zmc2V0KCd5Jywgem9vbUxldmVsKTtcblxuXHRcdFx0X2lzWm9vbWluZ0luID0gem9vbUxldmVsID4gX2N1cnJab29tTGV2ZWw7XG5cdFx0XHRfY3Vyclpvb21MZXZlbCA9IHpvb21MZXZlbDtcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHQvLyBoYW5kbGUgYmVoYXZpb3VyIGZvciBvbmUgcG9pbnQgKGRyYWdnaW5nIG9yIHBhbm5pbmcpXG5cblx0XHRcdGlmKCFfZGlyZWN0aW9uKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoX2lzRmlyc3RNb3ZlKSB7XG5cdFx0XHRcdF9pc0ZpcnN0TW92ZSA9IGZhbHNlO1xuXG5cdFx0XHRcdC8vIHN1YnRyYWN0IGRyYWcgZGlzdGFuY2UgdGhhdCB3YXMgdXNlZCBkdXJpbmcgdGhlIGRldGVjdGlvbiBkaXJlY3Rpb24gIFxuXG5cdFx0XHRcdGlmKCBNYXRoLmFicyhkZWx0YS54KSA+PSBESVJFQ1RJT05fQ0hFQ0tfT0ZGU0VUKSB7XG5cdFx0XHRcdFx0ZGVsdGEueCAtPSBfY3VycmVudFBvaW50c1swXS54IC0gX3N0YXJ0UG9pbnQueDtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0aWYoIE1hdGguYWJzKGRlbHRhLnkpID49IERJUkVDVElPTl9DSEVDS19PRkZTRVQpIHtcblx0XHRcdFx0XHRkZWx0YS55IC09IF9jdXJyZW50UG9pbnRzWzBdLnkgLSBfc3RhcnRQb2ludC55O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdF9jdXJyUG9pbnQueCA9IHAueDtcblx0XHRcdF9jdXJyUG9pbnQueSA9IHAueTtcblxuXHRcdFx0Ly8gZG8gbm90aGluZyBpZiBwb2ludGVycyBwb3NpdGlvbiBoYXNuJ3QgY2hhbmdlZFxuXHRcdFx0aWYoZGVsdGEueCA9PT0gMCAmJiBkZWx0YS55ID09PSAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoX2RpcmVjdGlvbiA9PT0gJ3YnICYmIF9vcHRpb25zLmNsb3NlT25WZXJ0aWNhbERyYWcpIHtcblx0XHRcdFx0aWYoIV9jYW5QYW4oKSkge1xuXHRcdFx0XHRcdF9jdXJyUGFuRGlzdC55ICs9IGRlbHRhLnk7XG5cdFx0XHRcdFx0X3Bhbk9mZnNldC55ICs9IGRlbHRhLnk7XG5cblx0XHRcdFx0XHR2YXIgb3BhY2l0eVJhdGlvID0gX2NhbGN1bGF0ZVZlcnRpY2FsRHJhZ09wYWNpdHlSYXRpbygpO1xuXG5cdFx0XHRcdFx0X3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCA9IHRydWU7XG5cdFx0XHRcdFx0X3Nob3V0KCdvblZlcnRpY2FsRHJhZycsIG9wYWNpdHlSYXRpbyk7XG5cblx0XHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkob3BhY2l0eVJhdGlvKTtcblx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdHJldHVybiA7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X3B1c2hQb3NQb2ludChfZ2V0Q3VycmVudFRpbWUoKSwgcC54LCBwLnkpO1xuXG5cdFx0XHRfbW92ZWQgPSB0cnVlO1xuXHRcdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcblx0XHRcdFxuXHRcdFx0dmFyIG1haW5TY3JvbGxDaGFuZ2VkID0gX3Bhbk9yTW92ZU1haW5TY3JvbGwoJ3gnLCBkZWx0YSk7XG5cdFx0XHRpZighbWFpblNjcm9sbENoYW5nZWQpIHtcblx0XHRcdFx0X3Bhbk9yTW92ZU1haW5TY3JvbGwoJ3knLCBkZWx0YSk7XG5cblx0XHRcdFx0X3JvdW5kUG9pbnQoX3Bhbk9mZnNldCk7XG5cdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSxcblx0XG5cdC8vIFBvaW50ZXJ1cC9wb2ludGVyY2FuY2VsL3RvdWNoZW5kL3RvdWNoY2FuY2VsL21vdXNldXAgZXZlbnQgaGFuZGxlclxuXHRfb25EcmFnUmVsZWFzZSA9IGZ1bmN0aW9uKGUpIHtcblxuXHRcdGlmKF9mZWF0dXJlcy5pc09sZEFuZHJvaWQgKSB7XG5cblx0XHRcdGlmKF9vbGRBbmRyb2lkVG91Y2hFbmRUaW1lb3V0ICYmIGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gb24gQW5kcm9pZCAodjQuMSwgNC4yLCA0LjMgJiBwb3NzaWJseSBvbGRlcikgXG5cdFx0XHQvLyBnaG9zdCBtb3VzZWRvd24vdXAgZXZlbnQgaXNuJ3QgcHJldmVudGFibGUgdmlhIGUucHJldmVudERlZmF1bHQsXG5cdFx0XHQvLyB3aGljaCBjYXVzZXMgZmFrZSBtb3VzZWRvd24gZXZlbnRcblx0XHRcdC8vIHNvIHdlIGJsb2NrIG1vdXNlZG93bi91cCBmb3IgNjAwbXNcblx0XHRcdGlmKCBlLnR5cGUuaW5kZXhPZigndG91Y2gnKSA+IC0xICkge1xuXHRcdFx0XHRjbGVhclRpbWVvdXQoX29sZEFuZHJvaWRUb3VjaEVuZFRpbWVvdXQpO1xuXHRcdFx0XHRfb2xkQW5kcm9pZFRvdWNoRW5kVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0X29sZEFuZHJvaWRUb3VjaEVuZFRpbWVvdXQgPSAwO1xuXHRcdFx0XHR9LCA2MDApO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fVxuXG5cdFx0X3Nob3V0KCdwb2ludGVyVXAnKTtcblxuXHRcdGlmKF9wcmV2ZW50RGVmYXVsdEV2ZW50QmVoYXZpb3VyKGUsIGZhbHNlKSkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdHZhciByZWxlYXNlUG9pbnQ7XG5cblx0XHRpZihfcG9pbnRlckV2ZW50RW5hYmxlZCkge1xuXHRcdFx0dmFyIHBvaW50ZXJJbmRleCA9IGZyYW1ld29yay5hcnJheVNlYXJjaChfY3VyclBvaW50ZXJzLCBlLnBvaW50ZXJJZCwgJ2lkJyk7XG5cdFx0XHRcblx0XHRcdGlmKHBvaW50ZXJJbmRleCA+IC0xKSB7XG5cdFx0XHRcdHJlbGVhc2VQb2ludCA9IF9jdXJyUG9pbnRlcnMuc3BsaWNlKHBvaW50ZXJJbmRleCwgMSlbMF07XG5cblx0XHRcdFx0aWYobmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkKSB7XG5cdFx0XHRcdFx0cmVsZWFzZVBvaW50LnR5cGUgPSBlLnBvaW50ZXJUeXBlIHx8ICdtb3VzZSc7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmFyIE1TUE9JTlRFUl9UWVBFUyA9IHtcblx0XHRcdFx0XHRcdDQ6ICdtb3VzZScsIC8vIGV2ZW50Lk1TUE9JTlRFUl9UWVBFX01PVVNFXG5cdFx0XHRcdFx0XHQyOiAndG91Y2gnLCAvLyBldmVudC5NU1BPSU5URVJfVFlQRV9UT1VDSCBcblx0XHRcdFx0XHRcdDM6ICdwZW4nIC8vIGV2ZW50Lk1TUE9JTlRFUl9UWVBFX1BFTlxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0cmVsZWFzZVBvaW50LnR5cGUgPSBNU1BPSU5URVJfVFlQRVNbZS5wb2ludGVyVHlwZV07XG5cblx0XHRcdFx0XHRpZighcmVsZWFzZVBvaW50LnR5cGUpIHtcblx0XHRcdFx0XHRcdHJlbGVhc2VQb2ludC50eXBlID0gZS5wb2ludGVyVHlwZSB8fCAnbW91c2UnO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIHRvdWNoTGlzdCA9IF9nZXRUb3VjaFBvaW50cyhlKSxcblx0XHRcdGdlc3R1cmVUeXBlLFxuXHRcdFx0bnVtUG9pbnRzID0gdG91Y2hMaXN0Lmxlbmd0aDtcblxuXHRcdGlmKGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XG5cdFx0XHRudW1Qb2ludHMgPSAwO1xuXHRcdH1cblxuXHRcdC8vIERvIG5vdGhpbmcgaWYgdGhlcmUgd2VyZSAzIHRvdWNoIHBvaW50cyBvciBtb3JlXG5cdFx0aWYobnVtUG9pbnRzID09PSAyKSB7XG5cdFx0XHRfY3VycmVudFBvaW50cyA9IG51bGw7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBpZiBzZWNvbmQgcG9pbnRlciByZWxlYXNlZFxuXHRcdGlmKG51bVBvaW50cyA9PT0gMSkge1xuXHRcdFx0X2VxdWFsaXplUG9pbnRzKF9zdGFydFBvaW50LCB0b3VjaExpc3RbMF0pO1xuXHRcdH1cdFx0XHRcdFxuXG5cblx0XHQvLyBwb2ludGVyIGhhc24ndCBtb3ZlZCwgc2VuZCBcInRhcCByZWxlYXNlXCIgcG9pbnRcblx0XHRpZihudW1Qb2ludHMgPT09IDAgJiYgIV9kaXJlY3Rpb24gJiYgIV9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XG5cdFx0XHRpZighcmVsZWFzZVBvaW50KSB7XG5cdFx0XHRcdGlmKGUudHlwZSA9PT0gJ21vdXNldXAnKSB7XG5cdFx0XHRcdFx0cmVsZWFzZVBvaW50ID0ge3g6IGUucGFnZVgsIHk6IGUucGFnZVksIHR5cGU6J21vdXNlJ307XG5cdFx0XHRcdH0gZWxzZSBpZihlLmNoYW5nZWRUb3VjaGVzICYmIGUuY2hhbmdlZFRvdWNoZXNbMF0pIHtcblx0XHRcdFx0XHRyZWxlYXNlUG9pbnQgPSB7eDogZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCwgeTogZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWSwgdHlwZTondG91Y2gnfTtcblx0XHRcdFx0fVx0XHRcblx0XHRcdH1cblxuXHRcdFx0X3Nob3V0KCd0b3VjaFJlbGVhc2UnLCBlLCByZWxlYXNlUG9pbnQpO1xuXHRcdH1cblxuXHRcdC8vIERpZmZlcmVuY2UgaW4gdGltZSBiZXR3ZWVuIHJlbGVhc2luZyBvZiB0d28gbGFzdCB0b3VjaCBwb2ludHMgKHpvb20gZ2VzdHVyZSlcblx0XHR2YXIgcmVsZWFzZVRpbWVEaWZmID0gLTE7XG5cblx0XHQvLyBHZXN0dXJlIGNvbXBsZXRlZCwgbm8gcG9pbnRlcnMgbGVmdFxuXHRcdGlmKG51bVBvaW50cyA9PT0gMCkge1xuXHRcdFx0X2lzRHJhZ2dpbmcgPSBmYWxzZTtcblx0XHRcdGZyYW1ld29yay51bmJpbmQod2luZG93LCBfdXBNb3ZlRXZlbnRzLCBzZWxmKTtcblxuXHRcdFx0X3N0b3BEcmFnVXBkYXRlTG9vcCgpO1xuXG5cdFx0XHRpZihfaXNab29taW5nKSB7XG5cdFx0XHRcdC8vIFR3byBwb2ludHMgcmVsZWFzZWQgYXQgdGhlIHNhbWUgdGltZVxuXHRcdFx0XHRyZWxlYXNlVGltZURpZmYgPSAwO1xuXHRcdFx0fSBlbHNlIGlmKF9sYXN0UmVsZWFzZVRpbWUgIT09IC0xKSB7XG5cdFx0XHRcdHJlbGVhc2VUaW1lRGlmZiA9IF9nZXRDdXJyZW50VGltZSgpIC0gX2xhc3RSZWxlYXNlVGltZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0X2xhc3RSZWxlYXNlVGltZSA9IG51bVBvaW50cyA9PT0gMSA/IF9nZXRDdXJyZW50VGltZSgpIDogLTE7XG5cdFx0XG5cdFx0aWYocmVsZWFzZVRpbWVEaWZmICE9PSAtMSAmJiByZWxlYXNlVGltZURpZmYgPCAxNTApIHtcblx0XHRcdGdlc3R1cmVUeXBlID0gJ3pvb20nO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRnZXN0dXJlVHlwZSA9ICdzd2lwZSc7XG5cdFx0fVxuXG5cdFx0aWYoX2lzWm9vbWluZyAmJiBudW1Qb2ludHMgPCAyKSB7XG5cdFx0XHRfaXNab29taW5nID0gZmFsc2U7XG5cblx0XHRcdC8vIE9ubHkgc2Vjb25kIHBvaW50IHJlbGVhc2VkXG5cdFx0XHRpZihudW1Qb2ludHMgPT09IDEpIHtcblx0XHRcdFx0Z2VzdHVyZVR5cGUgPSAnem9vbVBvaW50ZXJVcCc7XG5cdFx0XHR9XG5cdFx0XHRfc2hvdXQoJ3pvb21HZXN0dXJlRW5kZWQnKTtcblx0XHR9XG5cblx0XHRfY3VycmVudFBvaW50cyA9IG51bGw7XG5cdFx0aWYoIV9tb3ZlZCAmJiAhX3pvb21TdGFydGVkICYmICFfbWFpblNjcm9sbEFuaW1hdGluZyAmJiAhX3ZlcnRpY2FsRHJhZ0luaXRpYXRlZCkge1xuXHRcdFx0Ly8gbm90aGluZyB0byBhbmltYXRlXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcblx0XHRfc3RvcEFsbEFuaW1hdGlvbnMoKTtcblxuXHRcdFxuXHRcdGlmKCFfcmVsZWFzZUFuaW1EYXRhKSB7XG5cdFx0XHRfcmVsZWFzZUFuaW1EYXRhID0gX2luaXREcmFnUmVsZWFzZUFuaW1hdGlvbkRhdGEoKTtcblx0XHR9XG5cdFx0XG5cdFx0X3JlbGVhc2VBbmltRGF0YS5jYWxjdWxhdGVTd2lwZVNwZWVkKCd4Jyk7XG5cblxuXHRcdGlmKF92ZXJ0aWNhbERyYWdJbml0aWF0ZWQpIHtcblxuXHRcdFx0dmFyIG9wYWNpdHlSYXRpbyA9IF9jYWxjdWxhdGVWZXJ0aWNhbERyYWdPcGFjaXR5UmF0aW8oKTtcblxuXHRcdFx0aWYob3BhY2l0eVJhdGlvIDwgX29wdGlvbnMudmVydGljYWxEcmFnUmFuZ2UpIHtcblx0XHRcdFx0c2VsZi5jbG9zZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIGluaXRhbFBhblkgPSBfcGFuT2Zmc2V0LnksXG5cdFx0XHRcdFx0aW5pdGlhbEJnT3BhY2l0eSA9IF9iZ09wYWNpdHk7XG5cblx0XHRcdFx0X2FuaW1hdGVQcm9wKCd2ZXJ0aWNhbERyYWcnLCAwLCAxLCAzMDAsIGZyYW1ld29yay5lYXNpbmcuY3ViaWMub3V0LCBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSAoc2VsZi5jdXJySXRlbS5pbml0aWFsUG9zaXRpb24ueSAtIGluaXRhbFBhblkpICogbm93ICsgaW5pdGFsUGFuWTtcblxuXHRcdFx0XHRcdF9hcHBseUJnT3BhY2l0eSggICgxIC0gaW5pdGlhbEJnT3BhY2l0eSkgKiBub3cgKyBpbml0aWFsQmdPcGFjaXR5ICk7XG5cdFx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X3Nob3V0KCdvblZlcnRpY2FsRHJhZycsIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cblx0XHQvLyBtYWluIHNjcm9sbCBcblx0XHRpZiggIChfbWFpblNjcm9sbFNoaWZ0ZWQgfHwgX21haW5TY3JvbGxBbmltYXRpbmcpICYmIG51bVBvaW50cyA9PT0gMCkge1xuXHRcdFx0dmFyIGl0ZW1DaGFuZ2VkID0gX2ZpbmlzaFN3aXBlTWFpblNjcm9sbEdlc3R1cmUoZ2VzdHVyZVR5cGUsIF9yZWxlYXNlQW5pbURhdGEpO1xuXHRcdFx0aWYoaXRlbUNoYW5nZWQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Z2VzdHVyZVR5cGUgPSAnem9vbVBvaW50ZXJVcCc7XG5cdFx0fVxuXG5cdFx0Ly8gcHJldmVudCB6b29tL3BhbiBhbmltYXRpb24gd2hlbiBtYWluIHNjcm9sbCBhbmltYXRpb24gcnVuc1xuXHRcdGlmKF9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdFxuXHRcdC8vIENvbXBsZXRlIHNpbXBsZSB6b29tIGdlc3R1cmUgKHJlc2V0IHpvb20gbGV2ZWwgaWYgaXQncyBvdXQgb2YgdGhlIGJvdW5kcykgIFxuXHRcdGlmKGdlc3R1cmVUeXBlICE9PSAnc3dpcGUnKSB7XG5cdFx0XHRfY29tcGxldGVab29tR2VzdHVyZSgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XG5cdFx0Ly8gQ29tcGxldGUgcGFuIGdlc3R1cmUgaWYgbWFpbiBzY3JvbGwgaXMgbm90IHNoaWZ0ZWQsIGFuZCBpdCdzIHBvc3NpYmxlIHRvIHBhbiBjdXJyZW50IGltYWdlXG5cdFx0aWYoIV9tYWluU2Nyb2xsU2hpZnRlZCAmJiBfY3Vyclpvb21MZXZlbCA+IHNlbGYuY3Vyckl0ZW0uZml0UmF0aW8pIHtcblx0XHRcdF9jb21wbGV0ZVBhbkdlc3R1cmUoX3JlbGVhc2VBbmltRGF0YSk7XG5cdFx0fVxuXHR9LFxuXG5cblx0Ly8gUmV0dXJucyBvYmplY3Qgd2l0aCBkYXRhIGFib3V0IGdlc3R1cmVcblx0Ly8gSXQncyBjcmVhdGVkIG9ubHkgb25jZSBhbmQgdGhlbiByZXVzZWRcblx0X2luaXREcmFnUmVsZWFzZUFuaW1hdGlvbkRhdGEgID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gdGVtcCBsb2NhbCB2YXJzXG5cdFx0dmFyIGxhc3RGbGlja0R1cmF0aW9uLFxuXHRcdFx0dGVtcFJlbGVhc2VQb3M7XG5cblx0XHQvLyBzID0gdGhpc1xuXHRcdHZhciBzID0ge1xuXHRcdFx0bGFzdEZsaWNrT2Zmc2V0OiB7fSxcblx0XHRcdGxhc3RGbGlja0Rpc3Q6IHt9LFxuXHRcdFx0bGFzdEZsaWNrU3BlZWQ6IHt9LFxuXHRcdFx0c2xvd0Rvd25SYXRpbzogIHt9LFxuXHRcdFx0c2xvd0Rvd25SYXRpb1JldmVyc2U6ICB7fSxcblx0XHRcdHNwZWVkRGVjZWxlcmF0aW9uUmF0aW86ICB7fSxcblx0XHRcdHNwZWVkRGVjZWxlcmF0aW9uUmF0aW9BYnM6ICB7fSxcblx0XHRcdGRpc3RhbmNlT2Zmc2V0OiAge30sXG5cdFx0XHRiYWNrQW5pbURlc3RpbmF0aW9uOiB7fSxcblx0XHRcdGJhY2tBbmltU3RhcnRlZDoge30sXG5cdFx0XHRjYWxjdWxhdGVTd2lwZVNwZWVkOiBmdW5jdGlvbihheGlzKSB7XG5cdFx0XHRcdFxuXG5cdFx0XHRcdGlmKCBfcG9zUG9pbnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0XHRsYXN0RmxpY2tEdXJhdGlvbiA9IF9nZXRDdXJyZW50VGltZSgpIC0gX2dlc3R1cmVDaGVja1NwZWVkVGltZSArIDUwO1xuXHRcdFx0XHRcdHRlbXBSZWxlYXNlUG9zID0gX3Bvc1BvaW50c1tfcG9zUG9pbnRzLmxlbmd0aC0yXVtheGlzXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRsYXN0RmxpY2tEdXJhdGlvbiA9IF9nZXRDdXJyZW50VGltZSgpIC0gX2dlc3R1cmVTdGFydFRpbWU7IC8vIHRvdGFsIGdlc3R1cmUgZHVyYXRpb25cblx0XHRcdFx0XHR0ZW1wUmVsZWFzZVBvcyA9IF9zdGFydFBvaW50W2F4aXNdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHMubGFzdEZsaWNrT2Zmc2V0W2F4aXNdID0gX2N1cnJQb2ludFtheGlzXSAtIHRlbXBSZWxlYXNlUG9zO1xuXHRcdFx0XHRzLmxhc3RGbGlja0Rpc3RbYXhpc10gPSBNYXRoLmFicyhzLmxhc3RGbGlja09mZnNldFtheGlzXSk7XG5cdFx0XHRcdGlmKHMubGFzdEZsaWNrRGlzdFtheGlzXSA+IDIwKSB7XG5cdFx0XHRcdFx0cy5sYXN0RmxpY2tTcGVlZFtheGlzXSA9IHMubGFzdEZsaWNrT2Zmc2V0W2F4aXNdIC8gbGFzdEZsaWNrRHVyYXRpb247XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cy5sYXN0RmxpY2tTcGVlZFtheGlzXSA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoIE1hdGguYWJzKHMubGFzdEZsaWNrU3BlZWRbYXhpc10pIDwgMC4xICkge1xuXHRcdFx0XHRcdHMubGFzdEZsaWNrU3BlZWRbYXhpc10gPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRzLnNsb3dEb3duUmF0aW9bYXhpc10gPSAwLjk1O1xuXHRcdFx0XHRzLnNsb3dEb3duUmF0aW9SZXZlcnNlW2F4aXNdID0gMSAtIHMuc2xvd0Rvd25SYXRpb1theGlzXTtcblx0XHRcdFx0cy5zcGVlZERlY2VsZXJhdGlvblJhdGlvW2F4aXNdID0gMTtcblx0XHRcdH0sXG5cblx0XHRcdGNhbGN1bGF0ZU92ZXJCb3VuZHNBbmltT2Zmc2V0OiBmdW5jdGlvbihheGlzLCBzcGVlZCkge1xuXHRcdFx0XHRpZighcy5iYWNrQW5pbVN0YXJ0ZWRbYXhpc10pIHtcblxuXHRcdFx0XHRcdGlmKF9wYW5PZmZzZXRbYXhpc10gPiBfY3VyclBhbkJvdW5kcy5taW5bYXhpc10pIHtcblx0XHRcdFx0XHRcdHMuYmFja0FuaW1EZXN0aW5hdGlvbltheGlzXSA9IF9jdXJyUGFuQm91bmRzLm1pbltheGlzXTtcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdH0gZWxzZSBpZihfcGFuT2Zmc2V0W2F4aXNdIDwgX2N1cnJQYW5Cb3VuZHMubWF4W2F4aXNdKSB7XG5cdFx0XHRcdFx0XHRzLmJhY2tBbmltRGVzdGluYXRpb25bYXhpc10gPSBfY3VyclBhbkJvdW5kcy5tYXhbYXhpc107XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYocy5iYWNrQW5pbURlc3RpbmF0aW9uW2F4aXNdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1theGlzXSA9IDAuNztcblx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gPSAxIC0gcy5zbG93RG93blJhdGlvW2F4aXNdO1xuXHRcdFx0XHRcdFx0aWYocy5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzW2F4aXNdIDwgMC4wNSkge1xuXG5cdFx0XHRcdFx0XHRcdHMubGFzdEZsaWNrU3BlZWRbYXhpc10gPSAwO1xuXHRcdFx0XHRcdFx0XHRzLmJhY2tBbmltU3RhcnRlZFtheGlzXSA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0X2FuaW1hdGVQcm9wKCdib3VuY2Vab29tUGFuJytheGlzLF9wYW5PZmZzZXRbYXhpc10sIFxuXHRcdFx0XHRcdFx0XHRcdHMuYmFja0FuaW1EZXN0aW5hdGlvbltheGlzXSwgXG5cdFx0XHRcdFx0XHRcdFx0c3BlZWQgfHwgMzAwLCBcblx0XHRcdFx0XHRcdFx0XHRmcmFtZXdvcmsuZWFzaW5nLnNpbmUub3V0LCBcblx0XHRcdFx0XHRcdFx0XHRmdW5jdGlvbihwb3MpIHtcblx0XHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXRbYXhpc10gPSBwb3M7XG5cdFx0XHRcdFx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0Ly8gUmVkdWNlcyB0aGUgc3BlZWQgYnkgc2xvd0Rvd25SYXRpbyAocGVyIDEwbXMpXG5cdFx0XHRjYWxjdWxhdGVBbmltT2Zmc2V0OiBmdW5jdGlvbihheGlzKSB7XG5cdFx0XHRcdGlmKCFzLmJhY2tBbmltU3RhcnRlZFtheGlzXSkge1xuXHRcdFx0XHRcdHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSA9IHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSAqIChzLnNsb3dEb3duUmF0aW9bYXhpc10gKyBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gLSBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHMuc2xvd0Rvd25SYXRpb1JldmVyc2VbYXhpc10gKiBzLnRpbWVEaWZmIC8gMTApO1xuXG5cdFx0XHRcdFx0cy5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzW2F4aXNdID0gTWF0aC5hYnMocy5sYXN0RmxpY2tTcGVlZFtheGlzXSAqIHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb1theGlzXSk7XG5cdFx0XHRcdFx0cy5kaXN0YW5jZU9mZnNldFtheGlzXSA9IHMubGFzdEZsaWNrU3BlZWRbYXhpc10gKiBzLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9bYXhpc10gKiBzLnRpbWVEaWZmO1xuXHRcdFx0XHRcdF9wYW5PZmZzZXRbYXhpc10gKz0gcy5kaXN0YW5jZU9mZnNldFtheGlzXTtcblxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRwYW5BbmltTG9vcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICggX2FuaW1hdGlvbnMuem9vbVBhbiApIHtcblx0XHRcdFx0XHRfYW5pbWF0aW9ucy56b29tUGFuLnJhZiA9IF9yZXF1ZXN0QUYocy5wYW5BbmltTG9vcCk7XG5cblx0XHRcdFx0XHRzLm5vdyA9IF9nZXRDdXJyZW50VGltZSgpO1xuXHRcdFx0XHRcdHMudGltZURpZmYgPSBzLm5vdyAtIHMubGFzdE5vdztcblx0XHRcdFx0XHRzLmxhc3ROb3cgPSBzLm5vdztcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRzLmNhbGN1bGF0ZUFuaW1PZmZzZXQoJ3gnKTtcblx0XHRcdFx0XHRzLmNhbGN1bGF0ZUFuaW1PZmZzZXQoJ3knKTtcblxuXHRcdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0cy5jYWxjdWxhdGVPdmVyQm91bmRzQW5pbU9mZnNldCgneCcpO1xuXHRcdFx0XHRcdHMuY2FsY3VsYXRlT3ZlckJvdW5kc0FuaW1PZmZzZXQoJ3knKTtcblxuXG5cdFx0XHRcdFx0aWYgKHMuc3BlZWREZWNlbGVyYXRpb25SYXRpb0Ficy54IDwgMC4wNSAmJiBzLnNwZWVkRGVjZWxlcmF0aW9uUmF0aW9BYnMueSA8IDAuMDUpIHtcblxuXHRcdFx0XHRcdFx0Ly8gcm91bmQgcGFuIHBvc2l0aW9uXG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggPSBNYXRoLnJvdW5kKF9wYW5PZmZzZXQueCk7XG5cdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSBNYXRoLnJvdW5kKF9wYW5PZmZzZXQueSk7XG5cdFx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRfc3RvcEFuaW1hdGlvbignem9vbVBhbicpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cdFx0fTtcblx0XHRyZXR1cm4gcztcblx0fSxcblxuXHRfY29tcGxldGVQYW5HZXN0dXJlID0gZnVuY3Rpb24oYW5pbURhdGEpIHtcblx0XHQvLyBjYWxjdWxhdGUgc3dpcGUgc3BlZWQgZm9yIFkgYXhpcyAocGFhbm5pbmcpXG5cdFx0YW5pbURhdGEuY2FsY3VsYXRlU3dpcGVTcGVlZCgneScpO1xuXG5cdFx0X2N1cnJQYW5Cb3VuZHMgPSBzZWxmLmN1cnJJdGVtLmJvdW5kcztcblx0XHRcblx0XHRhbmltRGF0YS5iYWNrQW5pbURlc3RpbmF0aW9uID0ge307XG5cdFx0YW5pbURhdGEuYmFja0FuaW1TdGFydGVkID0ge307XG5cblx0XHQvLyBBdm9pZCBhY2NlbGVyYXRpb24gYW5pbWF0aW9uIGlmIHNwZWVkIGlzIHRvbyBsb3dcblx0XHRpZihNYXRoLmFicyhhbmltRGF0YS5sYXN0RmxpY2tTcGVlZC54KSA8PSAwLjA1ICYmIE1hdGguYWJzKGFuaW1EYXRhLmxhc3RGbGlja1NwZWVkLnkpIDw9IDAuMDUgKSB7XG5cdFx0XHRhbmltRGF0YS5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzLnggPSBhbmltRGF0YS5zcGVlZERlY2VsZXJhdGlvblJhdGlvQWJzLnkgPSAwO1xuXG5cdFx0XHQvLyBSdW4gcGFuIGRyYWcgcmVsZWFzZSBhbmltYXRpb24uIEUuZy4gaWYgeW91IGRyYWcgaW1hZ2UgYW5kIHJlbGVhc2UgZmluZ2VyIHdpdGhvdXQgbW9tZW50dW0uXG5cdFx0XHRhbmltRGF0YS5jYWxjdWxhdGVPdmVyQm91bmRzQW5pbU9mZnNldCgneCcpO1xuXHRcdFx0YW5pbURhdGEuY2FsY3VsYXRlT3ZlckJvdW5kc0FuaW1PZmZzZXQoJ3knKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIEFuaW1hdGlvbiBsb29wIHRoYXQgY29udHJvbHMgdGhlIGFjY2VsZXJhdGlvbiBhZnRlciBwYW4gZ2VzdHVyZSBlbmRzXG5cdFx0X3JlZ2lzdGVyU3RhcnRBbmltYXRpb24oJ3pvb21QYW4nKTtcblx0XHRhbmltRGF0YS5sYXN0Tm93ID0gX2dldEN1cnJlbnRUaW1lKCk7XG5cdFx0YW5pbURhdGEucGFuQW5pbUxvb3AoKTtcblx0fSxcblxuXG5cdF9maW5pc2hTd2lwZU1haW5TY3JvbGxHZXN0dXJlID0gZnVuY3Rpb24oZ2VzdHVyZVR5cGUsIF9yZWxlYXNlQW5pbURhdGEpIHtcblx0XHR2YXIgaXRlbUNoYW5nZWQ7XG5cdFx0aWYoIV9tYWluU2Nyb2xsQW5pbWF0aW5nKSB7XG5cdFx0XHRfY3Vyclpvb21lZEl0ZW1JbmRleCA9IF9jdXJyZW50SXRlbUluZGV4O1xuXHRcdH1cblxuXG5cdFx0XG5cdFx0dmFyIGl0ZW1zRGlmZjtcblxuXHRcdGlmKGdlc3R1cmVUeXBlID09PSAnc3dpcGUnKSB7XG5cdFx0XHR2YXIgdG90YWxTaGlmdERpc3QgPSBfY3VyclBvaW50LnggLSBfc3RhcnRQb2ludC54LFxuXHRcdFx0XHRpc0Zhc3RMYXN0RmxpY2sgPSBfcmVsZWFzZUFuaW1EYXRhLmxhc3RGbGlja0Rpc3QueCA8IDEwO1xuXG5cdFx0XHQvLyBpZiBjb250YWluZXIgaXMgc2hpZnRlZCBmb3IgbW9yZSB0aGFuIE1JTl9TV0lQRV9ESVNUQU5DRSwgXG5cdFx0XHQvLyBhbmQgbGFzdCBmbGljayBnZXN0dXJlIHdhcyBpbiByaWdodCBkaXJlY3Rpb25cblx0XHRcdGlmKHRvdGFsU2hpZnREaXN0ID4gTUlOX1NXSVBFX0RJU1RBTkNFICYmIFxuXHRcdFx0XHQoaXNGYXN0TGFzdEZsaWNrIHx8IF9yZWxlYXNlQW5pbURhdGEubGFzdEZsaWNrT2Zmc2V0LnggPiAyMCkgKSB7XG5cdFx0XHRcdC8vIGdvIHRvIHByZXYgaXRlbVxuXHRcdFx0XHRpdGVtc0RpZmYgPSAtMTtcblx0XHRcdH0gZWxzZSBpZih0b3RhbFNoaWZ0RGlzdCA8IC1NSU5fU1dJUEVfRElTVEFOQ0UgJiYgXG5cdFx0XHRcdChpc0Zhc3RMYXN0RmxpY2sgfHwgX3JlbGVhc2VBbmltRGF0YS5sYXN0RmxpY2tPZmZzZXQueCA8IC0yMCkgKSB7XG5cdFx0XHRcdC8vIGdvIHRvIG5leHQgaXRlbVxuXHRcdFx0XHRpdGVtc0RpZmYgPSAxO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHZhciBuZXh0Q2lyY2xlO1xuXG5cdFx0aWYoaXRlbXNEaWZmKSB7XG5cdFx0XHRcblx0XHRcdF9jdXJyZW50SXRlbUluZGV4ICs9IGl0ZW1zRGlmZjtcblxuXHRcdFx0aWYoX2N1cnJlbnRJdGVtSW5kZXggPCAwKSB7XG5cdFx0XHRcdF9jdXJyZW50SXRlbUluZGV4ID0gX29wdGlvbnMubG9vcCA/IF9nZXROdW1JdGVtcygpLTEgOiAwO1xuXHRcdFx0XHRuZXh0Q2lyY2xlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSBpZihfY3VycmVudEl0ZW1JbmRleCA+PSBfZ2V0TnVtSXRlbXMoKSkge1xuXHRcdFx0XHRfY3VycmVudEl0ZW1JbmRleCA9IF9vcHRpb25zLmxvb3AgPyAwIDogX2dldE51bUl0ZW1zKCktMTtcblx0XHRcdFx0bmV4dENpcmNsZSA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFuZXh0Q2lyY2xlIHx8IF9vcHRpb25zLmxvb3ApIHtcblx0XHRcdFx0X2luZGV4RGlmZiArPSBpdGVtc0RpZmY7XG5cdFx0XHRcdF9jdXJyUG9zaXRpb25JbmRleCAtPSBpdGVtc0RpZmY7XG5cdFx0XHRcdGl0ZW1DaGFuZ2VkID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdFxuXG5cdFx0XHRcblx0XHR9XG5cblx0XHR2YXIgYW5pbWF0ZVRvWCA9IF9zbGlkZVNpemUueCAqIF9jdXJyUG9zaXRpb25JbmRleDtcblx0XHR2YXIgYW5pbWF0ZVRvRGlzdCA9IE1hdGguYWJzKCBhbmltYXRlVG9YIC0gX21haW5TY3JvbGxQb3MueCApO1xuXHRcdHZhciBmaW5pc2hBbmltRHVyYXRpb247XG5cblxuXHRcdGlmKCFpdGVtQ2hhbmdlZCAmJiBhbmltYXRlVG9YID4gX21haW5TY3JvbGxQb3MueCAhPT0gX3JlbGVhc2VBbmltRGF0YS5sYXN0RmxpY2tTcGVlZC54ID4gMCkge1xuXHRcdFx0Ly8gXCJyZXR1cm4gdG8gY3VycmVudFwiIGR1cmF0aW9uLCBlLmcuIHdoZW4gZHJhZ2dpbmcgZnJvbSBzbGlkZSAwIHRvIC0xXG5cdFx0XHRmaW5pc2hBbmltRHVyYXRpb24gPSAzMzM7IFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmaW5pc2hBbmltRHVyYXRpb24gPSBNYXRoLmFicyhfcmVsZWFzZUFuaW1EYXRhLmxhc3RGbGlja1NwZWVkLngpID4gMCA/IFxuXHRcdFx0XHRcdFx0XHRcdFx0YW5pbWF0ZVRvRGlzdCAvIE1hdGguYWJzKF9yZWxlYXNlQW5pbURhdGEubGFzdEZsaWNrU3BlZWQueCkgOiBcblx0XHRcdFx0XHRcdFx0XHRcdDMzMztcblxuXHRcdFx0ZmluaXNoQW5pbUR1cmF0aW9uID0gTWF0aC5taW4oZmluaXNoQW5pbUR1cmF0aW9uLCA0MDApO1xuXHRcdFx0ZmluaXNoQW5pbUR1cmF0aW9uID0gTWF0aC5tYXgoZmluaXNoQW5pbUR1cmF0aW9uLCAyNTApO1xuXHRcdH1cblxuXHRcdGlmKF9jdXJyWm9vbWVkSXRlbUluZGV4ID09PSBfY3VycmVudEl0ZW1JbmRleCkge1xuXHRcdFx0aXRlbUNoYW5nZWQgPSBmYWxzZTtcblx0XHR9XG5cdFx0XG5cdFx0X21haW5TY3JvbGxBbmltYXRpbmcgPSB0cnVlO1xuXHRcdFxuXHRcdF9zaG91dCgnbWFpblNjcm9sbEFuaW1TdGFydCcpO1xuXG5cdFx0X2FuaW1hdGVQcm9wKCdtYWluU2Nyb2xsJywgX21haW5TY3JvbGxQb3MueCwgYW5pbWF0ZVRvWCwgZmluaXNoQW5pbUR1cmF0aW9uLCBmcmFtZXdvcmsuZWFzaW5nLmN1YmljLm91dCwgXG5cdFx0XHRfbW92ZU1haW5TY3JvbGwsXG5cdFx0XHRmdW5jdGlvbigpIHtcblx0XHRcdFx0X3N0b3BBbGxBbmltYXRpb25zKCk7XG5cdFx0XHRcdF9tYWluU2Nyb2xsQW5pbWF0aW5nID0gZmFsc2U7XG5cdFx0XHRcdF9jdXJyWm9vbWVkSXRlbUluZGV4ID0gLTE7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZihpdGVtQ2hhbmdlZCB8fCBfY3Vyclpvb21lZEl0ZW1JbmRleCAhPT0gX2N1cnJlbnRJdGVtSW5kZXgpIHtcblx0XHRcdFx0XHRzZWxmLnVwZGF0ZUN1cnJJdGVtKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdF9zaG91dCgnbWFpblNjcm9sbEFuaW1Db21wbGV0ZScpO1xuXHRcdFx0fVxuXHRcdCk7XG5cblx0XHRpZihpdGVtQ2hhbmdlZCkge1xuXHRcdFx0c2VsZi51cGRhdGVDdXJySXRlbSh0cnVlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaXRlbUNoYW5nZWQ7XG5cdH0sXG5cblx0X2NhbGN1bGF0ZVpvb21MZXZlbCA9IGZ1bmN0aW9uKHRvdWNoZXNEaXN0YW5jZSkge1xuXHRcdHJldHVybiAgMSAvIF9zdGFydFBvaW50c0Rpc3RhbmNlICogdG91Y2hlc0Rpc3RhbmNlICogX3N0YXJ0Wm9vbUxldmVsO1xuXHR9LFxuXG5cdC8vIFJlc2V0cyB6b29tIGlmIGl0J3Mgb3V0IG9mIGJvdW5kc1xuXHRfY29tcGxldGVab29tR2VzdHVyZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBkZXN0Wm9vbUxldmVsID0gX2N1cnJab29tTGV2ZWwsXG5cdFx0XHRtaW5ab29tTGV2ZWwgPSBfZ2V0TWluWm9vbUxldmVsKCksXG5cdFx0XHRtYXhab29tTGV2ZWwgPSBfZ2V0TWF4Wm9vbUxldmVsKCk7XG5cblx0XHRpZiAoIF9jdXJyWm9vbUxldmVsIDwgbWluWm9vbUxldmVsICkge1xuXHRcdFx0ZGVzdFpvb21MZXZlbCA9IG1pblpvb21MZXZlbDtcblx0XHR9IGVsc2UgaWYgKCBfY3Vyclpvb21MZXZlbCA+IG1heFpvb21MZXZlbCApIHtcblx0XHRcdGRlc3Rab29tTGV2ZWwgPSBtYXhab29tTGV2ZWw7XG5cdFx0fVxuXG5cdFx0dmFyIGRlc3RPcGFjaXR5ID0gMSxcblx0XHRcdG9uVXBkYXRlLFxuXHRcdFx0aW5pdGlhbE9wYWNpdHkgPSBfYmdPcGFjaXR5O1xuXG5cdFx0aWYoX29wYWNpdHlDaGFuZ2VkICYmICFfaXNab29taW5nSW4gJiYgIV93YXNPdmVySW5pdGlhbFpvb20gJiYgX2N1cnJab29tTGV2ZWwgPCBtaW5ab29tTGV2ZWwpIHtcblx0XHRcdC8vX2Nsb3NlZEJ5U2Nyb2xsID0gdHJ1ZTtcblx0XHRcdHNlbGYuY2xvc2UoKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmKF9vcGFjaXR5Q2hhbmdlZCkge1xuXHRcdFx0b25VcGRhdGUgPSBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0X2FwcGx5QmdPcGFjaXR5KCAgKGRlc3RPcGFjaXR5IC0gaW5pdGlhbE9wYWNpdHkpICogbm93ICsgaW5pdGlhbE9wYWNpdHkgKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0c2VsZi56b29tVG8oZGVzdFpvb21MZXZlbCwgMCwgMjAwLCAgZnJhbWV3b3JrLmVhc2luZy5jdWJpYy5vdXQsIG9uVXBkYXRlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5fcmVnaXN0ZXJNb2R1bGUoJ0dlc3R1cmVzJywge1xuXHRwdWJsaWNNZXRob2RzOiB7XG5cblx0XHRpbml0R2VzdHVyZXM6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQvLyBoZWxwZXIgZnVuY3Rpb24gdGhhdCBidWlsZHMgdG91Y2gvcG9pbnRlci9tb3VzZSBldmVudHNcblx0XHRcdHZhciBhZGRFdmVudE5hbWVzID0gZnVuY3Rpb24ocHJlZiwgZG93biwgbW92ZSwgdXAsIGNhbmNlbCkge1xuXHRcdFx0XHRfZHJhZ1N0YXJ0RXZlbnQgPSBwcmVmICsgZG93bjtcblx0XHRcdFx0X2RyYWdNb3ZlRXZlbnQgPSBwcmVmICsgbW92ZTtcblx0XHRcdFx0X2RyYWdFbmRFdmVudCA9IHByZWYgKyB1cDtcblx0XHRcdFx0aWYoY2FuY2VsKSB7XG5cdFx0XHRcdFx0X2RyYWdDYW5jZWxFdmVudCA9IHByZWYgKyBjYW5jZWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X2RyYWdDYW5jZWxFdmVudCA9ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRfcG9pbnRlckV2ZW50RW5hYmxlZCA9IF9mZWF0dXJlcy5wb2ludGVyRXZlbnQ7XG5cdFx0XHRpZihfcG9pbnRlckV2ZW50RW5hYmxlZCAmJiBfZmVhdHVyZXMudG91Y2gpIHtcblx0XHRcdFx0Ly8gd2UgZG9uJ3QgbmVlZCB0b3VjaCBldmVudHMsIGlmIGJyb3dzZXIgc3VwcG9ydHMgcG9pbnRlciBldmVudHNcblx0XHRcdFx0X2ZlYXR1cmVzLnRvdWNoID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmKF9wb2ludGVyRXZlbnRFbmFibGVkKSB7XG5cdFx0XHRcdGlmKG5hdmlnYXRvci5wb2ludGVyRW5hYmxlZCkge1xuXHRcdFx0XHRcdGFkZEV2ZW50TmFtZXMoJ3BvaW50ZXInLCAnZG93bicsICdtb3ZlJywgJ3VwJywgJ2NhbmNlbCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIElFMTAgcG9pbnRlciBldmVudHMgYXJlIGNhc2Utc2Vuc2l0aXZlXG5cdFx0XHRcdFx0YWRkRXZlbnROYW1lcygnTVNQb2ludGVyJywgJ0Rvd24nLCAnTW92ZScsICdVcCcsICdDYW5jZWwnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKF9mZWF0dXJlcy50b3VjaCkge1xuXHRcdFx0XHRhZGRFdmVudE5hbWVzKCd0b3VjaCcsICdzdGFydCcsICdtb3ZlJywgJ2VuZCcsICdjYW5jZWwnKTtcblx0XHRcdFx0X2xpa2VseVRvdWNoRGV2aWNlID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFkZEV2ZW50TmFtZXMoJ21vdXNlJywgJ2Rvd24nLCAnbW92ZScsICd1cCcpO1x0XG5cdFx0XHR9XG5cblx0XHRcdF91cE1vdmVFdmVudHMgPSBfZHJhZ01vdmVFdmVudCArICcgJyArIF9kcmFnRW5kRXZlbnQgICsgJyAnICsgIF9kcmFnQ2FuY2VsRXZlbnQ7XG5cdFx0XHRfZG93bkV2ZW50cyA9IF9kcmFnU3RhcnRFdmVudDtcblxuXHRcdFx0aWYoX3BvaW50ZXJFdmVudEVuYWJsZWQgJiYgIV9saWtlbHlUb3VjaERldmljZSkge1xuXHRcdFx0XHRfbGlrZWx5VG91Y2hEZXZpY2UgPSAobmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMSkgfHwgKG5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzID4gMSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBtYWtlIHZhcmlhYmxlIHB1YmxpY1xuXHRcdFx0c2VsZi5saWtlbHlUb3VjaERldmljZSA9IF9saWtlbHlUb3VjaERldmljZTsgXG5cdFx0XHRcblx0XHRcdF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnU3RhcnRFdmVudF0gPSBfb25EcmFnU3RhcnQ7XG5cdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tfZHJhZ01vdmVFdmVudF0gPSBfb25EcmFnTW92ZTtcblx0XHRcdF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnRW5kRXZlbnRdID0gX29uRHJhZ1JlbGVhc2U7IC8vIHRoZSBLcmFrZW5cblxuXHRcdFx0aWYoX2RyYWdDYW5jZWxFdmVudCkge1xuXHRcdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVyc1tfZHJhZ0NhbmNlbEV2ZW50XSA9IF9nbG9iYWxFdmVudEhhbmRsZXJzW19kcmFnRW5kRXZlbnRdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBCaW5kIG1vdXNlIGV2ZW50cyBvbiBkZXZpY2Ugd2l0aCBkZXRlY3RlZCBoYXJkd2FyZSB0b3VjaCBzdXBwb3J0LCBpbiBjYXNlIGl0IHN1cHBvcnRzIG11bHRpcGxlIHR5cGVzIG9mIGlucHV0LlxuXHRcdFx0aWYoX2ZlYXR1cmVzLnRvdWNoKSB7XG5cdFx0XHRcdF9kb3duRXZlbnRzICs9ICcgbW91c2Vkb3duJztcblx0XHRcdFx0X3VwTW92ZUV2ZW50cyArPSAnIG1vdXNlbW92ZSBtb3VzZXVwJztcblx0XHRcdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMubW91c2Vkb3duID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdTdGFydEV2ZW50XTtcblx0XHRcdFx0X2dsb2JhbEV2ZW50SGFuZGxlcnMubW91c2Vtb3ZlID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdNb3ZlRXZlbnRdO1xuXHRcdFx0XHRfZ2xvYmFsRXZlbnRIYW5kbGVycy5tb3VzZXVwID0gX2dsb2JhbEV2ZW50SGFuZGxlcnNbX2RyYWdFbmRFdmVudF07XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFfbGlrZWx5VG91Y2hEZXZpY2UpIHtcblx0XHRcdFx0Ly8gZG9uJ3QgYWxsb3cgcGFuIHRvIG5leHQgc2xpZGUgZnJvbSB6b29tZWQgc3RhdGUgb24gRGVza3RvcFxuXHRcdFx0XHRfb3B0aW9ucy5hbGxvd1BhblRvTmV4dCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XG59KTtcblxuXG4vKj4+Z2VzdHVyZXMqL1xuXG4vKj4+c2hvdy1oaWRlLXRyYW5zaXRpb24qL1xuLyoqXG4gKiBzaG93LWhpZGUtdHJhbnNpdGlvbi5qczpcbiAqXG4gKiBNYW5hZ2VzIGluaXRpYWwgb3BlbmluZyBvciBjbG9zaW5nIHRyYW5zaXRpb24uXG4gKlxuICogSWYgeW91J3JlIG5vdCBwbGFubmluZyB0byB1c2UgdHJhbnNpdGlvbiBmb3IgZ2FsbGVyeSBhdCBhbGwsXG4gKiB5b3UgbWF5IHNldCBvcHRpb25zIGhpZGVBbmltYXRpb25EdXJhdGlvbiBhbmQgc2hvd0FuaW1hdGlvbkR1cmF0aW9uIHRvIDAsXG4gKiBhbmQganVzdCBkZWxldGUgc3RhcnRBbmltYXRpb24gZnVuY3Rpb24uXG4gKiBcbiAqL1xuXG5cbnZhciBfc2hvd09ySGlkZVRpbWVvdXQsXG5cdF9zaG93T3JIaWRlID0gZnVuY3Rpb24oaXRlbSwgaW1nLCBvdXQsIGNvbXBsZXRlRm4pIHtcblxuXHRcdGlmKF9zaG93T3JIaWRlVGltZW91dCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9zaG93T3JIaWRlVGltZW91dCk7XG5cdFx0fVxuXG5cdFx0X2luaXRpYWxab29tUnVubmluZyA9IHRydWU7XG5cdFx0X2luaXRpYWxDb250ZW50U2V0ID0gdHJ1ZTtcblx0XHRcblx0XHQvLyBkaW1lbnNpb25zIG9mIHNtYWxsIHRodW1ibmFpbCB7eDoseTosdzp9LlxuXHRcdC8vIEhlaWdodCBpcyBvcHRpb25hbCwgYXMgY2FsY3VsYXRlZCBiYXNlZCBvbiBsYXJnZSBpbWFnZS5cblx0XHR2YXIgdGh1bWJCb3VuZHM7IFxuXHRcdGlmKGl0ZW0uaW5pdGlhbExheW91dCkge1xuXHRcdFx0dGh1bWJCb3VuZHMgPSBpdGVtLmluaXRpYWxMYXlvdXQ7XG5cdFx0XHRpdGVtLmluaXRpYWxMYXlvdXQgPSBudWxsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHVtYkJvdW5kcyA9IF9vcHRpb25zLmdldFRodW1iQm91bmRzRm4gJiYgX29wdGlvbnMuZ2V0VGh1bWJCb3VuZHNGbihfY3VycmVudEl0ZW1JbmRleCk7XG5cdFx0fVxuXG5cdFx0dmFyIGR1cmF0aW9uID0gb3V0ID8gX29wdGlvbnMuaGlkZUFuaW1hdGlvbkR1cmF0aW9uIDogX29wdGlvbnMuc2hvd0FuaW1hdGlvbkR1cmF0aW9uO1xuXG5cdFx0dmFyIG9uQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdF9zdG9wQW5pbWF0aW9uKCdpbml0aWFsWm9vbScpO1xuXHRcdFx0aWYoIW91dCkge1xuXHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoMSk7XG5cdFx0XHRcdGlmKGltZykge1xuXHRcdFx0XHRcdGltZy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblx0XHRcdFx0fVxuXHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS1hbmltYXRlZC1pbicpO1xuXHRcdFx0XHRfc2hvdXQoJ2luaXRpYWxab29tJyArIChvdXQgPyAnT3V0RW5kJyA6ICdJbkVuZCcpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbGYudGVtcGxhdGUucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuXHRcdFx0XHRzZWxmLmJnLnJlbW92ZUF0dHJpYnV0ZSgnc3R5bGUnKTtcblx0XHRcdH1cblxuXHRcdFx0aWYoY29tcGxldGVGbikge1xuXHRcdFx0XHRjb21wbGV0ZUZuKCk7XG5cdFx0XHR9XG5cdFx0XHRfaW5pdGlhbFpvb21SdW5uaW5nID0gZmFsc2U7XG5cdFx0fTtcblxuXHRcdC8vIGlmIGJvdW5kcyBhcmVuJ3QgcHJvdmlkZWQsIGp1c3Qgb3BlbiBnYWxsZXJ5IHdpdGhvdXQgYW5pbWF0aW9uXG5cdFx0aWYoIWR1cmF0aW9uIHx8ICF0aHVtYkJvdW5kcyB8fCB0aHVtYkJvdW5kcy54ID09PSB1bmRlZmluZWQpIHtcblxuXHRcdFx0X3Nob3V0KCdpbml0aWFsWm9vbScgKyAob3V0ID8gJ091dCcgOiAnSW4nKSApO1xuXG5cdFx0XHRfY3Vyclpvb21MZXZlbCA9IGl0ZW0uaW5pdGlhbFpvb21MZXZlbDtcblx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfcGFuT2Zmc2V0LCAgaXRlbS5pbml0aWFsUG9zaXRpb24gKTtcblx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cblx0XHRcdHRlbXBsYXRlLnN0eWxlLm9wYWNpdHkgPSBvdXQgPyAwIDogMTtcblx0XHRcdF9hcHBseUJnT3BhY2l0eSgxKTtcblxuXHRcdFx0aWYoZHVyYXRpb24pIHtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRvbkNvbXBsZXRlKCk7XG5cdFx0XHRcdH0sIGR1cmF0aW9uKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG9uQ29tcGxldGUoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBzdGFydEFuaW1hdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGNsb3NlV2l0aFJhZiA9IF9jbG9zZWRCeVNjcm9sbCxcblx0XHRcdFx0ZmFkZUV2ZXJ5dGhpbmcgPSAhc2VsZi5jdXJySXRlbS5zcmMgfHwgc2VsZi5jdXJySXRlbS5sb2FkRXJyb3IgfHwgX29wdGlvbnMuc2hvd0hpZGVPcGFjaXR5O1xuXHRcdFx0XG5cdFx0XHQvLyBhcHBseSBody1hY2NlbGVyYXRpb24gdG8gaW1hZ2Vcblx0XHRcdGlmKGl0ZW0ubWluaUltZykge1xuXHRcdFx0XHRpdGVtLm1pbmlJbWcuc3R5bGUud2Via2l0QmFja2ZhY2VWaXNpYmlsaXR5ID0gJ2hpZGRlbic7XG5cdFx0XHR9XG5cblx0XHRcdGlmKCFvdXQpIHtcblx0XHRcdFx0X2N1cnJab29tTGV2ZWwgPSB0aHVtYkJvdW5kcy53IC8gaXRlbS53O1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnggPSB0aHVtYkJvdW5kcy54O1xuXHRcdFx0XHRfcGFuT2Zmc2V0LnkgPSB0aHVtYkJvdW5kcy55IC0gX2luaXRhbFdpbmRvd1Njcm9sbFk7XG5cblx0XHRcdFx0c2VsZltmYWRlRXZlcnl0aGluZyA/ICd0ZW1wbGF0ZScgOiAnYmcnXS5zdHlsZS5vcGFjaXR5ID0gMC4wMDE7XG5cdFx0XHRcdF9hcHBseUN1cnJlbnRab29tUGFuKCk7XG5cdFx0XHR9XG5cblx0XHRcdF9yZWdpc3RlclN0YXJ0QW5pbWF0aW9uKCdpbml0aWFsWm9vbScpO1xuXHRcdFx0XG5cdFx0XHRpZihvdXQgJiYgIWNsb3NlV2l0aFJhZikge1xuXHRcdFx0XHRmcmFtZXdvcmsucmVtb3ZlQ2xhc3ModGVtcGxhdGUsICdwc3dwLS1hbmltYXRlZC1pbicpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihmYWRlRXZlcnl0aGluZykge1xuXHRcdFx0XHRpZihvdXQpIHtcblx0XHRcdFx0XHRmcmFtZXdvcmtbIChjbG9zZVdpdGhSYWYgPyAncmVtb3ZlJyA6ICdhZGQnKSArICdDbGFzcycgXSh0ZW1wbGF0ZSwgJ3Bzd3AtLWFuaW1hdGVfb3BhY2l0eScpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS1hbmltYXRlX29wYWNpdHknKTtcblx0XHRcdFx0XHR9LCAzMCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X3Nob3dPckhpZGVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblxuXHRcdFx0XHRfc2hvdXQoJ2luaXRpYWxab29tJyArIChvdXQgPyAnT3V0JyA6ICdJbicpICk7XG5cdFx0XHRcdFxuXG5cdFx0XHRcdGlmKCFvdXQpIHtcblxuXHRcdFx0XHRcdC8vIFwiaW5cIiBhbmltYXRpb24gYWx3YXlzIHVzZXMgQ1NTIHRyYW5zaXRpb25zIChpbnN0ZWFkIG9mIHJBRikuXG5cdFx0XHRcdFx0Ly8gQ1NTIHRyYW5zaXRpb24gd29yayBmYXN0ZXIgaGVyZSwgXG5cdFx0XHRcdFx0Ly8gYXMgZGV2ZWxvcGVyIG1heSBhbHNvIHdhbnQgdG8gYW5pbWF0ZSBvdGhlciB0aGluZ3MsIFxuXHRcdFx0XHRcdC8vIGxpa2UgdWkgb24gdG9wIG9mIHNsaWRpbmcgYXJlYSwgd2hpY2ggY2FuIGJlIGFuaW1hdGVkIGp1c3QgdmlhIENTU1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gaXRlbS5pbml0aWFsWm9vbUxldmVsO1xuXHRcdFx0XHRcdF9lcXVhbGl6ZVBvaW50cyhfcGFuT2Zmc2V0LCAgaXRlbS5pbml0aWFsUG9zaXRpb24gKTtcblx0XHRcdFx0XHRfYXBwbHlDdXJyZW50Wm9vbVBhbigpO1xuXHRcdFx0XHRcdF9hcHBseUJnT3BhY2l0eSgxKTtcblxuXHRcdFx0XHRcdGlmKGZhZGVFdmVyeXRoaW5nKSB7XG5cdFx0XHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS5vcGFjaXR5ID0gMTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0X2FwcGx5QmdPcGFjaXR5KDEpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdF9zaG93T3JIaWRlVGltZW91dCA9IHNldFRpbWVvdXQob25Db21wbGV0ZSwgZHVyYXRpb24gKyAyMCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHQvLyBcIm91dFwiIGFuaW1hdGlvbiB1c2VzIHJBRiBvbmx5IHdoZW4gUGhvdG9Td2lwZSBpcyBjbG9zZWQgYnkgYnJvd3NlciBzY3JvbGwsIHRvIHJlY2FsY3VsYXRlIHBvc2l0aW9uXG5cdFx0XHRcdFx0dmFyIGRlc3Rab29tTGV2ZWwgPSB0aHVtYkJvdW5kcy53IC8gaXRlbS53LFxuXHRcdFx0XHRcdFx0aW5pdGlhbFBhbk9mZnNldCA9IHtcblx0XHRcdFx0XHRcdFx0eDogX3Bhbk9mZnNldC54LFxuXHRcdFx0XHRcdFx0XHR5OiBfcGFuT2Zmc2V0Lnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRpbml0aWFsWm9vbUxldmVsID0gX2N1cnJab29tTGV2ZWwsXG5cdFx0XHRcdFx0XHRpbml0YWxCZ09wYWNpdHkgPSBfYmdPcGFjaXR5LFxuXHRcdFx0XHRcdFx0b25VcGRhdGUgPSBmdW5jdGlvbihub3cpIHtcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGlmKG5vdyA9PT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gZGVzdFpvb21MZXZlbDtcblx0XHRcdFx0XHRcdFx0XHRfcGFuT2Zmc2V0LnggPSB0aHVtYkJvdW5kcy54O1xuXHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueSA9IHRodW1iQm91bmRzLnkgIC0gX2N1cnJlbnRXaW5kb3dTY3JvbGxZO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdF9jdXJyWm9vbUxldmVsID0gKGRlc3Rab29tTGV2ZWwgLSBpbml0aWFsWm9vbUxldmVsKSAqIG5vdyArIGluaXRpYWxab29tTGV2ZWw7XG5cdFx0XHRcdFx0XHRcdFx0X3Bhbk9mZnNldC54ID0gKHRodW1iQm91bmRzLnggLSBpbml0aWFsUGFuT2Zmc2V0LngpICogbm93ICsgaW5pdGlhbFBhbk9mZnNldC54O1xuXHRcdFx0XHRcdFx0XHRcdF9wYW5PZmZzZXQueSA9ICh0aHVtYkJvdW5kcy55IC0gX2N1cnJlbnRXaW5kb3dTY3JvbGxZIC0gaW5pdGlhbFBhbk9mZnNldC55KSAqIG5vdyArIGluaXRpYWxQYW5PZmZzZXQueTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0X2FwcGx5Q3VycmVudFpvb21QYW4oKTtcblx0XHRcdFx0XHRcdFx0aWYoZmFkZUV2ZXJ5dGhpbmcpIHtcblx0XHRcdFx0XHRcdFx0XHR0ZW1wbGF0ZS5zdHlsZS5vcGFjaXR5ID0gMSAtIG5vdztcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRfYXBwbHlCZ09wYWNpdHkoIGluaXRhbEJnT3BhY2l0eSAtIG5vdyAqIGluaXRhbEJnT3BhY2l0eSApO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0aWYoY2xvc2VXaXRoUmFmKSB7XG5cdFx0XHRcdFx0XHRfYW5pbWF0ZVByb3AoJ2luaXRpYWxab29tJywgMCwgMSwgZHVyYXRpb24sIGZyYW1ld29yay5lYXNpbmcuY3ViaWMub3V0LCBvblVwZGF0ZSwgb25Db21wbGV0ZSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdG9uVXBkYXRlKDEpO1xuXHRcdFx0XHRcdFx0X3Nob3dPckhpZGVUaW1lb3V0ID0gc2V0VGltZW91dChvbkNvbXBsZXRlLCBkdXJhdGlvbiArIDIwKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0fSwgb3V0ID8gMjUgOiA5MCk7IC8vIE1haW4gcHVycG9zZSBvZiB0aGlzIGRlbGF5IGlzIHRvIGdpdmUgYnJvd3NlciB0aW1lIHRvIHBhaW50IGFuZFxuXHRcdFx0XHRcdC8vIGNyZWF0ZSBjb21wb3NpdGUgbGF5ZXJzIG9mIFBob3RvU3dpcGUgVUkgcGFydHMgKGJhY2tncm91bmQsIGNvbnRyb2xzLCBjYXB0aW9uLCBhcnJvd3MpLlxuXHRcdFx0XHRcdC8vIFdoaWNoIGF2b2lkcyBsYWcgYXQgdGhlIGJlZ2lubmluZyBvZiBzY2FsZSB0cmFuc2l0aW9uLlxuXHRcdH07XG5cdFx0c3RhcnRBbmltYXRpb24oKTtcblxuXHRcdFxuXHR9O1xuXG4vKj4+c2hvdy1oaWRlLXRyYW5zaXRpb24qL1xuXG4vKj4+aXRlbXMtY29udHJvbGxlciovXG4vKipcbipcbiogQ29udHJvbGxlciBtYW5hZ2VzIGdhbGxlcnkgaXRlbXMsIHRoZWlyIGRpbWVuc2lvbnMsIGFuZCB0aGVpciBjb250ZW50LlxuKiBcbiovXG5cbnZhciBfaXRlbXMsXG5cdF90ZW1wUGFuQXJlYVNpemUgPSB7fSxcblx0X2ltYWdlc1RvQXBwZW5kUG9vbCA9IFtdLFxuXHRfaW5pdGlhbENvbnRlbnRTZXQsXG5cdF9pbml0aWFsWm9vbVJ1bm5pbmcsXG5cdF9jb250cm9sbGVyRGVmYXVsdE9wdGlvbnMgPSB7XG5cdFx0aW5kZXg6IDAsXG5cdFx0ZXJyb3JNc2c6ICc8ZGl2IGNsYXNzPVwicHN3cF9fZXJyb3ItbXNnXCI+PGEgaHJlZj1cIiV1cmwlXCIgdGFyZ2V0PVwiX2JsYW5rXCI+VGhlIGltYWdlPC9hPiBjb3VsZCBub3QgYmUgbG9hZGVkLjwvZGl2PicsXG5cdFx0Zm9yY2VQcm9ncmVzc2l2ZUxvYWRpbmc6IGZhbHNlLCAvLyBUT0RPXG5cdFx0cHJlbG9hZDogWzEsMV0sXG5cdFx0Z2V0TnVtSXRlbXNGbjogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gX2l0ZW1zLmxlbmd0aDtcblx0XHR9XG5cdH07XG5cblxudmFyIF9nZXRJdGVtQXQsXG5cdF9nZXROdW1JdGVtcyxcblx0X2luaXRpYWxJc0xvb3AsXG5cdF9nZXRaZXJvQm91bmRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNlbnRlcjp7eDowLHk6MH0sIFxuXHRcdFx0bWF4Ont4OjAseTowfSwgXG5cdFx0XHRtaW46e3g6MCx5OjB9XG5cdFx0fTtcblx0fSxcblx0X2NhbGN1bGF0ZVNpbmdsZUl0ZW1QYW5Cb3VuZHMgPSBmdW5jdGlvbihpdGVtLCByZWFsUGFuRWxlbWVudFcsIHJlYWxQYW5FbGVtZW50SCApIHtcblx0XHR2YXIgYm91bmRzID0gaXRlbS5ib3VuZHM7XG5cblx0XHQvLyBwb3NpdGlvbiBvZiBlbGVtZW50IHdoZW4gaXQncyBjZW50ZXJlZFxuXHRcdGJvdW5kcy5jZW50ZXIueCA9IE1hdGgucm91bmQoKF90ZW1wUGFuQXJlYVNpemUueCAtIHJlYWxQYW5FbGVtZW50VykgLyAyKTtcblx0XHRib3VuZHMuY2VudGVyLnkgPSBNYXRoLnJvdW5kKChfdGVtcFBhbkFyZWFTaXplLnkgLSByZWFsUGFuRWxlbWVudEgpIC8gMikgKyBpdGVtLnZHYXAudG9wO1xuXG5cdFx0Ly8gbWF4aW11bSBwYW4gcG9zaXRpb25cblx0XHRib3VuZHMubWF4LnggPSAocmVhbFBhbkVsZW1lbnRXID4gX3RlbXBQYW5BcmVhU2l6ZS54KSA/IFxuXHRcdFx0XHRcdFx0XHRNYXRoLnJvdW5kKF90ZW1wUGFuQXJlYVNpemUueCAtIHJlYWxQYW5FbGVtZW50VykgOiBcblx0XHRcdFx0XHRcdFx0Ym91bmRzLmNlbnRlci54O1xuXHRcdFxuXHRcdGJvdW5kcy5tYXgueSA9IChyZWFsUGFuRWxlbWVudEggPiBfdGVtcFBhbkFyZWFTaXplLnkpID8gXG5cdFx0XHRcdFx0XHRcdE1hdGgucm91bmQoX3RlbXBQYW5BcmVhU2l6ZS55IC0gcmVhbFBhbkVsZW1lbnRIKSArIGl0ZW0udkdhcC50b3AgOiBcblx0XHRcdFx0XHRcdFx0Ym91bmRzLmNlbnRlci55O1xuXHRcdFxuXHRcdC8vIG1pbmltdW0gcGFuIHBvc2l0aW9uXG5cdFx0Ym91bmRzLm1pbi54ID0gKHJlYWxQYW5FbGVtZW50VyA+IF90ZW1wUGFuQXJlYVNpemUueCkgPyAwIDogYm91bmRzLmNlbnRlci54O1xuXHRcdGJvdW5kcy5taW4ueSA9IChyZWFsUGFuRWxlbWVudEggPiBfdGVtcFBhbkFyZWFTaXplLnkpID8gaXRlbS52R2FwLnRvcCA6IGJvdW5kcy5jZW50ZXIueTtcblx0fSxcblx0X2NhbGN1bGF0ZUl0ZW1TaXplID0gZnVuY3Rpb24oaXRlbSwgdmlld3BvcnRTaXplLCB6b29tTGV2ZWwpIHtcblxuXHRcdGlmIChpdGVtLnNyYyAmJiAhaXRlbS5sb2FkRXJyb3IpIHtcblx0XHRcdHZhciBpc0luaXRpYWwgPSAhem9vbUxldmVsO1xuXHRcdFx0XG5cdFx0XHRpZihpc0luaXRpYWwpIHtcblx0XHRcdFx0aWYoIWl0ZW0udkdhcCkge1xuXHRcdFx0XHRcdGl0ZW0udkdhcCA9IHt0b3A6MCxib3R0b206MH07XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gYWxsb3dzIG92ZXJyaWRpbmcgdmVydGljYWwgbWFyZ2luIGZvciBpbmRpdmlkdWFsIGl0ZW1zXG5cdFx0XHRcdF9zaG91dCgncGFyc2VWZXJ0aWNhbE1hcmdpbicsIGl0ZW0pO1xuXHRcdFx0fVxuXG5cblx0XHRcdF90ZW1wUGFuQXJlYVNpemUueCA9IHZpZXdwb3J0U2l6ZS54O1xuXHRcdFx0X3RlbXBQYW5BcmVhU2l6ZS55ID0gdmlld3BvcnRTaXplLnkgLSBpdGVtLnZHYXAudG9wIC0gaXRlbS52R2FwLmJvdHRvbTtcblxuXHRcdFx0aWYgKGlzSW5pdGlhbCkge1xuXHRcdFx0XHR2YXIgaFJhdGlvID0gX3RlbXBQYW5BcmVhU2l6ZS54IC8gaXRlbS53O1xuXHRcdFx0XHR2YXIgdlJhdGlvID0gX3RlbXBQYW5BcmVhU2l6ZS55IC8gaXRlbS5oO1xuXG5cdFx0XHRcdGl0ZW0uZml0UmF0aW8gPSBoUmF0aW8gPCB2UmF0aW8gPyBoUmF0aW8gOiB2UmF0aW87XG5cdFx0XHRcdC8vaXRlbS5maWxsUmF0aW8gPSBoUmF0aW8gPiB2UmF0aW8gPyBoUmF0aW8gOiB2UmF0aW87XG5cblx0XHRcdFx0dmFyIHNjYWxlTW9kZSA9IF9vcHRpb25zLnNjYWxlTW9kZTtcblxuXHRcdFx0XHRpZiAoc2NhbGVNb2RlID09PSAnb3JpZycpIHtcblx0XHRcdFx0XHR6b29tTGV2ZWwgPSAxO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNjYWxlTW9kZSA9PT0gJ2ZpdCcpIHtcblx0XHRcdFx0XHR6b29tTGV2ZWwgPSBpdGVtLmZpdFJhdGlvO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHpvb21MZXZlbCA+IDEpIHtcblx0XHRcdFx0XHR6b29tTGV2ZWwgPSAxO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aXRlbS5pbml0aWFsWm9vbUxldmVsID0gem9vbUxldmVsO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYoIWl0ZW0uYm91bmRzKSB7XG5cdFx0XHRcdFx0Ly8gcmV1c2UgYm91bmRzIG9iamVjdFxuXHRcdFx0XHRcdGl0ZW0uYm91bmRzID0gX2dldFplcm9Cb3VuZHMoKTsgXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYoIXpvb21MZXZlbCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9jYWxjdWxhdGVTaW5nbGVJdGVtUGFuQm91bmRzKGl0ZW0sIGl0ZW0udyAqIHpvb21MZXZlbCwgaXRlbS5oICogem9vbUxldmVsKTtcblxuXHRcdFx0aWYgKGlzSW5pdGlhbCAmJiB6b29tTGV2ZWwgPT09IGl0ZW0uaW5pdGlhbFpvb21MZXZlbCkge1xuXHRcdFx0XHRpdGVtLmluaXRpYWxQb3NpdGlvbiA9IGl0ZW0uYm91bmRzLmNlbnRlcjtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGl0ZW0uYm91bmRzO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpdGVtLncgPSBpdGVtLmggPSAwO1xuXHRcdFx0aXRlbS5pbml0aWFsWm9vbUxldmVsID0gaXRlbS5maXRSYXRpbyA9IDE7XG5cdFx0XHRpdGVtLmJvdW5kcyA9IF9nZXRaZXJvQm91bmRzKCk7XG5cdFx0XHRpdGVtLmluaXRpYWxQb3NpdGlvbiA9IGl0ZW0uYm91bmRzLmNlbnRlcjtcblxuXHRcdFx0Ly8gaWYgaXQncyBub3QgaW1hZ2UsIHdlIHJldHVybiB6ZXJvIGJvdW5kcyAoY29udGVudCBpcyBub3Qgem9vbWFibGUpXG5cdFx0XHRyZXR1cm4gaXRlbS5ib3VuZHM7XG5cdFx0fVxuXHRcdFxuXHR9LFxuXG5cdFxuXG5cblx0X2FwcGVuZEltYWdlID0gZnVuY3Rpb24oaW5kZXgsIGl0ZW0sIGJhc2VEaXYsIGltZywgcHJldmVudEFuaW1hdGlvbiwga2VlcFBsYWNlaG9sZGVyKSB7XG5cdFx0XG5cblx0XHRpZihpdGVtLmxvYWRFcnJvcikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmKGltZykge1xuXG5cdFx0XHRpdGVtLmltYWdlQXBwZW5kZWQgPSB0cnVlO1xuXHRcdFx0X3NldEltYWdlU2l6ZShpdGVtLCBpbWcsIChpdGVtID09PSBzZWxmLmN1cnJJdGVtICYmIF9yZW5kZXJNYXhSZXNvbHV0aW9uKSApO1xuXHRcdFx0XG5cdFx0XHRiYXNlRGl2LmFwcGVuZENoaWxkKGltZyk7XG5cblx0XHRcdGlmKGtlZXBQbGFjZWhvbGRlcikge1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKGl0ZW0gJiYgaXRlbS5sb2FkZWQgJiYgaXRlbS5wbGFjZWhvbGRlcikge1xuXHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXHRcdFx0XHRcdFx0aXRlbS5wbGFjZWhvbGRlciA9IG51bGw7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCA1MDApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0XG5cblxuXHRfcHJlbG9hZEltYWdlID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdGl0ZW0ubG9hZGluZyA9IHRydWU7XG5cdFx0aXRlbS5sb2FkZWQgPSBmYWxzZTtcblx0XHR2YXIgaW1nID0gaXRlbS5pbWcgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2ltZycsICdpbWcnKTtcblx0XHR2YXIgb25Db21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aXRlbS5sb2FkaW5nID0gZmFsc2U7XG5cdFx0XHRpdGVtLmxvYWRlZCA9IHRydWU7XG5cblx0XHRcdGlmKGl0ZW0ubG9hZENvbXBsZXRlKSB7XG5cdFx0XHRcdGl0ZW0ubG9hZENvbXBsZXRlKGl0ZW0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aXRlbS5pbWcgPSBudWxsOyAvLyBubyBuZWVkIHRvIHN0b3JlIGltYWdlIG9iamVjdFxuXHRcdFx0fVxuXHRcdFx0aW1nLm9ubG9hZCA9IGltZy5vbmVycm9yID0gbnVsbDtcblx0XHRcdGltZyA9IG51bGw7XG5cdFx0fTtcblx0XHRpbWcub25sb2FkID0gb25Db21wbGV0ZTtcblx0XHRpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aXRlbS5sb2FkRXJyb3IgPSB0cnVlO1xuXHRcdFx0b25Db21wbGV0ZSgpO1xuXHRcdH07XHRcdFxuXG5cdFx0aW1nLnNyYyA9IGl0ZW0uc3JjOy8vICsgJz9hPScgKyBNYXRoLnJhbmRvbSgpO1xuXG5cdFx0cmV0dXJuIGltZztcblx0fSxcblx0X2NoZWNrRm9yRXJyb3IgPSBmdW5jdGlvbihpdGVtLCBjbGVhblVwKSB7XG5cdFx0aWYoaXRlbS5zcmMgJiYgaXRlbS5sb2FkRXJyb3IgJiYgaXRlbS5jb250YWluZXIpIHtcblxuXHRcdFx0aWYoY2xlYW5VcCkge1xuXHRcdFx0XHRpdGVtLmNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcblx0XHRcdH1cblxuXHRcdFx0aXRlbS5jb250YWluZXIuaW5uZXJIVE1MID0gX29wdGlvbnMuZXJyb3JNc2cucmVwbGFjZSgnJXVybCUnLCAgaXRlbS5zcmMgKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XG5cdFx0fVxuXHR9LFxuXHRfc2V0SW1hZ2VTaXplID0gZnVuY3Rpb24oaXRlbSwgaW1nLCBtYXhSZXMpIHtcblx0XHRpZighaXRlbS5zcmMpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZighaW1nKSB7XG5cdFx0XHRpbWcgPSBpdGVtLmNvbnRhaW5lci5sYXN0Q2hpbGQ7XG5cdFx0fVxuXG5cdFx0dmFyIHcgPSBtYXhSZXMgPyBpdGVtLncgOiBNYXRoLnJvdW5kKGl0ZW0udyAqIGl0ZW0uZml0UmF0aW8pLFxuXHRcdFx0aCA9IG1heFJlcyA/IGl0ZW0uaCA6IE1hdGgucm91bmQoaXRlbS5oICogaXRlbS5maXRSYXRpbyk7XG5cdFx0XG5cdFx0aWYoaXRlbS5wbGFjZWhvbGRlciAmJiAhaXRlbS5sb2FkZWQpIHtcblx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUud2lkdGggPSB3ICsgJ3B4Jztcblx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUuaGVpZ2h0ID0gaCArICdweCc7XG5cdFx0fVxuXG5cdFx0aW1nLnN0eWxlLndpZHRoID0gdyArICdweCc7XG5cdFx0aW1nLnN0eWxlLmhlaWdodCA9IGggKyAncHgnO1xuXHR9LFxuXHRfYXBwZW5kSW1hZ2VzUG9vbCA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0aWYoX2ltYWdlc1RvQXBwZW5kUG9vbC5sZW5ndGgpIHtcblx0XHRcdHZhciBwb29sSXRlbTtcblxuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IF9pbWFnZXNUb0FwcGVuZFBvb2wubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0cG9vbEl0ZW0gPSBfaW1hZ2VzVG9BcHBlbmRQb29sW2ldO1xuXHRcdFx0XHRpZiggcG9vbEl0ZW0uaG9sZGVyLmluZGV4ID09PSBwb29sSXRlbS5pbmRleCApIHtcblx0XHRcdFx0XHRfYXBwZW5kSW1hZ2UocG9vbEl0ZW0uaW5kZXgsIHBvb2xJdGVtLml0ZW0sIHBvb2xJdGVtLmJhc2VEaXYsIHBvb2xJdGVtLmltZywgZmFsc2UsIHBvb2xJdGVtLmNsZWFyUGxhY2Vob2xkZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRfaW1hZ2VzVG9BcHBlbmRQb29sID0gW107XG5cdFx0fVxuXHR9O1xuXHRcblxuXG5fcmVnaXN0ZXJNb2R1bGUoJ0NvbnRyb2xsZXInLCB7XG5cblx0cHVibGljTWV0aG9kczoge1xuXG5cdFx0bGF6eUxvYWRJdGVtOiBmdW5jdGlvbihpbmRleCkge1xuXHRcdFx0aW5kZXggPSBfZ2V0TG9vcGVkSWQoaW5kZXgpO1xuXHRcdFx0dmFyIGl0ZW0gPSBfZ2V0SXRlbUF0KGluZGV4KTtcblxuXHRcdFx0aWYoIWl0ZW0gfHwgKChpdGVtLmxvYWRlZCB8fCBpdGVtLmxvYWRpbmcpICYmICFfaXRlbXNOZWVkVXBkYXRlKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9zaG91dCgnZ2V0dGluZ0RhdGEnLCBpbmRleCwgaXRlbSk7XG5cblx0XHRcdGlmICghaXRlbS5zcmMpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRfcHJlbG9hZEltYWdlKGl0ZW0pO1xuXHRcdH0sXG5cdFx0aW5pdENvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZnJhbWV3b3JrLmV4dGVuZChfb3B0aW9ucywgX2NvbnRyb2xsZXJEZWZhdWx0T3B0aW9ucywgdHJ1ZSk7XG5cdFx0XHRzZWxmLml0ZW1zID0gX2l0ZW1zID0gaXRlbXM7XG5cdFx0XHRfZ2V0SXRlbUF0ID0gc2VsZi5nZXRJdGVtQXQ7XG5cdFx0XHRfZ2V0TnVtSXRlbXMgPSBfb3B0aW9ucy5nZXROdW1JdGVtc0ZuOyAvL3NlbGYuZ2V0TnVtSXRlbXM7XG5cblxuXG5cdFx0XHRfaW5pdGlhbElzTG9vcCA9IF9vcHRpb25zLmxvb3A7XG5cdFx0XHRpZihfZ2V0TnVtSXRlbXMoKSA8IDMpIHtcblx0XHRcdFx0X29wdGlvbnMubG9vcCA9IGZhbHNlOyAvLyBkaXNhYmxlIGxvb3AgaWYgbGVzcyB0aGVuIDMgaXRlbXNcblx0XHRcdH1cblxuXHRcdFx0X2xpc3RlbignYmVmb3JlQ2hhbmdlJywgZnVuY3Rpb24oZGlmZikge1xuXG5cdFx0XHRcdHZhciBwID0gX29wdGlvbnMucHJlbG9hZCxcblx0XHRcdFx0XHRpc05leHQgPSBkaWZmID09PSBudWxsID8gdHJ1ZSA6IChkaWZmID49IDApLFxuXHRcdFx0XHRcdHByZWxvYWRCZWZvcmUgPSBNYXRoLm1pbihwWzBdLCBfZ2V0TnVtSXRlbXMoKSApLFxuXHRcdFx0XHRcdHByZWxvYWRBZnRlciA9IE1hdGgubWluKHBbMV0sIF9nZXROdW1JdGVtcygpICksXG5cdFx0XHRcdFx0aTtcblxuXG5cdFx0XHRcdGZvcihpID0gMTsgaSA8PSAoaXNOZXh0ID8gcHJlbG9hZEFmdGVyIDogcHJlbG9hZEJlZm9yZSk7IGkrKykge1xuXHRcdFx0XHRcdHNlbGYubGF6eUxvYWRJdGVtKF9jdXJyZW50SXRlbUluZGV4K2kpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGZvcihpID0gMTsgaSA8PSAoaXNOZXh0ID8gcHJlbG9hZEJlZm9yZSA6IHByZWxvYWRBZnRlcik7IGkrKykge1xuXHRcdFx0XHRcdHNlbGYubGF6eUxvYWRJdGVtKF9jdXJyZW50SXRlbUluZGV4LWkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0X2xpc3RlbignaW5pdGlhbExheW91dCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZWxmLmN1cnJJdGVtLmluaXRpYWxMYXlvdXQgPSBfb3B0aW9ucy5nZXRUaHVtYkJvdW5kc0ZuICYmIF9vcHRpb25zLmdldFRodW1iQm91bmRzRm4oX2N1cnJlbnRJdGVtSW5kZXgpO1xuXHRcdFx0fSk7XG5cblx0XHRcdF9saXN0ZW4oJ21haW5TY3JvbGxBbmltQ29tcGxldGUnLCBfYXBwZW5kSW1hZ2VzUG9vbCk7XG5cdFx0XHRfbGlzdGVuKCdpbml0aWFsWm9vbUluRW5kJywgX2FwcGVuZEltYWdlc1Bvb2wpO1xuXG5cblxuXHRcdFx0X2xpc3RlbignZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR2YXIgaXRlbTtcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IF9pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGl0ZW0gPSBfaXRlbXNbaV07XG5cdFx0XHRcdFx0Ly8gcmVtb3ZlIHJlZmVyZW5jZSB0byBET00gZWxlbWVudHMsIGZvciBHQ1xuXHRcdFx0XHRcdGlmKGl0ZW0uY29udGFpbmVyKSB7XG5cdFx0XHRcdFx0XHRpdGVtLmNvbnRhaW5lciA9IG51bGw7IFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZihpdGVtLnBsYWNlaG9sZGVyKSB7XG5cdFx0XHRcdFx0XHRpdGVtLnBsYWNlaG9sZGVyID0gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoaXRlbS5pbWcpIHtcblx0XHRcdFx0XHRcdGl0ZW0uaW1nID0gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoaXRlbS5wcmVsb2FkZXIpIHtcblx0XHRcdFx0XHRcdGl0ZW0ucHJlbG9hZGVyID0gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoaXRlbS5sb2FkRXJyb3IpIHtcblx0XHRcdFx0XHRcdGl0ZW0ubG9hZGVkID0gaXRlbS5sb2FkRXJyb3IgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0X2ltYWdlc1RvQXBwZW5kUG9vbCA9IG51bGw7XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cblx0XHRnZXRJdGVtQXQ6IGZ1bmN0aW9uKGluZGV4KSB7XG5cdFx0XHRpZiAoaW5kZXggPj0gMCkge1xuXHRcdFx0XHRyZXR1cm4gX2l0ZW1zW2luZGV4XSAhPT0gdW5kZWZpbmVkID8gX2l0ZW1zW2luZGV4XSA6IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sXG5cblx0XHRhbGxvd1Byb2dyZXNzaXZlSW1nOiBmdW5jdGlvbigpIHtcblx0XHRcdC8vIDEuIFByb2dyZXNzaXZlIGltYWdlIGxvYWRpbmcgaXNuJ3Qgd29ya2luZyBvbiB3ZWJraXQvYmxpbmsgXG5cdFx0XHQvLyAgICB3aGVuIGh3LWFjY2VsZXJhdGlvbiAoZS5nLiB0cmFuc2xhdGVaKSBpcyBhcHBsaWVkIHRvIElNRyBlbGVtZW50LlxuXHRcdFx0Ly8gICAgVGhhdCdzIHdoeSBpbiBQaG90b1N3aXBlIHBhcmVudCBlbGVtZW50IGdldHMgem9vbSB0cmFuc2Zvcm0sIG5vdCBpbWFnZSBpdHNlbGYuXG5cdFx0XHQvLyAgICBcblx0XHRcdC8vIDIuIFByb2dyZXNzaXZlIGltYWdlIGxvYWRpbmcgc29tZXRpbWVzIGJsaW5rcyBpbiB3ZWJraXQvYmxpbmsgd2hlbiBhcHBseWluZyBhbmltYXRpb24gdG8gcGFyZW50IGVsZW1lbnQuXG5cdFx0XHQvLyAgICBUaGF0J3Mgd2h5IGl0J3MgZGlzYWJsZWQgb24gdG91Y2ggZGV2aWNlcyAobWFpbmx5IGJlY2F1c2Ugb2Ygc3dpcGUgdHJhbnNpdGlvbilcblx0XHRcdC8vICAgIFxuXHRcdFx0Ly8gMy4gUHJvZ3Jlc3NpdmUgaW1hZ2UgbG9hZGluZyBzb21ldGltZXMgZG9lc24ndCB3b3JrIGluIElFICh1cCB0byAxMSkuXG5cblx0XHRcdC8vIERvbid0IGFsbG93IHByb2dyZXNzaXZlIGxvYWRpbmcgb24gbm9uLWxhcmdlIHRvdWNoIGRldmljZXNcblx0XHRcdHJldHVybiBfb3B0aW9ucy5mb3JjZVByb2dyZXNzaXZlTG9hZGluZyB8fCAhX2xpa2VseVRvdWNoRGV2aWNlIHx8IF9vcHRpb25zLm1vdXNlVXNlZCB8fCBzY3JlZW4ud2lkdGggPiAxMjAwOyBcblx0XHRcdC8vIDEyMDAgLSB0byBlbGltaW5hdGUgdG91Y2ggZGV2aWNlcyB3aXRoIGxhcmdlIHNjcmVlbiAobGlrZSBDaHJvbWVib29rIFBpeGVsKVxuXHRcdH0sXG5cblx0XHRzZXRDb250ZW50OiBmdW5jdGlvbihob2xkZXIsIGluZGV4KSB7XG5cblx0XHRcdGlmKF9vcHRpb25zLmxvb3ApIHtcblx0XHRcdFx0aW5kZXggPSBfZ2V0TG9vcGVkSWQoaW5kZXgpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgcHJldkl0ZW0gPSBzZWxmLmdldEl0ZW1BdChob2xkZXIuaW5kZXgpO1xuXHRcdFx0aWYocHJldkl0ZW0pIHtcblx0XHRcdFx0cHJldkl0ZW0uY29udGFpbmVyID0gbnVsbDtcblx0XHRcdH1cblx0XG5cdFx0XHR2YXIgaXRlbSA9IHNlbGYuZ2V0SXRlbUF0KGluZGV4KSxcblx0XHRcdFx0aW1nO1xuXHRcdFx0XG5cdFx0XHRpZighaXRlbSkge1xuXHRcdFx0XHRob2xkZXIuZWwuaW5uZXJIVE1MID0gJyc7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly8gYWxsb3cgdG8gb3ZlcnJpZGUgZGF0YVxuXHRcdFx0X3Nob3V0KCdnZXR0aW5nRGF0YScsIGluZGV4LCBpdGVtKTtcblxuXHRcdFx0aG9sZGVyLmluZGV4ID0gaW5kZXg7XG5cdFx0XHRob2xkZXIuaXRlbSA9IGl0ZW07XG5cblx0XHRcdC8vIGJhc2UgY29udGFpbmVyIERJViBpcyBjcmVhdGVkIG9ubHkgb25jZSBmb3IgZWFjaCBvZiAzIGhvbGRlcnNcblx0XHRcdHZhciBiYXNlRGl2ID0gaXRlbS5jb250YWluZXIgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX3pvb20td3JhcCcpOyBcblxuXHRcdFx0XG5cblx0XHRcdGlmKCFpdGVtLnNyYyAmJiBpdGVtLmh0bWwpIHtcblx0XHRcdFx0aWYoaXRlbS5odG1sLnRhZ05hbWUpIHtcblx0XHRcdFx0XHRiYXNlRGl2LmFwcGVuZENoaWxkKGl0ZW0uaHRtbCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YmFzZURpdi5pbm5lckhUTUwgPSBpdGVtLmh0bWw7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0X2NoZWNrRm9yRXJyb3IoaXRlbSk7XG5cblx0XHRcdF9jYWxjdWxhdGVJdGVtU2l6ZShpdGVtLCBfdmlld3BvcnRTaXplKTtcblx0XHRcdFxuXHRcdFx0aWYoaXRlbS5zcmMgJiYgIWl0ZW0ubG9hZEVycm9yICYmICFpdGVtLmxvYWRlZCkge1xuXG5cdFx0XHRcdGl0ZW0ubG9hZENvbXBsZXRlID0gZnVuY3Rpb24oaXRlbSkge1xuXG5cdFx0XHRcdFx0Ly8gZ2FsbGVyeSBjbG9zZWQgYmVmb3JlIGltYWdlIGZpbmlzaGVkIGxvYWRpbmdcblx0XHRcdFx0XHRpZighX2lzT3Blbikge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIGNoZWNrIGlmIGhvbGRlciBoYXNuJ3QgY2hhbmdlZCB3aGlsZSBpbWFnZSB3YXMgbG9hZGluZ1xuXHRcdFx0XHRcdGlmKGhvbGRlciAmJiBob2xkZXIuaW5kZXggPT09IGluZGV4ICkge1xuXHRcdFx0XHRcdFx0aWYoIF9jaGVja0ZvckVycm9yKGl0ZW0sIHRydWUpICkge1xuXHRcdFx0XHRcdFx0XHRpdGVtLmxvYWRDb21wbGV0ZSA9IGl0ZW0uaW1nID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0X2NhbGN1bGF0ZUl0ZW1TaXplKGl0ZW0sIF92aWV3cG9ydFNpemUpO1xuXHRcdFx0XHRcdFx0XHRfYXBwbHlab29tUGFuVG9JdGVtKGl0ZW0pO1xuXG5cdFx0XHRcdFx0XHRcdGlmKGhvbGRlci5pbmRleCA9PT0gX2N1cnJlbnRJdGVtSW5kZXgpIHtcblx0XHRcdFx0XHRcdFx0XHQvLyByZWNhbGN1bGF0ZSBkaW1lbnNpb25zXG5cdFx0XHRcdFx0XHRcdFx0c2VsZi51cGRhdGVDdXJyWm9vbUl0ZW0oKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiggIWl0ZW0uaW1hZ2VBcHBlbmRlZCApIHtcblx0XHRcdFx0XHRcdFx0aWYoX2ZlYXR1cmVzLnRyYW5zZm9ybSAmJiAoX21haW5TY3JvbGxBbmltYXRpbmcgfHwgX2luaXRpYWxab29tUnVubmluZykgKSB7XG5cdFx0XHRcdFx0XHRcdFx0X2ltYWdlc1RvQXBwZW5kUG9vbC5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdGl0ZW06aXRlbSxcblx0XHRcdFx0XHRcdFx0XHRcdGJhc2VEaXY6YmFzZURpdixcblx0XHRcdFx0XHRcdFx0XHRcdGltZzppdGVtLmltZyxcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OmluZGV4LFxuXHRcdFx0XHRcdFx0XHRcdFx0aG9sZGVyOmhvbGRlcixcblx0XHRcdFx0XHRcdFx0XHRcdGNsZWFyUGxhY2Vob2xkZXI6dHJ1ZVxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdF9hcHBlbmRJbWFnZShpbmRleCwgaXRlbSwgYmFzZURpdiwgaXRlbS5pbWcsIF9tYWluU2Nyb2xsQW5pbWF0aW5nIHx8IF9pbml0aWFsWm9vbVJ1bm5pbmcsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvLyByZW1vdmUgcHJlbG9hZGVyICYgbWluaS1pbWdcblx0XHRcdFx0XHRcdFx0aWYoIV9pbml0aWFsWm9vbVJ1bm5pbmcgJiYgaXRlbS5wbGFjZWhvbGRlcikge1xuXHRcdFx0XHRcdFx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblx0XHRcdFx0XHRcdFx0XHRpdGVtLnBsYWNlaG9sZGVyID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGl0ZW0ubG9hZENvbXBsZXRlID0gbnVsbDtcblx0XHRcdFx0XHRpdGVtLmltZyA9IG51bGw7IC8vIG5vIG5lZWQgdG8gc3RvcmUgaW1hZ2UgZWxlbWVudCBhZnRlciBpdCdzIGFkZGVkXG5cblx0XHRcdFx0XHRfc2hvdXQoJ2ltYWdlTG9hZENvbXBsZXRlJywgaW5kZXgsIGl0ZW0pO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGlmKGZyYW1ld29yay5mZWF0dXJlcy50cmFuc2Zvcm0pIHtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgcGxhY2Vob2xkZXJDbGFzc05hbWUgPSAncHN3cF9faW1nIHBzd3BfX2ltZy0tcGxhY2Vob2xkZXInOyBcblx0XHRcdFx0XHRwbGFjZWhvbGRlckNsYXNzTmFtZSArPSAoaXRlbS5tc3JjID8gJycgOiAnIHBzd3BfX2ltZy0tcGxhY2Vob2xkZXItLWJsYW5rJyk7XG5cblx0XHRcdFx0XHR2YXIgcGxhY2Vob2xkZXIgPSBmcmFtZXdvcmsuY3JlYXRlRWwocGxhY2Vob2xkZXJDbGFzc05hbWUsIGl0ZW0ubXNyYyA/ICdpbWcnIDogJycpO1xuXHRcdFx0XHRcdGlmKGl0ZW0ubXNyYykge1xuXHRcdFx0XHRcdFx0cGxhY2Vob2xkZXIuc3JjID0gaXRlbS5tc3JjO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRfc2V0SW1hZ2VTaXplKGl0ZW0sIHBsYWNlaG9sZGVyKTtcblxuXHRcdFx0XHRcdGJhc2VEaXYuYXBwZW5kQ2hpbGQocGxhY2Vob2xkZXIpO1xuXHRcdFx0XHRcdGl0ZW0ucGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcjtcblxuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXG5cdFx0XHRcdFxuXG5cdFx0XHRcdGlmKCFpdGVtLmxvYWRpbmcpIHtcblx0XHRcdFx0XHRfcHJlbG9hZEltYWdlKGl0ZW0pO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0XHRpZiggc2VsZi5hbGxvd1Byb2dyZXNzaXZlSW1nKCkgKSB7XG5cdFx0XHRcdFx0Ly8ganVzdCBhcHBlbmQgaW1hZ2Vcblx0XHRcdFx0XHRpZighX2luaXRpYWxDb250ZW50U2V0ICYmIF9mZWF0dXJlcy50cmFuc2Zvcm0pIHtcblx0XHRcdFx0XHRcdF9pbWFnZXNUb0FwcGVuZFBvb2wucHVzaCh7XG5cdFx0XHRcdFx0XHRcdGl0ZW06aXRlbSwgXG5cdFx0XHRcdFx0XHRcdGJhc2VEaXY6YmFzZURpdiwgXG5cdFx0XHRcdFx0XHRcdGltZzppdGVtLmltZywgXG5cdFx0XHRcdFx0XHRcdGluZGV4OmluZGV4LCBcblx0XHRcdFx0XHRcdFx0aG9sZGVyOmhvbGRlclxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdF9hcHBlbmRJbWFnZShpbmRleCwgaXRlbSwgYmFzZURpdiwgaXRlbS5pbWcsIHRydWUsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdH0gZWxzZSBpZihpdGVtLnNyYyAmJiAhaXRlbS5sb2FkRXJyb3IpIHtcblx0XHRcdFx0Ly8gaW1hZ2Ugb2JqZWN0IGlzIGNyZWF0ZWQgZXZlcnkgdGltZSwgZHVlIHRvIGJ1Z3Mgb2YgaW1hZ2UgbG9hZGluZyAmIGRlbGF5IHdoZW4gc3dpdGNoaW5nIGltYWdlc1xuXHRcdFx0XHRpbWcgPSBmcmFtZXdvcmsuY3JlYXRlRWwoJ3Bzd3BfX2ltZycsICdpbWcnKTtcblx0XHRcdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAxO1xuXHRcdFx0XHRpbWcuc3JjID0gaXRlbS5zcmM7XG5cdFx0XHRcdF9zZXRJbWFnZVNpemUoaXRlbSwgaW1nKTtcblx0XHRcdFx0X2FwcGVuZEltYWdlKGluZGV4LCBpdGVtLCBiYXNlRGl2LCBpbWcsIHRydWUpO1xuXHRcdFx0fVxuXHRcdFx0XG5cblx0XHRcdGlmKCFfaW5pdGlhbENvbnRlbnRTZXQgJiYgaW5kZXggPT09IF9jdXJyZW50SXRlbUluZGV4KSB7XG5cdFx0XHRcdF9jdXJyWm9vbUVsZW1lbnRTdHlsZSA9IGJhc2VEaXYuc3R5bGU7XG5cdFx0XHRcdF9zaG93T3JIaWRlKGl0ZW0sIChpbWcgfHxpdGVtLmltZykgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdF9hcHBseVpvb21QYW5Ub0l0ZW0oaXRlbSk7XG5cdFx0XHR9XG5cblx0XHRcdGhvbGRlci5lbC5pbm5lckhUTUwgPSAnJztcblx0XHRcdGhvbGRlci5lbC5hcHBlbmRDaGlsZChiYXNlRGl2KTtcblx0XHR9LFxuXG5cdFx0Y2xlYW5TbGlkZTogZnVuY3Rpb24oIGl0ZW0gKSB7XG5cdFx0XHRpZihpdGVtLmltZyApIHtcblx0XHRcdFx0aXRlbS5pbWcub25sb2FkID0gaXRlbS5pbWcub25lcnJvciA9IG51bGw7XG5cdFx0XHR9XG5cdFx0XHRpdGVtLmxvYWRlZCA9IGl0ZW0ubG9hZGluZyA9IGl0ZW0uaW1nID0gaXRlbS5pbWFnZUFwcGVuZGVkID0gZmFsc2U7XG5cdFx0fVxuXG5cdH1cbn0pO1xuXG4vKj4+aXRlbXMtY29udHJvbGxlciovXG5cbi8qPj50YXAqL1xuLyoqXG4gKiB0YXAuanM6XG4gKlxuICogRGlzcGxhdGNoZXMgdGFwIGFuZCBkb3VibGUtdGFwIGV2ZW50cy5cbiAqIFxuICovXG5cbnZhciB0YXBUaW1lcixcblx0dGFwUmVsZWFzZVBvaW50ID0ge30sXG5cdF9kaXNwYXRjaFRhcEV2ZW50ID0gZnVuY3Rpb24ob3JpZ0V2ZW50LCByZWxlYXNlUG9pbnQsIHBvaW50ZXJUeXBlKSB7XHRcdFxuXHRcdHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoICdDdXN0b21FdmVudCcgKSxcblx0XHRcdGVEZXRhaWwgPSB7XG5cdFx0XHRcdG9yaWdFdmVudDpvcmlnRXZlbnQsIFxuXHRcdFx0XHR0YXJnZXQ6b3JpZ0V2ZW50LnRhcmdldCwgXG5cdFx0XHRcdHJlbGVhc2VQb2ludDogcmVsZWFzZVBvaW50LCBcblx0XHRcdFx0cG9pbnRlclR5cGU6cG9pbnRlclR5cGUgfHwgJ3RvdWNoJ1xuXHRcdFx0fTtcblxuXHRcdGUuaW5pdEN1c3RvbUV2ZW50KCAncHN3cFRhcCcsIHRydWUsIHRydWUsIGVEZXRhaWwgKTtcblx0XHRvcmlnRXZlbnQudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZSk7XG5cdH07XG5cbl9yZWdpc3Rlck1vZHVsZSgnVGFwJywge1xuXHRwdWJsaWNNZXRob2RzOiB7XG5cdFx0aW5pdFRhcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRfbGlzdGVuKCdmaXJzdFRvdWNoU3RhcnQnLCBzZWxmLm9uVGFwU3RhcnQpO1xuXHRcdFx0X2xpc3RlbigndG91Y2hSZWxlYXNlJywgc2VsZi5vblRhcFJlbGVhc2UpO1xuXHRcdFx0X2xpc3RlbignZGVzdHJveScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0YXBSZWxlYXNlUG9pbnQgPSB7fTtcblx0XHRcdFx0dGFwVGltZXIgPSBudWxsO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRvblRhcFN0YXJ0OiBmdW5jdGlvbih0b3VjaExpc3QpIHtcblx0XHRcdGlmKHRvdWNoTGlzdC5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdGNsZWFyVGltZW91dCh0YXBUaW1lcik7XG5cdFx0XHRcdHRhcFRpbWVyID0gbnVsbDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdG9uVGFwUmVsZWFzZTogZnVuY3Rpb24oZSwgcmVsZWFzZVBvaW50KSB7XG5cdFx0XHRpZighcmVsZWFzZVBvaW50KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoIV9tb3ZlZCAmJiAhX2lzTXVsdGl0b3VjaCAmJiAhX251bUFuaW1hdGlvbnMpIHtcblx0XHRcdFx0dmFyIHAwID0gcmVsZWFzZVBvaW50O1xuXHRcdFx0XHRpZih0YXBUaW1lcikge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0YXBUaW1lcik7XG5cdFx0XHRcdFx0dGFwVGltZXIgPSBudWxsO1xuXG5cdFx0XHRcdFx0Ly8gQ2hlY2sgaWYgdGFwZWQgb24gdGhlIHNhbWUgcGxhY2Vcblx0XHRcdFx0XHRpZiAoIF9pc05lYXJieVBvaW50cyhwMCwgdGFwUmVsZWFzZVBvaW50KSApIHtcblx0XHRcdFx0XHRcdF9zaG91dCgnZG91YmxlVGFwJywgcDApO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKHJlbGVhc2VQb2ludC50eXBlID09PSAnbW91c2UnKSB7XG5cdFx0XHRcdFx0X2Rpc3BhdGNoVGFwRXZlbnQoZSwgcmVsZWFzZVBvaW50LCAnbW91c2UnKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgY2xpY2tlZFRhZ05hbWUgPSBlLnRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG5cdFx0XHRcdC8vIGF2b2lkIGRvdWJsZSB0YXAgZGVsYXkgb24gYnV0dG9ucyBhbmQgZWxlbWVudHMgdGhhdCBoYXZlIGNsYXNzIHBzd3BfX3NpbmdsZS10YXBcblx0XHRcdFx0aWYoY2xpY2tlZFRhZ05hbWUgPT09ICdCVVRUT04nIHx8IGZyYW1ld29yay5oYXNDbGFzcyhlLnRhcmdldCwgJ3Bzd3BfX3NpbmdsZS10YXAnKSApIHtcblx0XHRcdFx0XHRfZGlzcGF0Y2hUYXBFdmVudChlLCByZWxlYXNlUG9pbnQpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF9lcXVhbGl6ZVBvaW50cyh0YXBSZWxlYXNlUG9pbnQsIHAwKTtcblxuXHRcdFx0XHR0YXBUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0X2Rpc3BhdGNoVGFwRXZlbnQoZSwgcmVsZWFzZVBvaW50KTtcblx0XHRcdFx0XHR0YXBUaW1lciA9IG51bGw7XG5cdFx0XHRcdH0sIDMwMCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTtcblxuLyo+PnRhcCovXG5cbi8qPj5kZXNrdG9wLXpvb20qL1xuLyoqXG4gKlxuICogZGVza3RvcC16b29tLmpzOlxuICpcbiAqIC0gQmluZHMgbW91c2V3aGVlbCBldmVudCBmb3IgcGFuaW5nIHpvb21lZCBpbWFnZS5cbiAqIC0gTWFuYWdlcyBcImRyYWdnaW5nXCIsIFwiem9vbWVkLWluXCIsIFwiem9vbS1vdXRcIiBjbGFzc2VzLlxuICogICAod2hpY2ggYXJlIHVzZWQgZm9yIGN1cnNvcnMgYW5kIHpvb20gaWNvbilcbiAqIC0gQWRkcyB0b2dnbGVEZXNrdG9wWm9vbSBmdW5jdGlvbi5cbiAqIFxuICovXG5cbnZhciBfd2hlZWxEZWx0YTtcblx0XG5fcmVnaXN0ZXJNb2R1bGUoJ0Rlc2t0b3Bab29tJywge1xuXG5cdHB1YmxpY01ldGhvZHM6IHtcblxuXHRcdGluaXREZXNrdG9wWm9vbTogZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmKF9vbGRJRSkge1xuXHRcdFx0XHQvLyBubyB6b29tIGZvciBvbGQgSUUgKDw9OClcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihfbGlrZWx5VG91Y2hEZXZpY2UpIHtcblx0XHRcdFx0Ly8gaWYgZGV0ZWN0ZWQgaGFyZHdhcmUgdG91Y2ggc3VwcG9ydCwgd2Ugd2FpdCB1bnRpbCBtb3VzZSBpcyB1c2VkLFxuXHRcdFx0XHQvLyBhbmQgb25seSB0aGVuIGFwcGx5IGRlc2t0b3Atem9vbSBmZWF0dXJlc1xuXHRcdFx0XHRfbGlzdGVuKCdtb3VzZVVzZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRzZWxmLnNldHVwRGVza3RvcFpvb20oKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZWxmLnNldHVwRGVza3RvcFpvb20odHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHR9LFxuXG5cdFx0c2V0dXBEZXNrdG9wWm9vbTogZnVuY3Rpb24ob25Jbml0KSB7XG5cblx0XHRcdF93aGVlbERlbHRhID0ge307XG5cblx0XHRcdHZhciBldmVudHMgPSAnd2hlZWwgbW91c2V3aGVlbCBET01Nb3VzZVNjcm9sbCc7XG5cdFx0XHRcblx0XHRcdF9saXN0ZW4oJ2JpbmRFdmVudHMnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZnJhbWV3b3JrLmJpbmQodGVtcGxhdGUsIGV2ZW50cywgIHNlbGYuaGFuZGxlTW91c2VXaGVlbCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0X2xpc3RlbigndW5iaW5kRXZlbnRzJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmKF93aGVlbERlbHRhKSB7XG5cdFx0XHRcdFx0ZnJhbWV3b3JrLnVuYmluZCh0ZW1wbGF0ZSwgZXZlbnRzLCBzZWxmLmhhbmRsZU1vdXNlV2hlZWwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0c2VsZi5tb3VzZVpvb21lZEluID0gZmFsc2U7XG5cblx0XHRcdHZhciBoYXNEcmFnZ2luZ0NsYXNzLFxuXHRcdFx0XHR1cGRhdGVab29tYWJsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKHNlbGYubW91c2Vab29tZWRJbikge1xuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKHRlbXBsYXRlLCAncHN3cC0tem9vbWVkLWluJyk7XG5cdFx0XHRcdFx0XHRzZWxmLm1vdXNlWm9vbWVkSW4gPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYoX2N1cnJab29tTGV2ZWwgPCAxKSB7XG5cdFx0XHRcdFx0XHRmcmFtZXdvcmsuYWRkQ2xhc3ModGVtcGxhdGUsICdwc3dwLS16b29tLWFsbG93ZWQnKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZnJhbWV3b3JrLnJlbW92ZUNsYXNzKHRlbXBsYXRlLCAncHN3cC0tem9vbS1hbGxvd2VkJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJlbW92ZURyYWdnaW5nQ2xhc3MoKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0cmVtb3ZlRHJhZ2dpbmdDbGFzcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmKGhhc0RyYWdnaW5nQ2xhc3MpIHtcblx0XHRcdFx0XHRcdGZyYW1ld29yay5yZW1vdmVDbGFzcyh0ZW1wbGF0ZSwgJ3Bzd3AtLWRyYWdnaW5nJyk7XG5cdFx0XHRcdFx0XHRoYXNEcmFnZ2luZ0NsYXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRfbGlzdGVuKCdyZXNpemUnICwgdXBkYXRlWm9vbWFibGUpO1xuXHRcdFx0X2xpc3RlbignYWZ0ZXJDaGFuZ2UnICwgdXBkYXRlWm9vbWFibGUpO1xuXHRcdFx0X2xpc3RlbigncG9pbnRlckRvd24nLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYoc2VsZi5tb3VzZVpvb21lZEluKSB7XG5cdFx0XHRcdFx0aGFzRHJhZ2dpbmdDbGFzcyA9IHRydWU7XG5cdFx0XHRcdFx0ZnJhbWV3b3JrLmFkZENsYXNzKHRlbXBsYXRlLCAncHN3cC0tZHJhZ2dpbmcnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRfbGlzdGVuKCdwb2ludGVyVXAnLCByZW1vdmVEcmFnZ2luZ0NsYXNzKTtcblxuXHRcdFx0aWYoIW9uSW5pdCkge1xuXHRcdFx0XHR1cGRhdGVab29tYWJsZSgpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fSxcblxuXHRcdGhhbmRsZU1vdXNlV2hlZWw6IGZ1bmN0aW9uKGUpIHtcblxuXHRcdFx0aWYoX2N1cnJab29tTGV2ZWwgPD0gc2VsZi5jdXJySXRlbS5maXRSYXRpbykge1xuXHRcdFx0XHRpZiggX29wdGlvbnMubW9kYWwgKSB7XG5cblx0XHRcdFx0XHRpZiAoIV9vcHRpb25zLmNsb3NlT25TY3JvbGwgfHwgX251bUFuaW1hdGlvbnMgfHwgX2lzRHJhZ2dpbmcpIHtcblx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYoX3RyYW5zZm9ybUtleSAmJiBNYXRoLmFicyhlLmRlbHRhWSkgPiAyKSB7XG5cdFx0XHRcdFx0XHQvLyBjbG9zZSBQaG90b1N3aXBlXG5cdFx0XHRcdFx0XHQvLyBpZiBicm93c2VyIHN1cHBvcnRzIHRyYW5zZm9ybXMgJiBzY3JvbGwgY2hhbmdlZCBlbm91Z2hcblx0XHRcdFx0XHRcdF9jbG9zZWRCeVNjcm9sbCA9IHRydWU7XG5cdFx0XHRcdFx0XHRzZWxmLmNsb3NlKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGFsbG93IGp1c3Qgb25lIGV2ZW50IHRvIGZpcmVcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHRcdC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy93aGVlbFxuXHRcdFx0X3doZWVsRGVsdGEueCA9IDA7XG5cblx0XHRcdGlmKCdkZWx0YVgnIGluIGUpIHtcblx0XHRcdFx0aWYoZS5kZWx0YU1vZGUgPT09IDEgLyogRE9NX0RFTFRBX0xJTkUgKi8pIHtcblx0XHRcdFx0XHQvLyAxOCAtIGF2ZXJhZ2UgbGluZSBoZWlnaHRcblx0XHRcdFx0XHRfd2hlZWxEZWx0YS54ID0gZS5kZWx0YVggKiAxODtcblx0XHRcdFx0XHRfd2hlZWxEZWx0YS55ID0gZS5kZWx0YVkgKiAxODtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRfd2hlZWxEZWx0YS54ID0gZS5kZWx0YVg7XG5cdFx0XHRcdFx0X3doZWVsRGVsdGEueSA9IGUuZGVsdGFZO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoJ3doZWVsRGVsdGEnIGluIGUpIHtcblx0XHRcdFx0aWYoZS53aGVlbERlbHRhWCkge1xuXHRcdFx0XHRcdF93aGVlbERlbHRhLnggPSAtMC4xNiAqIGUud2hlZWxEZWx0YVg7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoZS53aGVlbERlbHRhWSkge1xuXHRcdFx0XHRcdF93aGVlbERlbHRhLnkgPSAtMC4xNiAqIGUud2hlZWxEZWx0YVk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X3doZWVsRGVsdGEueSA9IC0wLjE2ICogZS53aGVlbERlbHRhO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYoJ2RldGFpbCcgaW4gZSkge1xuXHRcdFx0XHRfd2hlZWxEZWx0YS55ID0gZS5kZXRhaWw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdF9jYWxjdWxhdGVQYW5Cb3VuZHMoX2N1cnJab29tTGV2ZWwsIHRydWUpO1xuXG5cdFx0XHR2YXIgbmV3UGFuWCA9IF9wYW5PZmZzZXQueCAtIF93aGVlbERlbHRhLngsXG5cdFx0XHRcdG5ld1BhblkgPSBfcGFuT2Zmc2V0LnkgLSBfd2hlZWxEZWx0YS55O1xuXG5cdFx0XHQvLyBvbmx5IHByZXZlbnQgc2Nyb2xsaW5nIGluIG5vbm1vZGFsIG1vZGUgd2hlbiBub3QgYXQgZWRnZXNcblx0XHRcdGlmIChfb3B0aW9ucy5tb2RhbCB8fFxuXHRcdFx0XHQoXG5cdFx0XHRcdG5ld1BhblggPD0gX2N1cnJQYW5Cb3VuZHMubWluLnggJiYgbmV3UGFuWCA+PSBfY3VyclBhbkJvdW5kcy5tYXgueCAmJlxuXHRcdFx0XHRuZXdQYW5ZIDw9IF9jdXJyUGFuQm91bmRzLm1pbi55ICYmIG5ld1BhblkgPj0gX2N1cnJQYW5Cb3VuZHMubWF4Lnlcblx0XHRcdFx0KSApIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUT0RPOiB1c2UgckFGIGluc3RlYWQgb2YgbW91c2V3aGVlbD9cblx0XHRcdHNlbGYucGFuVG8obmV3UGFuWCwgbmV3UGFuWSk7XG5cdFx0fSxcblxuXHRcdHRvZ2dsZURlc2t0b3Bab29tOiBmdW5jdGlvbihjZW50ZXJQb2ludCkge1xuXHRcdFx0Y2VudGVyUG9pbnQgPSBjZW50ZXJQb2ludCB8fCB7eDpfdmlld3BvcnRTaXplLngvMiArIF9vZmZzZXQueCwgeTpfdmlld3BvcnRTaXplLnkvMiArIF9vZmZzZXQueSB9O1xuXG5cdFx0XHR2YXIgZG91YmxlVGFwWm9vbUxldmVsID0gX29wdGlvbnMuZ2V0RG91YmxlVGFwWm9vbSh0cnVlLCBzZWxmLmN1cnJJdGVtKTtcblx0XHRcdHZhciB6b29tT3V0ID0gX2N1cnJab29tTGV2ZWwgPT09IGRvdWJsZVRhcFpvb21MZXZlbDtcblx0XHRcdFxuXHRcdFx0c2VsZi5tb3VzZVpvb21lZEluID0gIXpvb21PdXQ7XG5cblx0XHRcdHNlbGYuem9vbVRvKHpvb21PdXQgPyBzZWxmLmN1cnJJdGVtLmluaXRpYWxab29tTGV2ZWwgOiBkb3VibGVUYXBab29tTGV2ZWwsIGNlbnRlclBvaW50LCAzMzMpO1xuXHRcdFx0ZnJhbWV3b3JrWyAoIXpvb21PdXQgPyAnYWRkJyA6ICdyZW1vdmUnKSArICdDbGFzcyddKHRlbXBsYXRlLCAncHN3cC0tem9vbWVkLWluJyk7XG5cdFx0fVxuXG5cdH1cbn0pO1xuXG5cbi8qPj5kZXNrdG9wLXpvb20qL1xuXG4vKj4+aGlzdG9yeSovXG4vKipcbiAqXG4gKiBoaXN0b3J5LmpzOlxuICpcbiAqIC0gQmFjayBidXR0b24gdG8gY2xvc2UgZ2FsbGVyeS5cbiAqIFxuICogLSBVbmlxdWUgVVJMIGZvciBlYWNoIHNsaWRlOiBleGFtcGxlLmNvbS8mcGlkPTEmZ2lkPTNcbiAqICAgKHdoZXJlIFBJRCBpcyBwaWN0dXJlIGluZGV4LCBhbmQgR0lEIGFuZCBnYWxsZXJ5IGluZGV4KVxuICogICBcbiAqIC0gU3dpdGNoIFVSTCB3aGVuIHNsaWRlcyBjaGFuZ2UuXG4gKiBcbiAqL1xuXG5cbnZhciBfaGlzdG9yeURlZmF1bHRPcHRpb25zID0ge1xuXHRoaXN0b3J5OiB0cnVlLFxuXHRnYWxsZXJ5VUlEOiAxXG59O1xuXG52YXIgX2hpc3RvcnlVcGRhdGVUaW1lb3V0LFxuXHRfaGFzaENoYW5nZVRpbWVvdXQsXG5cdF9oYXNoQW5pbUNoZWNrVGltZW91dCxcblx0X2hhc2hDaGFuZ2VkQnlTY3JpcHQsXG5cdF9oYXNoQ2hhbmdlZEJ5SGlzdG9yeSxcblx0X2hhc2hSZXNldGVkLFxuXHRfaW5pdGlhbEhhc2gsXG5cdF9oaXN0b3J5Q2hhbmdlZCxcblx0X2Nsb3NlZEZyb21VUkwsXG5cdF91cmxDaGFuZ2VkT25jZSxcblx0X3dpbmRvd0xvYyxcblxuXHRfc3VwcG9ydHNQdXNoU3RhdGUsXG5cblx0X2dldEhhc2ggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gX3dpbmRvd0xvYy5oYXNoLnN1YnN0cmluZygxKTtcblx0fSxcblx0X2NsZWFuSGlzdG9yeVRpbWVvdXRzID0gZnVuY3Rpb24oKSB7XG5cblx0XHRpZihfaGlzdG9yeVVwZGF0ZVRpbWVvdXQpIHtcblx0XHRcdGNsZWFyVGltZW91dChfaGlzdG9yeVVwZGF0ZVRpbWVvdXQpO1xuXHRcdH1cblxuXHRcdGlmKF9oYXNoQW5pbUNoZWNrVGltZW91dCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9oYXNoQW5pbUNoZWNrVGltZW91dCk7XG5cdFx0fVxuXHR9LFxuXG5cdC8vIHBpZCAtIFBpY3R1cmUgaW5kZXhcblx0Ly8gZ2lkIC0gR2FsbGVyeSBpbmRleFxuXHRfcGFyc2VJdGVtSW5kZXhGcm9tVVJMID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGhhc2ggPSBfZ2V0SGFzaCgpLFxuXHRcdFx0cGFyYW1zID0ge307XG5cblx0XHRpZihoYXNoLmxlbmd0aCA8IDUpIHsgLy8gcGlkPTFcblx0XHRcdHJldHVybiBwYXJhbXM7XG5cdFx0fVxuXG5cdFx0dmFyIGksIHZhcnMgPSBoYXNoLnNwbGl0KCcmJyk7XG5cdFx0Zm9yIChpID0gMDsgaSA8IHZhcnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKCF2YXJzW2ldKSB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHBhaXIgPSB2YXJzW2ldLnNwbGl0KCc9Jyk7XHRcblx0XHRcdGlmKHBhaXIubGVuZ3RoIDwgMikge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdHBhcmFtc1twYWlyWzBdXSA9IHBhaXJbMV07XG5cdFx0fVxuXHRcdGlmKF9vcHRpb25zLmdhbGxlcnlQSURzKSB7XG5cdFx0XHQvLyBkZXRlY3QgY3VzdG9tIHBpZCBpbiBoYXNoIGFuZCBzZWFyY2ggZm9yIGl0IGFtb25nIHRoZSBpdGVtcyBjb2xsZWN0aW9uXG5cdFx0XHR2YXIgc2VhcmNoZm9yID0gcGFyYW1zLnBpZDtcblx0XHRcdHBhcmFtcy5waWQgPSAwOyAvLyBpZiBjdXN0b20gcGlkIGNhbm5vdCBiZSBmb3VuZCwgZmFsbGJhY2sgdG8gdGhlIGZpcnN0IGl0ZW1cblx0XHRcdGZvcihpID0gMDsgaSA8IF9pdGVtcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZihfaXRlbXNbaV0ucGlkID09PSBzZWFyY2hmb3IpIHtcblx0XHRcdFx0XHRwYXJhbXMucGlkID0gaTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJhbXMucGlkID0gcGFyc2VJbnQocGFyYW1zLnBpZCwxMCktMTtcblx0XHR9XG5cdFx0aWYoIHBhcmFtcy5waWQgPCAwICkge1xuXHRcdFx0cGFyYW1zLnBpZCA9IDA7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJhbXM7XG5cdH0sXG5cdF91cGRhdGVIYXNoID0gZnVuY3Rpb24oKSB7XG5cblx0XHRpZihfaGFzaEFuaW1DaGVja1RpbWVvdXQpIHtcblx0XHRcdGNsZWFyVGltZW91dChfaGFzaEFuaW1DaGVja1RpbWVvdXQpO1xuXHRcdH1cblxuXG5cdFx0aWYoX251bUFuaW1hdGlvbnMgfHwgX2lzRHJhZ2dpbmcpIHtcblx0XHRcdC8vIGNoYW5naW5nIGJyb3dzZXIgVVJMIGZvcmNlcyBsYXlvdXQvcGFpbnQgaW4gc29tZSBicm93c2Vycywgd2hpY2ggY2F1c2VzIG5vdGljYWJsZSBsYWcgZHVyaW5nIGFuaW1hdGlvblxuXHRcdFx0Ly8gdGhhdCdzIHdoeSB3ZSB1cGRhdGUgaGFzaCBvbmx5IHdoZW4gbm8gYW5pbWF0aW9ucyBydW5uaW5nXG5cdFx0XHRfaGFzaEFuaW1DaGVja1RpbWVvdXQgPSBzZXRUaW1lb3V0KF91cGRhdGVIYXNoLCA1MDApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRcblx0XHRpZihfaGFzaENoYW5nZWRCeVNjcmlwdCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KF9oYXNoQ2hhbmdlVGltZW91dCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdF9oYXNoQ2hhbmdlZEJ5U2NyaXB0ID0gdHJ1ZTtcblx0XHR9XG5cblxuXHRcdHZhciBwaWQgPSAoX2N1cnJlbnRJdGVtSW5kZXggKyAxKTtcblx0XHR2YXIgaXRlbSA9IF9nZXRJdGVtQXQoIF9jdXJyZW50SXRlbUluZGV4ICk7XG5cdFx0aWYoaXRlbS5oYXNPd25Qcm9wZXJ0eSgncGlkJykpIHtcblx0XHRcdC8vIGNhcnJ5IGZvcndhcmQgYW55IGN1c3RvbSBwaWQgYXNzaWduZWQgdG8gdGhlIGl0ZW1cblx0XHRcdHBpZCA9IGl0ZW0ucGlkO1xuXHRcdH1cblx0XHR2YXIgbmV3SGFzaCA9IF9pbml0aWFsSGFzaCArICcmJyAgKyAgJ2dpZD0nICsgX29wdGlvbnMuZ2FsbGVyeVVJRCArICcmJyArICdwaWQ9JyArIHBpZDtcblxuXHRcdGlmKCFfaGlzdG9yeUNoYW5nZWQpIHtcblx0XHRcdGlmKF93aW5kb3dMb2MuaGFzaC5pbmRleE9mKG5ld0hhc2gpID09PSAtMSkge1xuXHRcdFx0XHRfdXJsQ2hhbmdlZE9uY2UgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0Ly8gZmlyc3QgdGltZSAtIGFkZCBuZXcgaGlzb3J5IHJlY29yZCwgdGhlbiBqdXN0IHJlcGxhY2Vcblx0XHR9XG5cblx0XHR2YXIgbmV3VVJMID0gX3dpbmRvd0xvYy5ocmVmLnNwbGl0KCcjJylbMF0gKyAnIycgKyAgbmV3SGFzaDtcblxuXHRcdGlmKCBfc3VwcG9ydHNQdXNoU3RhdGUgKSB7XG5cblx0XHRcdGlmKCcjJyArIG5ld0hhc2ggIT09IHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG5cdFx0XHRcdGhpc3RvcnlbX2hpc3RvcnlDaGFuZ2VkID8gJ3JlcGxhY2VTdGF0ZScgOiAncHVzaFN0YXRlJ10oJycsIGRvY3VtZW50LnRpdGxlLCBuZXdVUkwpO1xuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKF9oaXN0b3J5Q2hhbmdlZCkge1xuXHRcdFx0XHRfd2luZG93TG9jLnJlcGxhY2UoIG5ld1VSTCApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0X3dpbmRvd0xvYy5oYXNoID0gbmV3SGFzaDtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0XG5cblx0XHRfaGlzdG9yeUNoYW5nZWQgPSB0cnVlO1xuXHRcdF9oYXNoQ2hhbmdlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRfaGFzaENoYW5nZWRCeVNjcmlwdCA9IGZhbHNlO1xuXHRcdH0sIDYwKTtcblx0fTtcblxuXG5cblx0XG5cbl9yZWdpc3Rlck1vZHVsZSgnSGlzdG9yeScsIHtcblxuXHRcblxuXHRwdWJsaWNNZXRob2RzOiB7XG5cdFx0aW5pdEhpc3Rvcnk6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRmcmFtZXdvcmsuZXh0ZW5kKF9vcHRpb25zLCBfaGlzdG9yeURlZmF1bHRPcHRpb25zLCB0cnVlKTtcblxuXHRcdFx0aWYoICFfb3B0aW9ucy5oaXN0b3J5ICkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblxuXHRcdFx0X3dpbmRvd0xvYyA9IHdpbmRvdy5sb2NhdGlvbjtcblx0XHRcdF91cmxDaGFuZ2VkT25jZSA9IGZhbHNlO1xuXHRcdFx0X2Nsb3NlZEZyb21VUkwgPSBmYWxzZTtcblx0XHRcdF9oaXN0b3J5Q2hhbmdlZCA9IGZhbHNlO1xuXHRcdFx0X2luaXRpYWxIYXNoID0gX2dldEhhc2goKTtcblx0XHRcdF9zdXBwb3J0c1B1c2hTdGF0ZSA9ICgncHVzaFN0YXRlJyBpbiBoaXN0b3J5KTtcblxuXG5cdFx0XHRpZihfaW5pdGlhbEhhc2guaW5kZXhPZignZ2lkPScpID4gLTEpIHtcblx0XHRcdFx0X2luaXRpYWxIYXNoID0gX2luaXRpYWxIYXNoLnNwbGl0KCcmZ2lkPScpWzBdO1xuXHRcdFx0XHRfaW5pdGlhbEhhc2ggPSBfaW5pdGlhbEhhc2guc3BsaXQoJz9naWQ9JylbMF07XG5cdFx0XHR9XG5cdFx0XHRcblxuXHRcdFx0X2xpc3RlbignYWZ0ZXJDaGFuZ2UnLCBzZWxmLnVwZGF0ZVVSTCk7XG5cdFx0XHRfbGlzdGVuKCd1bmJpbmRFdmVudHMnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZnJhbWV3b3JrLnVuYmluZCh3aW5kb3csICdoYXNoY2hhbmdlJywgc2VsZi5vbkhhc2hDaGFuZ2UpO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dmFyIHJldHVyblRvT3JpZ2luYWwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0X2hhc2hSZXNldGVkID0gdHJ1ZTtcblx0XHRcdFx0aWYoIV9jbG9zZWRGcm9tVVJMKSB7XG5cblx0XHRcdFx0XHRpZihfdXJsQ2hhbmdlZE9uY2UpIHtcblx0XHRcdFx0XHRcdGhpc3RvcnkuYmFjaygpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRcdGlmKF9pbml0aWFsSGFzaCkge1xuXHRcdFx0XHRcdFx0XHRfd2luZG93TG9jLmhhc2ggPSBfaW5pdGlhbEhhc2g7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRpZiAoX3N1cHBvcnRzUHVzaFN0YXRlKSB7XG5cblx0XHRcdFx0XHRcdFx0XHQvLyByZW1vdmUgaGFzaCBmcm9tIHVybCB3aXRob3V0IHJlZnJlc2hpbmcgaXQgb3Igc2Nyb2xsaW5nIHRvIHRvcFxuXHRcdFx0XHRcdFx0XHRcdGhpc3RvcnkucHVzaFN0YXRlKCcnLCBkb2N1bWVudC50aXRsZSwgIF93aW5kb3dMb2MucGF0aG5hbWUgKyBfd2luZG93TG9jLnNlYXJjaCApO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdF93aW5kb3dMb2MuaGFzaCA9ICcnO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0X2NsZWFuSGlzdG9yeVRpbWVvdXRzKCk7XG5cdFx0XHR9O1xuXG5cblx0XHRcdF9saXN0ZW4oJ3VuYmluZEV2ZW50cycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZihfY2xvc2VkQnlTY3JvbGwpIHtcblx0XHRcdFx0XHQvLyBpZiBQaG90b1N3aXBlIGlzIGNsb3NlZCBieSBzY3JvbGwsIHdlIGdvIFwiYmFja1wiIGJlZm9yZSB0aGUgY2xvc2luZyBhbmltYXRpb24gc3RhcnRzXG5cdFx0XHRcdFx0Ly8gdGhpcyBpcyBkb25lIHRvIGtlZXAgdGhlIHNjcm9sbCBwb3NpdGlvblxuXHRcdFx0XHRcdHJldHVyblRvT3JpZ2luYWwoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRfbGlzdGVuKCdkZXN0cm95JywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmKCFfaGFzaFJlc2V0ZWQpIHtcblx0XHRcdFx0XHRyZXR1cm5Ub09yaWdpbmFsKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0X2xpc3RlbignZmlyc3RVcGRhdGUnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0X2N1cnJlbnRJdGVtSW5kZXggPSBfcGFyc2VJdGVtSW5kZXhGcm9tVVJMKCkucGlkO1xuXHRcdFx0fSk7XG5cblx0XHRcdFxuXG5cdFx0XHRcblx0XHRcdHZhciBpbmRleCA9IF9pbml0aWFsSGFzaC5pbmRleE9mKCdwaWQ9Jyk7XG5cdFx0XHRpZihpbmRleCA+IC0xKSB7XG5cdFx0XHRcdF9pbml0aWFsSGFzaCA9IF9pbml0aWFsSGFzaC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuXHRcdFx0XHRpZihfaW5pdGlhbEhhc2guc2xpY2UoLTEpID09PSAnJicpIHtcblx0XHRcdFx0XHRfaW5pdGlhbEhhc2ggPSBfaW5pdGlhbEhhc2guc2xpY2UoMCwgLTEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYoX2lzT3BlbikgeyAvLyBoYXNuJ3QgZGVzdHJveWVkIHlldFxuXHRcdFx0XHRcdGZyYW1ld29yay5iaW5kKHdpbmRvdywgJ2hhc2hjaGFuZ2UnLCBzZWxmLm9uSGFzaENoYW5nZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0sIDQwKTtcblx0XHRcdFxuXHRcdH0sXG5cdFx0b25IYXNoQ2hhbmdlOiBmdW5jdGlvbigpIHtcblxuXHRcdFx0aWYoX2dldEhhc2goKSA9PT0gX2luaXRpYWxIYXNoKSB7XG5cblx0XHRcdFx0X2Nsb3NlZEZyb21VUkwgPSB0cnVlO1xuXHRcdFx0XHRzZWxmLmNsb3NlKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGlmKCFfaGFzaENoYW5nZWRCeVNjcmlwdCkge1xuXG5cdFx0XHRcdF9oYXNoQ2hhbmdlZEJ5SGlzdG9yeSA9IHRydWU7XG5cdFx0XHRcdHNlbGYuZ29UbyggX3BhcnNlSXRlbUluZGV4RnJvbVVSTCgpLnBpZCApO1xuXHRcdFx0XHRfaGFzaENoYW5nZWRCeUhpc3RvcnkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdH0sXG5cdFx0dXBkYXRlVVJMOiBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gRGVsYXkgdGhlIHVwZGF0ZSBvZiBVUkwsIHRvIGF2b2lkIGxhZyBkdXJpbmcgdHJhbnNpdGlvbiwgXG5cdFx0XHQvLyBhbmQgdG8gbm90IHRvIHRyaWdnZXIgYWN0aW9ucyBsaWtlIFwicmVmcmVzaCBwYWdlIHNvdW5kXCIgb3IgXCJibGlua2luZyBmYXZpY29uXCIgdG8gb2Z0ZW5cblx0XHRcdFxuXHRcdFx0X2NsZWFuSGlzdG9yeVRpbWVvdXRzKCk7XG5cdFx0XHRcblxuXHRcdFx0aWYoX2hhc2hDaGFuZ2VkQnlIaXN0b3J5KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYoIV9oaXN0b3J5Q2hhbmdlZCkge1xuXHRcdFx0XHRfdXBkYXRlSGFzaCgpOyAvLyBmaXJzdCB0aW1lXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRfaGlzdG9yeVVwZGF0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KF91cGRhdGVIYXNoLCA4MDApO1xuXHRcdFx0fVxuXHRcdH1cblx0XG5cdH1cbn0pO1xuXG5cbi8qPj5oaXN0b3J5Ki9cblx0ZnJhbWV3b3JrLmV4dGVuZChzZWxmLCBwdWJsaWNNZXRob2RzKTsgfTtcblx0cmV0dXJuIFBob3RvU3dpcGU7XG59KTsiLCIvKiFcbldheXBvaW50cyAtIDQuMC4wXG5Db3B5cmlnaHQgwqkgMjAxMS0yMDE1IENhbGViIFRyb3VnaHRvblxuTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuaHR0cHM6Ly9naXRodWIuY29tL2ltYWtld2VidGhpbmdzL3dheXBvaW50cy9ibG9nL21hc3Rlci9saWNlbnNlcy50eHRcbiovXG4oZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0J1xuXG4gIHZhciBrZXlDb3VudGVyID0gMFxuICB2YXIgYWxsV2F5cG9pbnRzID0ge31cblxuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvd2F5cG9pbnQgKi9cbiAgZnVuY3Rpb24gV2F5cG9pbnQob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBvcHRpb25zIHBhc3NlZCB0byBXYXlwb2ludCBjb25zdHJ1Y3RvcicpXG4gICAgfVxuICAgIGlmICghb3B0aW9ucy5lbGVtZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnQgb3B0aW9uIHBhc3NlZCB0byBXYXlwb2ludCBjb25zdHJ1Y3RvcicpXG4gICAgfVxuICAgIGlmICghb3B0aW9ucy5oYW5kbGVyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGhhbmRsZXIgb3B0aW9uIHBhc3NlZCB0byBXYXlwb2ludCBjb25zdHJ1Y3RvcicpXG4gICAgfVxuXG4gICAgdGhpcy5rZXkgPSAnd2F5cG9pbnQtJyArIGtleUNvdW50ZXJcbiAgICB0aGlzLm9wdGlvbnMgPSBXYXlwb2ludC5BZGFwdGVyLmV4dGVuZCh7fSwgV2F5cG9pbnQuZGVmYXVsdHMsIG9wdGlvbnMpXG4gICAgdGhpcy5lbGVtZW50ID0gdGhpcy5vcHRpb25zLmVsZW1lbnRcbiAgICB0aGlzLmFkYXB0ZXIgPSBuZXcgV2F5cG9pbnQuQWRhcHRlcih0aGlzLmVsZW1lbnQpXG4gICAgdGhpcy5jYWxsYmFjayA9IG9wdGlvbnMuaGFuZGxlclxuICAgIHRoaXMuYXhpcyA9IHRoaXMub3B0aW9ucy5ob3Jpem9udGFsID8gJ2hvcml6b250YWwnIDogJ3ZlcnRpY2FsJ1xuICAgIHRoaXMuZW5hYmxlZCA9IHRoaXMub3B0aW9ucy5lbmFibGVkXG4gICAgdGhpcy50cmlnZ2VyUG9pbnQgPSBudWxsXG4gICAgdGhpcy5ncm91cCA9IFdheXBvaW50Lkdyb3VwLmZpbmRPckNyZWF0ZSh7XG4gICAgICBuYW1lOiB0aGlzLm9wdGlvbnMuZ3JvdXAsXG4gICAgICBheGlzOiB0aGlzLmF4aXNcbiAgICB9KVxuICAgIHRoaXMuY29udGV4dCA9IFdheXBvaW50LkNvbnRleHQuZmluZE9yQ3JlYXRlQnlFbGVtZW50KHRoaXMub3B0aW9ucy5jb250ZXh0KVxuXG4gICAgaWYgKFdheXBvaW50Lm9mZnNldEFsaWFzZXNbdGhpcy5vcHRpb25zLm9mZnNldF0pIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vZmZzZXQgPSBXYXlwb2ludC5vZmZzZXRBbGlhc2VzW3RoaXMub3B0aW9ucy5vZmZzZXRdXG4gICAgfVxuICAgIHRoaXMuZ3JvdXAuYWRkKHRoaXMpXG4gICAgdGhpcy5jb250ZXh0LmFkZCh0aGlzKVxuICAgIGFsbFdheXBvaW50c1t0aGlzLmtleV0gPSB0aGlzXG4gICAga2V5Q291bnRlciArPSAxXG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIFdheXBvaW50LnByb3RvdHlwZS5xdWV1ZVRyaWdnZXIgPSBmdW5jdGlvbihkaXJlY3Rpb24pIHtcbiAgICB0aGlzLmdyb3VwLnF1ZXVlVHJpZ2dlcih0aGlzLCBkaXJlY3Rpb24pXG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIFdheXBvaW50LnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24oYXJncykge1xuICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgaWYgKHRoaXMuY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuY2FsbGJhY2suYXBwbHkodGhpcywgYXJncylcbiAgICB9XG4gIH1cblxuICAvKiBQdWJsaWMgKi9cbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2Rlc3Ryb3kgKi9cbiAgV2F5cG9pbnQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNvbnRleHQucmVtb3ZlKHRoaXMpXG4gICAgdGhpcy5ncm91cC5yZW1vdmUodGhpcylcbiAgICBkZWxldGUgYWxsV2F5cG9pbnRzW3RoaXMua2V5XVxuICB9XG5cbiAgLyogUHVibGljICovXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9kaXNhYmxlICovXG4gIFdheXBvaW50LnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2VcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyogUHVibGljICovXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9lbmFibGUgKi9cbiAgV2F5cG9pbnQucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY29udGV4dC5yZWZyZXNoKClcbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qIFB1YmxpYyAqL1xuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvbmV4dCAqL1xuICBXYXlwb2ludC5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdyb3VwLm5leHQodGhpcylcbiAgfVxuXG4gIC8qIFB1YmxpYyAqL1xuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvcHJldmlvdXMgKi9cbiAgV2F5cG9pbnQucHJvdG90eXBlLnByZXZpb3VzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ3JvdXAucHJldmlvdXModGhpcylcbiAgfVxuXG4gIC8qIFByaXZhdGUgKi9cbiAgV2F5cG9pbnQuaW52b2tlQWxsID0gZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgdmFyIGFsbFdheXBvaW50c0FycmF5ID0gW11cbiAgICBmb3IgKHZhciB3YXlwb2ludEtleSBpbiBhbGxXYXlwb2ludHMpIHtcbiAgICAgIGFsbFdheXBvaW50c0FycmF5LnB1c2goYWxsV2F5cG9pbnRzW3dheXBvaW50S2V5XSlcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDAsIGVuZCA9IGFsbFdheXBvaW50c0FycmF5Lmxlbmd0aDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBhbGxXYXlwb2ludHNBcnJheVtpXVttZXRob2RdKClcbiAgICB9XG4gIH1cblxuICAvKiBQdWJsaWMgKi9cbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2Rlc3Ryb3ktYWxsICovXG4gIFdheXBvaW50LmRlc3Ryb3lBbGwgPSBmdW5jdGlvbigpIHtcbiAgICBXYXlwb2ludC5pbnZva2VBbGwoJ2Rlc3Ryb3knKVxuICB9XG5cbiAgLyogUHVibGljICovXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9kaXNhYmxlLWFsbCAqL1xuICBXYXlwb2ludC5kaXNhYmxlQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgV2F5cG9pbnQuaW52b2tlQWxsKCdkaXNhYmxlJylcbiAgfVxuXG4gIC8qIFB1YmxpYyAqL1xuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvZW5hYmxlLWFsbCAqL1xuICBXYXlwb2ludC5lbmFibGVBbGwgPSBmdW5jdGlvbigpIHtcbiAgICBXYXlwb2ludC5pbnZva2VBbGwoJ2VuYWJsZScpXG4gIH1cblxuICAvKiBQdWJsaWMgKi9cbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL3JlZnJlc2gtYWxsICovXG4gIFdheXBvaW50LnJlZnJlc2hBbGwgPSBmdW5jdGlvbigpIHtcbiAgICBXYXlwb2ludC5Db250ZXh0LnJlZnJlc2hBbGwoKVxuICB9XG5cbiAgLyogUHVibGljICovXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS92aWV3cG9ydC1oZWlnaHQgKi9cbiAgV2F5cG9pbnQudmlld3BvcnRIZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gd2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHRcbiAgfVxuXG4gIC8qIFB1YmxpYyAqL1xuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvdmlld3BvcnQtd2lkdGggKi9cbiAgV2F5cG9pbnQudmlld3BvcnRXaWR0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGhcbiAgfVxuXG4gIFdheXBvaW50LmFkYXB0ZXJzID0gW11cblxuICBXYXlwb2ludC5kZWZhdWx0cyA9IHtcbiAgICBjb250ZXh0OiB3aW5kb3csXG4gICAgY29udGludW91czogdHJ1ZSxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGdyb3VwOiAnZGVmYXVsdCcsXG4gICAgaG9yaXpvbnRhbDogZmFsc2UsXG4gICAgb2Zmc2V0OiAwXG4gIH1cblxuICBXYXlwb2ludC5vZmZzZXRBbGlhc2VzID0ge1xuICAgICdib3R0b20taW4tdmlldyc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5pbm5lckhlaWdodCgpIC0gdGhpcy5hZGFwdGVyLm91dGVySGVpZ2h0KClcbiAgICB9LFxuICAgICdyaWdodC1pbi12aWV3JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LmlubmVyV2lkdGgoKSAtIHRoaXMuYWRhcHRlci5vdXRlcldpZHRoKClcbiAgICB9XG4gIH1cblxuICB3aW5kb3cuV2F5cG9pbnQgPSBXYXlwb2ludFxufSgpKVxuOyhmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnXG5cbiAgZnVuY3Rpb24gcmVxdWVzdEFuaW1hdGlvbkZyYW1lU2hpbShjYWxsYmFjaykge1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApXG4gIH1cblxuICB2YXIga2V5Q291bnRlciA9IDBcbiAgdmFyIGNvbnRleHRzID0ge31cbiAgdmFyIFdheXBvaW50ID0gd2luZG93LldheXBvaW50XG4gIHZhciBvbGRXaW5kb3dMb2FkID0gd2luZG93Lm9ubG9hZFxuXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9jb250ZXh0ICovXG4gIGZ1bmN0aW9uIENvbnRleHQoZWxlbWVudCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnRcbiAgICB0aGlzLkFkYXB0ZXIgPSBXYXlwb2ludC5BZGFwdGVyXG4gICAgdGhpcy5hZGFwdGVyID0gbmV3IHRoaXMuQWRhcHRlcihlbGVtZW50KVxuICAgIHRoaXMua2V5ID0gJ3dheXBvaW50LWNvbnRleHQtJyArIGtleUNvdW50ZXJcbiAgICB0aGlzLmRpZFNjcm9sbCA9IGZhbHNlXG4gICAgdGhpcy5kaWRSZXNpemUgPSBmYWxzZVxuICAgIHRoaXMub2xkU2Nyb2xsID0ge1xuICAgICAgeDogdGhpcy5hZGFwdGVyLnNjcm9sbExlZnQoKSxcbiAgICAgIHk6IHRoaXMuYWRhcHRlci5zY3JvbGxUb3AoKVxuICAgIH1cbiAgICB0aGlzLndheXBvaW50cyA9IHtcbiAgICAgIHZlcnRpY2FsOiB7fSxcbiAgICAgIGhvcml6b250YWw6IHt9XG4gICAgfVxuXG4gICAgZWxlbWVudC53YXlwb2ludENvbnRleHRLZXkgPSB0aGlzLmtleVxuICAgIGNvbnRleHRzW2VsZW1lbnQud2F5cG9pbnRDb250ZXh0S2V5XSA9IHRoaXNcbiAgICBrZXlDb3VudGVyICs9IDFcblxuICAgIHRoaXMuY3JlYXRlVGhyb3R0bGVkU2Nyb2xsSGFuZGxlcigpXG4gICAgdGhpcy5jcmVhdGVUaHJvdHRsZWRSZXNpemVIYW5kbGVyKClcbiAgfVxuXG4gIC8qIFByaXZhdGUgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24od2F5cG9pbnQpIHtcbiAgICB2YXIgYXhpcyA9IHdheXBvaW50Lm9wdGlvbnMuaG9yaXpvbnRhbCA/ICdob3Jpem9udGFsJyA6ICd2ZXJ0aWNhbCdcbiAgICB0aGlzLndheXBvaW50c1theGlzXVt3YXlwb2ludC5rZXldID0gd2F5cG9pbnRcbiAgICB0aGlzLnJlZnJlc2goKVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5jaGVja0VtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGhvcml6b250YWxFbXB0eSA9IHRoaXMuQWRhcHRlci5pc0VtcHR5T2JqZWN0KHRoaXMud2F5cG9pbnRzLmhvcml6b250YWwpXG4gICAgdmFyIHZlcnRpY2FsRW1wdHkgPSB0aGlzLkFkYXB0ZXIuaXNFbXB0eU9iamVjdCh0aGlzLndheXBvaW50cy52ZXJ0aWNhbClcbiAgICBpZiAoaG9yaXpvbnRhbEVtcHR5ICYmIHZlcnRpY2FsRW1wdHkpIHtcbiAgICAgIHRoaXMuYWRhcHRlci5vZmYoJy53YXlwb2ludHMnKVxuICAgICAgZGVsZXRlIGNvbnRleHRzW3RoaXMua2V5XVxuICAgIH1cbiAgfVxuXG4gIC8qIFByaXZhdGUgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUuY3JlYXRlVGhyb3R0bGVkUmVzaXplSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpc1xuXG4gICAgZnVuY3Rpb24gcmVzaXplSGFuZGxlcigpIHtcbiAgICAgIHNlbGYuaGFuZGxlUmVzaXplKClcbiAgICAgIHNlbGYuZGlkUmVzaXplID0gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLmFkYXB0ZXIub24oJ3Jlc2l6ZS53YXlwb2ludHMnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghc2VsZi5kaWRSZXNpemUpIHtcbiAgICAgICAgc2VsZi5kaWRSZXNpemUgPSB0cnVlXG4gICAgICAgIFdheXBvaW50LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZXNpemVIYW5kbGVyKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIENvbnRleHQucHJvdG90eXBlLmNyZWF0ZVRocm90dGxlZFNjcm9sbEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICBmdW5jdGlvbiBzY3JvbGxIYW5kbGVyKCkge1xuICAgICAgc2VsZi5oYW5kbGVTY3JvbGwoKVxuICAgICAgc2VsZi5kaWRTY3JvbGwgPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuYWRhcHRlci5vbignc2Nyb2xsLndheXBvaW50cycsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFzZWxmLmRpZFNjcm9sbCB8fCBXYXlwb2ludC5pc1RvdWNoKSB7XG4gICAgICAgIHNlbGYuZGlkU2Nyb2xsID0gdHJ1ZVxuICAgICAgICBXYXlwb2ludC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc2Nyb2xsSGFuZGxlcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5oYW5kbGVSZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgICBXYXlwb2ludC5Db250ZXh0LnJlZnJlc2hBbGwoKVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5oYW5kbGVTY3JvbGwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdHJpZ2dlcmVkR3JvdXBzID0ge31cbiAgICB2YXIgYXhlcyA9IHtcbiAgICAgIGhvcml6b250YWw6IHtcbiAgICAgICAgbmV3U2Nyb2xsOiB0aGlzLmFkYXB0ZXIuc2Nyb2xsTGVmdCgpLFxuICAgICAgICBvbGRTY3JvbGw6IHRoaXMub2xkU2Nyb2xsLngsXG4gICAgICAgIGZvcndhcmQ6ICdyaWdodCcsXG4gICAgICAgIGJhY2t3YXJkOiAnbGVmdCdcbiAgICAgIH0sXG4gICAgICB2ZXJ0aWNhbDoge1xuICAgICAgICBuZXdTY3JvbGw6IHRoaXMuYWRhcHRlci5zY3JvbGxUb3AoKSxcbiAgICAgICAgb2xkU2Nyb2xsOiB0aGlzLm9sZFNjcm9sbC55LFxuICAgICAgICBmb3J3YXJkOiAnZG93bicsXG4gICAgICAgIGJhY2t3YXJkOiAndXAnXG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgYXhpc0tleSBpbiBheGVzKSB7XG4gICAgICB2YXIgYXhpcyA9IGF4ZXNbYXhpc0tleV1cbiAgICAgIHZhciBpc0ZvcndhcmQgPSBheGlzLm5ld1Njcm9sbCA+IGF4aXMub2xkU2Nyb2xsXG4gICAgICB2YXIgZGlyZWN0aW9uID0gaXNGb3J3YXJkID8gYXhpcy5mb3J3YXJkIDogYXhpcy5iYWNrd2FyZFxuXG4gICAgICBmb3IgKHZhciB3YXlwb2ludEtleSBpbiB0aGlzLndheXBvaW50c1theGlzS2V5XSkge1xuICAgICAgICB2YXIgd2F5cG9pbnQgPSB0aGlzLndheXBvaW50c1theGlzS2V5XVt3YXlwb2ludEtleV1cbiAgICAgICAgdmFyIHdhc0JlZm9yZVRyaWdnZXJQb2ludCA9IGF4aXMub2xkU2Nyb2xsIDwgd2F5cG9pbnQudHJpZ2dlclBvaW50XG4gICAgICAgIHZhciBub3dBZnRlclRyaWdnZXJQb2ludCA9IGF4aXMubmV3U2Nyb2xsID49IHdheXBvaW50LnRyaWdnZXJQb2ludFxuICAgICAgICB2YXIgY3Jvc3NlZEZvcndhcmQgPSB3YXNCZWZvcmVUcmlnZ2VyUG9pbnQgJiYgbm93QWZ0ZXJUcmlnZ2VyUG9pbnRcbiAgICAgICAgdmFyIGNyb3NzZWRCYWNrd2FyZCA9ICF3YXNCZWZvcmVUcmlnZ2VyUG9pbnQgJiYgIW5vd0FmdGVyVHJpZ2dlclBvaW50XG4gICAgICAgIGlmIChjcm9zc2VkRm9yd2FyZCB8fCBjcm9zc2VkQmFja3dhcmQpIHtcbiAgICAgICAgICB3YXlwb2ludC5xdWV1ZVRyaWdnZXIoZGlyZWN0aW9uKVxuICAgICAgICAgIHRyaWdnZXJlZEdyb3Vwc1t3YXlwb2ludC5ncm91cC5pZF0gPSB3YXlwb2ludC5ncm91cFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgZ3JvdXBLZXkgaW4gdHJpZ2dlcmVkR3JvdXBzKSB7XG4gICAgICB0cmlnZ2VyZWRHcm91cHNbZ3JvdXBLZXldLmZsdXNoVHJpZ2dlcnMoKVxuICAgIH1cblxuICAgIHRoaXMub2xkU2Nyb2xsID0ge1xuICAgICAgeDogYXhlcy5ob3Jpem9udGFsLm5ld1Njcm9sbCxcbiAgICAgIHk6IGF4ZXMudmVydGljYWwubmV3U2Nyb2xsXG4gICAgfVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5pbm5lckhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgIC8qZXNsaW50LWRpc2FibGUgZXFlcWVxICovXG4gICAgaWYgKHRoaXMuZWxlbWVudCA9PSB0aGlzLmVsZW1lbnQud2luZG93KSB7XG4gICAgICByZXR1cm4gV2F5cG9pbnQudmlld3BvcnRIZWlnaHQoKVxuICAgIH1cbiAgICAvKmVzbGludC1lbmFibGUgZXFlcWVxICovXG4gICAgcmV0dXJuIHRoaXMuYWRhcHRlci5pbm5lckhlaWdodCgpXG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIENvbnRleHQucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHdheXBvaW50KSB7XG4gICAgZGVsZXRlIHRoaXMud2F5cG9pbnRzW3dheXBvaW50LmF4aXNdW3dheXBvaW50LmtleV1cbiAgICB0aGlzLmNoZWNrRW1wdHkoKVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5pbm5lcldpZHRoID0gZnVuY3Rpb24oKSB7XG4gICAgLyplc2xpbnQtZGlzYWJsZSBlcWVxZXEgKi9cbiAgICBpZiAodGhpcy5lbGVtZW50ID09IHRoaXMuZWxlbWVudC53aW5kb3cpIHtcbiAgICAgIHJldHVybiBXYXlwb2ludC52aWV3cG9ydFdpZHRoKClcbiAgICB9XG4gICAgLyplc2xpbnQtZW5hYmxlIGVxZXFlcSAqL1xuICAgIHJldHVybiB0aGlzLmFkYXB0ZXIuaW5uZXJXaWR0aCgpXG4gIH1cblxuICAvKiBQdWJsaWMgKi9cbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2NvbnRleHQtZGVzdHJveSAqL1xuICBDb250ZXh0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFsbFdheXBvaW50cyA9IFtdXG4gICAgZm9yICh2YXIgYXhpcyBpbiB0aGlzLndheXBvaW50cykge1xuICAgICAgZm9yICh2YXIgd2F5cG9pbnRLZXkgaW4gdGhpcy53YXlwb2ludHNbYXhpc10pIHtcbiAgICAgICAgYWxsV2F5cG9pbnRzLnB1c2godGhpcy53YXlwb2ludHNbYXhpc11bd2F5cG9pbnRLZXldKVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMCwgZW5kID0gYWxsV2F5cG9pbnRzLmxlbmd0aDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBhbGxXYXlwb2ludHNbaV0uZGVzdHJveSgpXG4gICAgfVxuICB9XG5cbiAgLyogUHVibGljICovXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9jb250ZXh0LXJlZnJlc2ggKi9cbiAgQ29udGV4dC5wcm90b3R5cGUucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuICAgIC8qZXNsaW50LWRpc2FibGUgZXFlcWVxICovXG4gICAgdmFyIGlzV2luZG93ID0gdGhpcy5lbGVtZW50ID09IHRoaXMuZWxlbWVudC53aW5kb3dcbiAgICAvKmVzbGludC1lbmFibGUgZXFlcWVxICovXG4gICAgdmFyIGNvbnRleHRPZmZzZXQgPSBpc1dpbmRvdyA/IHVuZGVmaW5lZCA6IHRoaXMuYWRhcHRlci5vZmZzZXQoKVxuICAgIHZhciB0cmlnZ2VyZWRHcm91cHMgPSB7fVxuICAgIHZhciBheGVzXG5cbiAgICB0aGlzLmhhbmRsZVNjcm9sbCgpXG4gICAgYXhlcyA9IHtcbiAgICAgIGhvcml6b250YWw6IHtcbiAgICAgICAgY29udGV4dE9mZnNldDogaXNXaW5kb3cgPyAwIDogY29udGV4dE9mZnNldC5sZWZ0LFxuICAgICAgICBjb250ZXh0U2Nyb2xsOiBpc1dpbmRvdyA/IDAgOiB0aGlzLm9sZFNjcm9sbC54LFxuICAgICAgICBjb250ZXh0RGltZW5zaW9uOiB0aGlzLmlubmVyV2lkdGgoKSxcbiAgICAgICAgb2xkU2Nyb2xsOiB0aGlzLm9sZFNjcm9sbC54LFxuICAgICAgICBmb3J3YXJkOiAncmlnaHQnLFxuICAgICAgICBiYWNrd2FyZDogJ2xlZnQnLFxuICAgICAgICBvZmZzZXRQcm9wOiAnbGVmdCdcbiAgICAgIH0sXG4gICAgICB2ZXJ0aWNhbDoge1xuICAgICAgICBjb250ZXh0T2Zmc2V0OiBpc1dpbmRvdyA/IDAgOiBjb250ZXh0T2Zmc2V0LnRvcCxcbiAgICAgICAgY29udGV4dFNjcm9sbDogaXNXaW5kb3cgPyAwIDogdGhpcy5vbGRTY3JvbGwueSxcbiAgICAgICAgY29udGV4dERpbWVuc2lvbjogdGhpcy5pbm5lckhlaWdodCgpLFxuICAgICAgICBvbGRTY3JvbGw6IHRoaXMub2xkU2Nyb2xsLnksXG4gICAgICAgIGZvcndhcmQ6ICdkb3duJyxcbiAgICAgICAgYmFja3dhcmQ6ICd1cCcsXG4gICAgICAgIG9mZnNldFByb3A6ICd0b3AnXG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgYXhpc0tleSBpbiBheGVzKSB7XG4gICAgICB2YXIgYXhpcyA9IGF4ZXNbYXhpc0tleV1cbiAgICAgIGZvciAodmFyIHdheXBvaW50S2V5IGluIHRoaXMud2F5cG9pbnRzW2F4aXNLZXldKSB7XG4gICAgICAgIHZhciB3YXlwb2ludCA9IHRoaXMud2F5cG9pbnRzW2F4aXNLZXldW3dheXBvaW50S2V5XVxuICAgICAgICB2YXIgYWRqdXN0bWVudCA9IHdheXBvaW50Lm9wdGlvbnMub2Zmc2V0XG4gICAgICAgIHZhciBvbGRUcmlnZ2VyUG9pbnQgPSB3YXlwb2ludC50cmlnZ2VyUG9pbnRcbiAgICAgICAgdmFyIGVsZW1lbnRPZmZzZXQgPSAwXG4gICAgICAgIHZhciBmcmVzaFdheXBvaW50ID0gb2xkVHJpZ2dlclBvaW50ID09IG51bGxcbiAgICAgICAgdmFyIGNvbnRleHRNb2RpZmllciwgd2FzQmVmb3JlU2Nyb2xsLCBub3dBZnRlclNjcm9sbFxuICAgICAgICB2YXIgdHJpZ2dlcmVkQmFja3dhcmQsIHRyaWdnZXJlZEZvcndhcmRcblxuICAgICAgICBpZiAod2F5cG9pbnQuZWxlbWVudCAhPT0gd2F5cG9pbnQuZWxlbWVudC53aW5kb3cpIHtcbiAgICAgICAgICBlbGVtZW50T2Zmc2V0ID0gd2F5cG9pbnQuYWRhcHRlci5vZmZzZXQoKVtheGlzLm9mZnNldFByb3BdXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGFkanVzdG1lbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBhZGp1c3RtZW50ID0gYWRqdXN0bWVudC5hcHBseSh3YXlwb2ludClcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgYWRqdXN0bWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBhZGp1c3RtZW50ID0gcGFyc2VGbG9hdChhZGp1c3RtZW50KVxuICAgICAgICAgIGlmICh3YXlwb2ludC5vcHRpb25zLm9mZnNldC5pbmRleE9mKCclJykgPiAtIDEpIHtcbiAgICAgICAgICAgIGFkanVzdG1lbnQgPSBNYXRoLmNlaWwoYXhpcy5jb250ZXh0RGltZW5zaW9uICogYWRqdXN0bWVudCAvIDEwMClcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb250ZXh0TW9kaWZpZXIgPSBheGlzLmNvbnRleHRTY3JvbGwgLSBheGlzLmNvbnRleHRPZmZzZXRcbiAgICAgICAgd2F5cG9pbnQudHJpZ2dlclBvaW50ID0gZWxlbWVudE9mZnNldCArIGNvbnRleHRNb2RpZmllciAtIGFkanVzdG1lbnRcbiAgICAgICAgd2FzQmVmb3JlU2Nyb2xsID0gb2xkVHJpZ2dlclBvaW50IDwgYXhpcy5vbGRTY3JvbGxcbiAgICAgICAgbm93QWZ0ZXJTY3JvbGwgPSB3YXlwb2ludC50cmlnZ2VyUG9pbnQgPj0gYXhpcy5vbGRTY3JvbGxcbiAgICAgICAgdHJpZ2dlcmVkQmFja3dhcmQgPSB3YXNCZWZvcmVTY3JvbGwgJiYgbm93QWZ0ZXJTY3JvbGxcbiAgICAgICAgdHJpZ2dlcmVkRm9yd2FyZCA9ICF3YXNCZWZvcmVTY3JvbGwgJiYgIW5vd0FmdGVyU2Nyb2xsXG5cbiAgICAgICAgaWYgKCFmcmVzaFdheXBvaW50ICYmIHRyaWdnZXJlZEJhY2t3YXJkKSB7XG4gICAgICAgICAgd2F5cG9pbnQucXVldWVUcmlnZ2VyKGF4aXMuYmFja3dhcmQpXG4gICAgICAgICAgdHJpZ2dlcmVkR3JvdXBzW3dheXBvaW50Lmdyb3VwLmlkXSA9IHdheXBvaW50Lmdyb3VwXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIWZyZXNoV2F5cG9pbnQgJiYgdHJpZ2dlcmVkRm9yd2FyZCkge1xuICAgICAgICAgIHdheXBvaW50LnF1ZXVlVHJpZ2dlcihheGlzLmZvcndhcmQpXG4gICAgICAgICAgdHJpZ2dlcmVkR3JvdXBzW3dheXBvaW50Lmdyb3VwLmlkXSA9IHdheXBvaW50Lmdyb3VwXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZnJlc2hXYXlwb2ludCAmJiBheGlzLm9sZFNjcm9sbCA+PSB3YXlwb2ludC50cmlnZ2VyUG9pbnQpIHtcbiAgICAgICAgICB3YXlwb2ludC5xdWV1ZVRyaWdnZXIoYXhpcy5mb3J3YXJkKVxuICAgICAgICAgIHRyaWdnZXJlZEdyb3Vwc1t3YXlwb2ludC5ncm91cC5pZF0gPSB3YXlwb2ludC5ncm91cFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgV2F5cG9pbnQucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgICAgZm9yICh2YXIgZ3JvdXBLZXkgaW4gdHJpZ2dlcmVkR3JvdXBzKSB7XG4gICAgICAgIHRyaWdnZXJlZEdyb3Vwc1tncm91cEtleV0uZmx1c2hUcmlnZ2VycygpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIENvbnRleHQuZmluZE9yQ3JlYXRlQnlFbGVtZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHJldHVybiBDb250ZXh0LmZpbmRCeUVsZW1lbnQoZWxlbWVudCkgfHwgbmV3IENvbnRleHQoZWxlbWVudClcbiAgfVxuXG4gIC8qIFByaXZhdGUgKi9cbiAgQ29udGV4dC5yZWZyZXNoQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgY29udGV4dElkIGluIGNvbnRleHRzKSB7XG4gICAgICBjb250ZXh0c1tjb250ZXh0SWRdLnJlZnJlc2goKVxuICAgIH1cbiAgfVxuXG4gIC8qIFB1YmxpYyAqL1xuICAvKiBodHRwOi8vaW1ha2V3ZWJ0aGluZ3MuY29tL3dheXBvaW50cy9hcGkvY29udGV4dC1maW5kLWJ5LWVsZW1lbnQgKi9cbiAgQ29udGV4dC5maW5kQnlFbGVtZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHJldHVybiBjb250ZXh0c1tlbGVtZW50LndheXBvaW50Q29udGV4dEtleV1cbiAgfVxuXG4gIHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAob2xkV2luZG93TG9hZCkge1xuICAgICAgb2xkV2luZG93TG9hZCgpXG4gICAgfVxuICAgIENvbnRleHQucmVmcmVzaEFsbCgpXG4gIH1cblxuICBXYXlwb2ludC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciByZXF1ZXN0Rm4gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWVTaGltXG4gICAgcmVxdWVzdEZuLmNhbGwod2luZG93LCBjYWxsYmFjaylcbiAgfVxuICBXYXlwb2ludC5Db250ZXh0ID0gQ29udGV4dFxufSgpKVxuOyhmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnXG5cbiAgZnVuY3Rpb24gYnlUcmlnZ2VyUG9pbnQoYSwgYikge1xuICAgIHJldHVybiBhLnRyaWdnZXJQb2ludCAtIGIudHJpZ2dlclBvaW50XG4gIH1cblxuICBmdW5jdGlvbiBieVJldmVyc2VUcmlnZ2VyUG9pbnQoYSwgYikge1xuICAgIHJldHVybiBiLnRyaWdnZXJQb2ludCAtIGEudHJpZ2dlclBvaW50XG4gIH1cblxuICB2YXIgZ3JvdXBzID0ge1xuICAgIHZlcnRpY2FsOiB7fSxcbiAgICBob3Jpem9udGFsOiB7fVxuICB9XG4gIHZhciBXYXlwb2ludCA9IHdpbmRvdy5XYXlwb2ludFxuXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9ncm91cCAqL1xuICBmdW5jdGlvbiBHcm91cChvcHRpb25zKSB7XG4gICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lXG4gICAgdGhpcy5heGlzID0gb3B0aW9ucy5heGlzXG4gICAgdGhpcy5pZCA9IHRoaXMubmFtZSArICctJyArIHRoaXMuYXhpc1xuICAgIHRoaXMud2F5cG9pbnRzID0gW11cbiAgICB0aGlzLmNsZWFyVHJpZ2dlclF1ZXVlcygpXG4gICAgZ3JvdXBzW3RoaXMuYXhpc11bdGhpcy5uYW1lXSA9IHRoaXNcbiAgfVxuXG4gIC8qIFByaXZhdGUgKi9cbiAgR3JvdXAucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHdheXBvaW50KSB7XG4gICAgdGhpcy53YXlwb2ludHMucHVzaCh3YXlwb2ludClcbiAgfVxuXG4gIC8qIFByaXZhdGUgKi9cbiAgR3JvdXAucHJvdG90eXBlLmNsZWFyVHJpZ2dlclF1ZXVlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudHJpZ2dlclF1ZXVlcyA9IHtcbiAgICAgIHVwOiBbXSxcbiAgICAgIGRvd246IFtdLFxuICAgICAgbGVmdDogW10sXG4gICAgICByaWdodDogW11cbiAgICB9XG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIEdyb3VwLnByb3RvdHlwZS5mbHVzaFRyaWdnZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgZGlyZWN0aW9uIGluIHRoaXMudHJpZ2dlclF1ZXVlcykge1xuICAgICAgdmFyIHdheXBvaW50cyA9IHRoaXMudHJpZ2dlclF1ZXVlc1tkaXJlY3Rpb25dXG4gICAgICB2YXIgcmV2ZXJzZSA9IGRpcmVjdGlvbiA9PT0gJ3VwJyB8fCBkaXJlY3Rpb24gPT09ICdsZWZ0J1xuICAgICAgd2F5cG9pbnRzLnNvcnQocmV2ZXJzZSA/IGJ5UmV2ZXJzZVRyaWdnZXJQb2ludCA6IGJ5VHJpZ2dlclBvaW50KVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGVuZCA9IHdheXBvaW50cy5sZW5ndGg7IGkgPCBlbmQ7IGkgKz0gMSkge1xuICAgICAgICB2YXIgd2F5cG9pbnQgPSB3YXlwb2ludHNbaV1cbiAgICAgICAgaWYgKHdheXBvaW50Lm9wdGlvbnMuY29udGludW91cyB8fCBpID09PSB3YXlwb2ludHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIHdheXBvaW50LnRyaWdnZXIoW2RpcmVjdGlvbl0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jbGVhclRyaWdnZXJRdWV1ZXMoKVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBHcm91cC5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKHdheXBvaW50KSB7XG4gICAgdGhpcy53YXlwb2ludHMuc29ydChieVRyaWdnZXJQb2ludClcbiAgICB2YXIgaW5kZXggPSBXYXlwb2ludC5BZGFwdGVyLmluQXJyYXkod2F5cG9pbnQsIHRoaXMud2F5cG9pbnRzKVxuICAgIHZhciBpc0xhc3QgPSBpbmRleCA9PT0gdGhpcy53YXlwb2ludHMubGVuZ3RoIC0gMVxuICAgIHJldHVybiBpc0xhc3QgPyBudWxsIDogdGhpcy53YXlwb2ludHNbaW5kZXggKyAxXVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBHcm91cC5wcm90b3R5cGUucHJldmlvdXMgPSBmdW5jdGlvbih3YXlwb2ludCkge1xuICAgIHRoaXMud2F5cG9pbnRzLnNvcnQoYnlUcmlnZ2VyUG9pbnQpXG4gICAgdmFyIGluZGV4ID0gV2F5cG9pbnQuQWRhcHRlci5pbkFycmF5KHdheXBvaW50LCB0aGlzLndheXBvaW50cylcbiAgICByZXR1cm4gaW5kZXggPyB0aGlzLndheXBvaW50c1tpbmRleCAtIDFdIDogbnVsbFxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBHcm91cC5wcm90b3R5cGUucXVldWVUcmlnZ2VyID0gZnVuY3Rpb24od2F5cG9pbnQsIGRpcmVjdGlvbikge1xuICAgIHRoaXMudHJpZ2dlclF1ZXVlc1tkaXJlY3Rpb25dLnB1c2god2F5cG9pbnQpXG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIEdyb3VwLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbih3YXlwb2ludCkge1xuICAgIHZhciBpbmRleCA9IFdheXBvaW50LkFkYXB0ZXIuaW5BcnJheSh3YXlwb2ludCwgdGhpcy53YXlwb2ludHMpXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMud2F5cG9pbnRzLnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gIH1cblxuICAvKiBQdWJsaWMgKi9cbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvYXBpL2ZpcnN0ICovXG4gIEdyb3VwLnByb3RvdHlwZS5maXJzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLndheXBvaW50c1swXVxuICB9XG5cbiAgLyogUHVibGljICovXG4gIC8qIGh0dHA6Ly9pbWFrZXdlYnRoaW5ncy5jb20vd2F5cG9pbnRzL2FwaS9sYXN0ICovXG4gIEdyb3VwLnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMud2F5cG9pbnRzW3RoaXMud2F5cG9pbnRzLmxlbmd0aCAtIDFdXG4gIH1cblxuICAvKiBQcml2YXRlICovXG4gIEdyb3VwLmZpbmRPckNyZWF0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gZ3JvdXBzW29wdGlvbnMuYXhpc11bb3B0aW9ucy5uYW1lXSB8fCBuZXcgR3JvdXAob3B0aW9ucylcbiAgfVxuXG4gIFdheXBvaW50Lkdyb3VwID0gR3JvdXBcbn0oKSlcbjsoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0J1xuXG4gIHZhciBXYXlwb2ludCA9IHdpbmRvdy5XYXlwb2ludFxuXG4gIGZ1bmN0aW9uIGlzV2luZG93KGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudCA9PT0gZWxlbWVudC53aW5kb3dcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFdpbmRvdyhlbGVtZW50KSB7XG4gICAgaWYgKGlzV2luZG93KGVsZW1lbnQpKSB7XG4gICAgICByZXR1cm4gZWxlbWVudFxuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudC5kZWZhdWx0Vmlld1xuICB9XG5cbiAgZnVuY3Rpb24gTm9GcmFtZXdvcmtBZGFwdGVyKGVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50XG4gICAgdGhpcy5oYW5kbGVycyA9IHt9XG4gIH1cblxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLmlubmVySGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzV2luID0gaXNXaW5kb3codGhpcy5lbGVtZW50KVxuICAgIHJldHVybiBpc1dpbiA/IHRoaXMuZWxlbWVudC5pbm5lckhlaWdodCA6IHRoaXMuZWxlbWVudC5jbGllbnRIZWlnaHRcbiAgfVxuXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5wcm90b3R5cGUuaW5uZXJXaWR0aCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc1dpbiA9IGlzV2luZG93KHRoaXMuZWxlbWVudClcbiAgICByZXR1cm4gaXNXaW4gPyB0aGlzLmVsZW1lbnQuaW5uZXJXaWR0aCA6IHRoaXMuZWxlbWVudC5jbGllbnRXaWR0aFxuICB9XG5cbiAgTm9GcmFtZXdvcmtBZGFwdGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudCwgaGFuZGxlcikge1xuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhlbGVtZW50LCBsaXN0ZW5lcnMsIGhhbmRsZXIpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IGxpc3RlbmVyc1tpXVxuICAgICAgICBpZiAoIWhhbmRsZXIgfHwgaGFuZGxlciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobGlzdGVuZXIpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZXZlbnRQYXJ0cyA9IGV2ZW50LnNwbGl0KCcuJylcbiAgICB2YXIgZXZlbnRUeXBlID0gZXZlbnRQYXJ0c1swXVxuICAgIHZhciBuYW1lc3BhY2UgPSBldmVudFBhcnRzWzFdXG4gICAgdmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnRcblxuICAgIGlmIChuYW1lc3BhY2UgJiYgdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdICYmIGV2ZW50VHlwZSkge1xuICAgICAgcmVtb3ZlTGlzdGVuZXJzKGVsZW1lbnQsIHRoaXMuaGFuZGxlcnNbbmFtZXNwYWNlXVtldmVudFR5cGVdLCBoYW5kbGVyKVxuICAgICAgdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdW2V2ZW50VHlwZV0gPSBbXVxuICAgIH1cbiAgICBlbHNlIGlmIChldmVudFR5cGUpIHtcbiAgICAgIGZvciAodmFyIG5zIGluIHRoaXMuaGFuZGxlcnMpIHtcbiAgICAgICAgcmVtb3ZlTGlzdGVuZXJzKGVsZW1lbnQsIHRoaXMuaGFuZGxlcnNbbnNdW2V2ZW50VHlwZV0gfHwgW10sIGhhbmRsZXIpXG4gICAgICAgIHRoaXMuaGFuZGxlcnNbbnNdW2V2ZW50VHlwZV0gPSBbXVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChuYW1lc3BhY2UgJiYgdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdKSB7XG4gICAgICBmb3IgKHZhciB0eXBlIGluIHRoaXMuaGFuZGxlcnNbbmFtZXNwYWNlXSkge1xuICAgICAgICByZW1vdmVMaXN0ZW5lcnMoZWxlbWVudCwgdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdW3R5cGVdLCBoYW5kbGVyKVxuICAgICAgfVxuICAgICAgdGhpcy5oYW5kbGVyc1tuYW1lc3BhY2VdID0ge31cbiAgICB9XG4gIH1cblxuICAvKiBBZGFwdGVkIGZyb20galF1ZXJ5IDEueCBvZmZzZXQoKSAqL1xuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLm9mZnNldCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5lbGVtZW50Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgdmFyIGRvY3VtZW50RWxlbWVudCA9IHRoaXMuZWxlbWVudC5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxuICAgIHZhciB3aW4gPSBnZXRXaW5kb3codGhpcy5lbGVtZW50Lm93bmVyRG9jdW1lbnQpXG4gICAgdmFyIHJlY3QgPSB7XG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICAgIHJlY3QgPSB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiByZWN0LnRvcCArIHdpbi5wYWdlWU9mZnNldCAtIGRvY3VtZW50RWxlbWVudC5jbGllbnRUb3AsXG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyB3aW4ucGFnZVhPZmZzZXQgLSBkb2N1bWVudEVsZW1lbnQuY2xpZW50TGVmdFxuICAgIH1cbiAgfVxuXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudCwgaGFuZGxlcikge1xuICAgIHZhciBldmVudFBhcnRzID0gZXZlbnQuc3BsaXQoJy4nKVxuICAgIHZhciBldmVudFR5cGUgPSBldmVudFBhcnRzWzBdXG4gICAgdmFyIG5hbWVzcGFjZSA9IGV2ZW50UGFydHNbMV0gfHwgJ19fZGVmYXVsdCdcbiAgICB2YXIgbnNIYW5kbGVycyA9IHRoaXMuaGFuZGxlcnNbbmFtZXNwYWNlXSA9IHRoaXMuaGFuZGxlcnNbbmFtZXNwYWNlXSB8fCB7fVxuICAgIHZhciBuc1R5cGVMaXN0ID0gbnNIYW5kbGVyc1tldmVudFR5cGVdID0gbnNIYW5kbGVyc1tldmVudFR5cGVdIHx8IFtdXG5cbiAgICBuc1R5cGVMaXN0LnB1c2goaGFuZGxlcilcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIpXG4gIH1cblxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLm91dGVySGVpZ2h0ID0gZnVuY3Rpb24oaW5jbHVkZU1hcmdpbikge1xuICAgIHZhciBoZWlnaHQgPSB0aGlzLmlubmVySGVpZ2h0KClcbiAgICB2YXIgY29tcHV0ZWRTdHlsZVxuXG4gICAgaWYgKGluY2x1ZGVNYXJnaW4gJiYgIWlzV2luZG93KHRoaXMuZWxlbWVudCkpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpXG4gICAgICBoZWlnaHQgKz0gcGFyc2VJbnQoY29tcHV0ZWRTdHlsZS5tYXJnaW5Ub3AsIDEwKVxuICAgICAgaGVpZ2h0ICs9IHBhcnNlSW50KGNvbXB1dGVkU3R5bGUubWFyZ2luQm90dG9tLCAxMClcbiAgICB9XG5cbiAgICByZXR1cm4gaGVpZ2h0XG4gIH1cblxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLm91dGVyV2lkdGggPSBmdW5jdGlvbihpbmNsdWRlTWFyZ2luKSB7XG4gICAgdmFyIHdpZHRoID0gdGhpcy5pbm5lcldpZHRoKClcbiAgICB2YXIgY29tcHV0ZWRTdHlsZVxuXG4gICAgaWYgKGluY2x1ZGVNYXJnaW4gJiYgIWlzV2luZG93KHRoaXMuZWxlbWVudCkpIHtcbiAgICAgIGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpXG4gICAgICB3aWR0aCArPSBwYXJzZUludChjb21wdXRlZFN0eWxlLm1hcmdpbkxlZnQsIDEwKVxuICAgICAgd2lkdGggKz0gcGFyc2VJbnQoY29tcHV0ZWRTdHlsZS5tYXJnaW5SaWdodCwgMTApXG4gICAgfVxuXG4gICAgcmV0dXJuIHdpZHRoXG4gIH1cblxuICBOb0ZyYW1ld29ya0FkYXB0ZXIucHJvdG90eXBlLnNjcm9sbExlZnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgd2luID0gZ2V0V2luZG93KHRoaXMuZWxlbWVudClcbiAgICByZXR1cm4gd2luID8gd2luLnBhZ2VYT2Zmc2V0IDogdGhpcy5lbGVtZW50LnNjcm9sbExlZnRcbiAgfVxuXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5wcm90b3R5cGUuc2Nyb2xsVG9wID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHdpbiA9IGdldFdpbmRvdyh0aGlzLmVsZW1lbnQpXG4gICAgcmV0dXJuIHdpbiA/IHdpbi5wYWdlWU9mZnNldCA6IHRoaXMuZWxlbWVudC5zY3JvbGxUb3BcbiAgfVxuXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5leHRlbmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcblxuICAgIGZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgb2JqKSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBvYmpba2V5XVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFyZ2V0XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDEsIGVuZCA9IGFyZ3MubGVuZ3RoOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIG1lcmdlKGFyZ3NbMF0sIGFyZ3NbaV0pXG4gICAgfVxuICAgIHJldHVybiBhcmdzWzBdXG4gIH1cblxuICBOb0ZyYW1ld29ya0FkYXB0ZXIuaW5BcnJheSA9IGZ1bmN0aW9uKGVsZW1lbnQsIGFycmF5LCBpKSB7XG4gICAgcmV0dXJuIGFycmF5ID09IG51bGwgPyAtMSA6IGFycmF5LmluZGV4T2YoZWxlbWVudCwgaSlcbiAgfVxuXG4gIE5vRnJhbWV3b3JrQWRhcHRlci5pc0VtcHR5T2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiAwICovXG4gICAgZm9yICh2YXIgbmFtZSBpbiBvYmopIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgV2F5cG9pbnQuYWRhcHRlcnMucHVzaCh7XG4gICAgbmFtZTogJ25vZnJhbWV3b3JrJyxcbiAgICBBZGFwdGVyOiBOb0ZyYW1ld29ya0FkYXB0ZXJcbiAgfSlcbiAgV2F5cG9pbnQuQWRhcHRlciA9IE5vRnJhbWV3b3JrQWRhcHRlclxufSgpKVxuO1xuLyohXG5XYXlwb2ludHMgSW52aWV3IFNob3J0Y3V0IC0gNC4wLjBcbkNvcHlyaWdodCDCqSAyMDExLTIwMTUgQ2FsZWIgVHJvdWdodG9uXG5MaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5odHRwczovL2dpdGh1Yi5jb20vaW1ha2V3ZWJ0aGluZ3Mvd2F5cG9pbnRzL2Jsb2IvbWFzdGVyL2xpY2Vuc2VzLnR4dFxuKi9cbihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnXG5cbiAgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbiAgdmFyIFdheXBvaW50ID0gd2luZG93LldheXBvaW50XG5cbiAgLyogaHR0cDovL2ltYWtld2VidGhpbmdzLmNvbS93YXlwb2ludHMvc2hvcnRjdXRzL2ludmlldyAqL1xuICBmdW5jdGlvbiBJbnZpZXcob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IFdheXBvaW50LkFkYXB0ZXIuZXh0ZW5kKHt9LCBJbnZpZXcuZGVmYXVsdHMsIG9wdGlvbnMpXG4gICAgdGhpcy5heGlzID0gdGhpcy5vcHRpb25zLmhvcml6b250YWwgPyAnaG9yaXpvbnRhbCcgOiAndmVydGljYWwnXG4gICAgdGhpcy53YXlwb2ludHMgPSBbXVxuICAgIHRoaXMuZWxlbWVudCA9IHRoaXMub3B0aW9ucy5lbGVtZW50XG4gICAgdGhpcy5jcmVhdGVXYXlwb2ludHMoKVxuICB9XG5cbiAgLyogUHJpdmF0ZSAqL1xuICBJbnZpZXcucHJvdG90eXBlLmNyZWF0ZVdheXBvaW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb25maWdzID0ge1xuICAgICAgdmVydGljYWw6IFt7XG4gICAgICAgIGRvd246ICdlbnRlcicsXG4gICAgICAgIHVwOiAnZXhpdGVkJyxcbiAgICAgICAgb2Zmc2V0OiAnMTAwJSdcbiAgICAgIH0sIHtcbiAgICAgICAgZG93bjogJ2VudGVyZWQnLFxuICAgICAgICB1cDogJ2V4aXQnLFxuICAgICAgICBvZmZzZXQ6ICdib3R0b20taW4tdmlldydcbiAgICAgIH0sIHtcbiAgICAgICAgZG93bjogJ2V4aXQnLFxuICAgICAgICB1cDogJ2VudGVyZWQnLFxuICAgICAgICBvZmZzZXQ6IDBcbiAgICAgIH0sIHtcbiAgICAgICAgZG93bjogJ2V4aXRlZCcsXG4gICAgICAgIHVwOiAnZW50ZXInLFxuICAgICAgICBvZmZzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiAtdGhpcy5hZGFwdGVyLm91dGVySGVpZ2h0KClcbiAgICAgICAgfVxuICAgICAgfV0sXG4gICAgICBob3Jpem9udGFsOiBbe1xuICAgICAgICByaWdodDogJ2VudGVyJyxcbiAgICAgICAgbGVmdDogJ2V4aXRlZCcsXG4gICAgICAgIG9mZnNldDogJzEwMCUnXG4gICAgICB9LCB7XG4gICAgICAgIHJpZ2h0OiAnZW50ZXJlZCcsXG4gICAgICAgIGxlZnQ6ICdleGl0JyxcbiAgICAgICAgb2Zmc2V0OiAncmlnaHQtaW4tdmlldydcbiAgICAgIH0sIHtcbiAgICAgICAgcmlnaHQ6ICdleGl0JyxcbiAgICAgICAgbGVmdDogJ2VudGVyZWQnLFxuICAgICAgICBvZmZzZXQ6IDBcbiAgICAgIH0sIHtcbiAgICAgICAgcmlnaHQ6ICdleGl0ZWQnLFxuICAgICAgICBsZWZ0OiAnZW50ZXInLFxuICAgICAgICBvZmZzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiAtdGhpcy5hZGFwdGVyLm91dGVyV2lkdGgoKVxuICAgICAgICB9XG4gICAgICB9XVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSBjb25maWdzW3RoaXMuYXhpc10ubGVuZ3RoOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHZhciBjb25maWcgPSBjb25maWdzW3RoaXMuYXhpc11baV1cbiAgICAgIHRoaXMuY3JlYXRlV2F5cG9pbnQoY29uZmlnKVxuICAgIH1cbiAgfVxuXG4gIC8qIFByaXZhdGUgKi9cbiAgSW52aWV3LnByb3RvdHlwZS5jcmVhdGVXYXlwb2ludCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBzZWxmID0gdGhpc1xuICAgIHRoaXMud2F5cG9pbnRzLnB1c2gobmV3IFdheXBvaW50KHtcbiAgICAgIGNvbnRleHQ6IHRoaXMub3B0aW9ucy5jb250ZXh0LFxuICAgICAgZWxlbWVudDogdGhpcy5vcHRpb25zLmVsZW1lbnQsXG4gICAgICBlbmFibGVkOiB0aGlzLm9wdGlvbnMuZW5hYmxlZCxcbiAgICAgIGhhbmRsZXI6IChmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRpcmVjdGlvbikge1xuICAgICAgICAgIHNlbGYub3B0aW9uc1tjb25maWdbZGlyZWN0aW9uXV0uY2FsbChzZWxmLCBkaXJlY3Rpb24pXG4gICAgICAgIH1cbiAgICAgIH0oY29uZmlnKSksXG4gICAgICBvZmZzZXQ6IGNvbmZpZy5vZmZzZXQsXG4gICAgICBob3Jpem9udGFsOiB0aGlzLm9wdGlvbnMuaG9yaXpvbnRhbFxuICAgIH0pKVxuICB9XG5cbiAgLyogUHVibGljICovXG4gIEludmlldy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSB0aGlzLndheXBvaW50cy5sZW5ndGg7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpcy53YXlwb2ludHNbaV0uZGVzdHJveSgpXG4gICAgfVxuICAgIHRoaXMud2F5cG9pbnRzID0gW11cbiAgfVxuXG4gIEludmlldy5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBlbmQgPSB0aGlzLndheXBvaW50cy5sZW5ndGg7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpcy53YXlwb2ludHNbaV0uZGlzYWJsZSgpXG4gICAgfVxuICB9XG5cbiAgSW52aWV3LnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZW5kID0gdGhpcy53YXlwb2ludHMubGVuZ3RoOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXMud2F5cG9pbnRzW2ldLmVuYWJsZSgpXG4gICAgfVxuICB9XG5cbiAgSW52aWV3LmRlZmF1bHRzID0ge1xuICAgIGNvbnRleHQ6IHdpbmRvdyxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGVudGVyOiBub29wLFxuICAgIGVudGVyZWQ6IG5vb3AsXG4gICAgZXhpdDogbm9vcCxcbiAgICBleGl0ZWQ6IG5vb3BcbiAgfVxuXG4gIFdheXBvaW50LkludmlldyA9IEludmlld1xufSgpKVxuO1xuIiwiLyoqXG4gKiBaZW5zY3JvbGwgMy4wLjFcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS96ZW5nYWJvci96ZW5zY3JvbGwvXG4gKlxuICogQ29weXJpZ2h0IDIwMTXigJMyMDE2IEdhYm9yIExlbmFyZFxuICpcbiAqIFRoaXMgaXMgZnJlZSBhbmQgdW5lbmN1bWJlcmVkIHNvZnR3YXJlIHJlbGVhc2VkIGludG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKlxuICogQW55b25lIGlzIGZyZWUgdG8gY29weSwgbW9kaWZ5LCBwdWJsaXNoLCB1c2UsIGNvbXBpbGUsIHNlbGwsIG9yXG4gKiBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUsIGVpdGhlciBpbiBzb3VyY2UgY29kZSBmb3JtIG9yIGFzIGEgY29tcGlsZWRcbiAqIGJpbmFyeSwgZm9yIGFueSBwdXJwb3NlLCBjb21tZXJjaWFsIG9yIG5vbi1jb21tZXJjaWFsLCBhbmQgYnkgYW55XG4gKiBtZWFucy5cbiAqXG4gKiBJbiBqdXJpc2RpY3Rpb25zIHRoYXQgcmVjb2duaXplIGNvcHlyaWdodCBsYXdzLCB0aGUgYXV0aG9yIG9yIGF1dGhvcnNcbiAqIG9mIHRoaXMgc29mdHdhcmUgZGVkaWNhdGUgYW55IGFuZCBhbGwgY29weXJpZ2h0IGludGVyZXN0IGluIHRoZVxuICogc29mdHdhcmUgdG8gdGhlIHB1YmxpYyBkb21haW4uIFdlIG1ha2UgdGhpcyBkZWRpY2F0aW9uIGZvciB0aGUgYmVuZWZpdFxuICogb2YgdGhlIHB1YmxpYyBhdCBsYXJnZSBhbmQgdG8gdGhlIGRldHJpbWVudCBvZiBvdXIgaGVpcnMgYW5kXG4gKiBzdWNjZXNzb3JzLiBXZSBpbnRlbmQgdGhpcyBkZWRpY2F0aW9uIHRvIGJlIGFuIG92ZXJ0IGFjdCBvZlxuICogcmVsaW5xdWlzaG1lbnQgaW4gcGVycGV0dWl0eSBvZiBhbGwgcHJlc2VudCBhbmQgZnV0dXJlIHJpZ2h0cyB0byB0aGlzXG4gKiBzb2Z0d2FyZSB1bmRlciBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gKiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0ZcbiAqIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC5cbiAqIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SXG4gKiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSxcbiAqIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUlxuICogT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuICpcbiAqIEZvciBtb3JlIGluZm9ybWF0aW9uLCBwbGVhc2UgcmVmZXIgdG8gPGh0dHA6Ly91bmxpY2Vuc2Uub3JnPlxuICpcbiAqL1xuXG4vKmpzaGludCBkZXZlbDp0cnVlLCBhc2k6dHJ1ZSAqL1xuXG4vKmdsb2JhbCBkZWZpbmUsIG1vZHVsZSAqL1xuXG5cbihmdW5jdGlvbiAocm9vdCwgemVuc2Nyb2xsKSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgemVuc2Nyb2xsKCkpXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gemVuc2Nyb2xsKClcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LnplbnNjcm9sbCA9IHplbnNjcm9sbCgpXG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCJcblxuICAgIHZhciBjcmVhdGVTY3JvbGxlciA9IGZ1bmN0aW9uIChzY3JvbGxDb250YWluZXIsIGRlZmF1bHREdXJhdGlvbiwgZWRnZU9mZnNldCkge1xuXG4gICAgICAgIGRlZmF1bHREdXJhdGlvbiA9IGRlZmF1bHREdXJhdGlvbiB8fCA5OTkgLy9tc1xuICAgICAgICBpZiAoIWVkZ2VPZmZzZXQgfHwgZWRnZU9mZnNldCAhPT0gMCkge1xuICAgICAgICAgICAgLy8gV2hlbiBzY3JvbGxpbmcsIHRoaXMgYW1vdW50IG9mIGRpc3RhbmNlIGlzIGtlcHQgZnJvbSB0aGUgZWRnZXMgb2YgdGhlIHNjcm9sbENvbnRhaW5lcjpcbiAgICAgICAgICAgIGVkZ2VPZmZzZXQgPSA5IC8vcHhcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzY3JvbGxUaW1lb3V0SWRcbiAgICAgICAgdmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcblxuICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIGJyb3dzZXIgYWxyZWFkeSBzdXBwb3J0cyBuYXRpdmUgc21vb3RoIHNjcm9sbGluZyAoZS5nLiwgRmlyZWZveCAzNisgYW5kIENocm9tZSA0OSspIGFuZCBpdCBpcyBlbmFibGVkOlxuICAgICAgICB2YXIgbmF0aXZlU21vb3RoU2Nyb2xsRW5hYmxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAoXCJnZXRDb21wdXRlZFN0eWxlXCIgaW4gd2luZG93KSAmJlxuICAgICAgICAgICAgICAgIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHNjcm9sbENvbnRhaW5lciA/IHNjcm9sbENvbnRhaW5lciA6IGRvY3VtZW50LmJvZHkpW1wic2Nyb2xsLWJlaGF2aW9yXCJdID09PSBcInNtb290aFwiXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ2V0U2Nyb2xsVG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNjcm9sbENvbnRhaW5lciA/IHNjcm9sbENvbnRhaW5lci5zY3JvbGxUb3AgOiAod2luZG93LnNjcm9sbFkgfHwgZG9jRWxlbS5zY3JvbGxUb3ApXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ2V0Vmlld0hlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzY3JvbGxDb250YWluZXIgP1xuICAgICAgICAgICAgICAgIE1hdGgubWluKHNjcm9sbENvbnRhaW5lci5vZmZzZXRIZWlnaHQsIHdpbmRvdy5pbm5lckhlaWdodCkgOlxuICAgICAgICAgICAgICAgIHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2NFbGVtLmNsaWVudEhlaWdodFxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGdldFJlbGF0aXZlVG9wT2YgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICAgICAgaWYgKHNjcm9sbENvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtLm9mZnNldFRvcCAtIHNjcm9sbENvbnRhaW5lci5vZmZzZXRUb3BcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICsgZ2V0U2Nyb2xsVG9wKCkgLSBkb2NFbGVtLm9mZnNldFRvcFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEltbWVkaWF0ZWx5IHN0b3BzIHRoZSBjdXJyZW50IHNtb290aCBzY3JvbGwgb3BlcmF0aW9uXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgc3RvcFNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChzY3JvbGxUaW1lb3V0SWQpXG4gICAgICAgICAgICBzY3JvbGxUaW1lb3V0SWQgPSAwXG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2Nyb2xscyB0byBhIHNwZWNpZmljIHZlcnRpY2FsIHBvc2l0aW9uIGluIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtlbmRZfSBUaGUgdmVydGljYWwgcG9zaXRpb24gd2l0aGluIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtkdXJhdGlvbn0gT3B0aW9uYWxseSB0aGUgZHVyYXRpb24gb2YgdGhlIHNjcm9sbCBvcGVyYXRpb24uXG4gICAgICAgICAqICAgICAgICBJZiAwIG9yIG5vdCBwcm92aWRlZCBpdCBpcyBhdXRvbWF0aWNhbGx5IGNhbGN1bGF0ZWQgYmFzZWQgb24gdGhlXG4gICAgICAgICAqICAgICAgICBkaXN0YW5jZSBhbmQgdGhlIGRlZmF1bHQgZHVyYXRpb24uXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgc2Nyb2xsVG9ZID0gZnVuY3Rpb24gKGVuZFksIGR1cmF0aW9uKSB7XG4gICAgICAgICAgICBzdG9wU2Nyb2xsKClcbiAgICAgICAgICAgIGlmIChuYXRpdmVTbW9vdGhTY3JvbGxFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICAoc2Nyb2xsQ29udGFpbmVyIHx8IHdpbmRvdykuc2Nyb2xsVG8oMCwgZW5kWSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0WSA9IGdldFNjcm9sbFRvcCgpXG4gICAgICAgICAgICAgICAgdmFyIGRpc3RhbmNlID0gTWF0aC5tYXgoZW5kWSwwKSAtIHN0YXJ0WVxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgTWF0aC5taW4oTWF0aC5hYnMoZGlzdGFuY2UpLCBkZWZhdWx0RHVyYXRpb24pXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgIChmdW5jdGlvbiBsb29wU2Nyb2xsKCkge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gTWF0aC5taW4oKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSAvIGR1cmF0aW9uLCAxKSAvLyBwZXJjZW50YWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IE1hdGgubWF4KE1hdGguZmxvb3Ioc3RhcnRZICsgZGlzdGFuY2UqKHAgPCAwLjUgPyAyKnAqcCA6IHAqKDQgLSBwKjIpLTEpKSwgMClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY3JvbGxDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wID0geVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgeSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwIDwgMSAmJiAoZ2V0Vmlld0hlaWdodCgpICsgeSkgPCAoc2Nyb2xsQ29udGFpbmVyIHx8IGRvY0VsZW0pLnNjcm9sbEhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvb3BTY3JvbGwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHN0b3BTY3JvbGwsIDk5KSAvLyB3aXRoIGNvb2xkb3duIHRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgOSlcbiAgICAgICAgICAgICAgICB9KSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2Nyb2xscyB0byB0aGUgdG9wIG9mIGEgc3BlY2lmaWMgZWxlbWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtlbGVtfSBUaGUgZWxlbWVudC5cbiAgICAgICAgICogQHBhcmFtIHtkdXJhdGlvbn0gT3B0aW9uYWxseSB0aGUgZHVyYXRpb24gb2YgdGhlIHNjcm9sbCBvcGVyYXRpb24uXG4gICAgICAgICAqICAgICAgICBBIHZhbHVlIG9mIDAgaXMgaWdub3JlZC5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBzY3JvbGxUb0VsZW0gPSBmdW5jdGlvbiAoZWxlbSwgZHVyYXRpb24pIHtcbiAgICAgICAgICAgIHNjcm9sbFRvWShnZXRSZWxhdGl2ZVRvcE9mKGVsZW0pIC0gZWRnZU9mZnNldCwgZHVyYXRpb24pXG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2Nyb2xscyBhbiBlbGVtZW50IGludG8gdmlldyBpZiBuZWNlc3NhcnkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7ZWxlbX0gVGhlIGVsZW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7ZHVyYXRpb259IE9wdGlvbmFsbHkgdGhlIGR1cmF0aW9uIG9mIHRoZSBzY3JvbGwgb3BlcmF0aW9uLlxuICAgICAgICAgKiAgICAgICAgQSB2YWx1ZSBvZiAwIGlzIGlnbm9yZWQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgc2Nyb2xsSW50b1ZpZXcgPSBmdW5jdGlvbiAoZWxlbSwgZHVyYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBlbGVtU2Nyb2xsSGVpZ2h0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQgKyAyKmVkZ2VPZmZzZXRcbiAgICAgICAgICAgIHZhciB2SGVpZ2h0ID0gZ2V0Vmlld0hlaWdodCgpXG4gICAgICAgICAgICB2YXIgZWxlbVRvcCA9IGdldFJlbGF0aXZlVG9wT2YoZWxlbSlcbiAgICAgICAgICAgIHZhciBlbGVtQm90dG9tID0gZWxlbVRvcCArIGVsZW1TY3JvbGxIZWlnaHRcbiAgICAgICAgICAgIHZhciBzY3JvbGxUb3AgPSBnZXRTY3JvbGxUb3AoKVxuICAgICAgICAgICAgaWYgKChlbGVtVG9wIC0gc2Nyb2xsVG9wKSA8IGVkZ2VPZmZzZXQgfHwgZWxlbVNjcm9sbEhlaWdodCA+IHZIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAvLyBFbGVtZW50IGlzIGNsaXBwZWQgYXQgdG9wIG9yIGlzIGhpZ2hlciB0aGFuIHNjcmVlbi5cbiAgICAgICAgICAgICAgICBzY3JvbGxUb0VsZW0oZWxlbSwgZHVyYXRpb24pXG4gICAgICAgICAgICB9IGVsc2UgaWYgKChzY3JvbGxUb3AgKyB2SGVpZ2h0IC0gZWxlbUJvdHRvbSkgPCBlZGdlT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgLy8gRWxlbWVudCBpcyBjbGlwcGVkIGF0IHRoZSBib3R0b20uXG4gICAgICAgICAgICAgICAgc2Nyb2xsVG9ZKGVsZW1Cb3R0b20gLSB2SGVpZ2h0LCBkdXJhdGlvbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTY3JvbGxzIHRvIHRoZSBjZW50ZXIgb2YgYW4gZWxlbWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtlbGVtfSBUaGUgZWxlbWVudC5cbiAgICAgICAgICogQHBhcmFtIHtkdXJhdGlvbn0gT3B0aW9uYWxseSB0aGUgZHVyYXRpb24gb2YgdGhlIHNjcm9sbCBvcGVyYXRpb24uXG4gICAgICAgICAqIEBwYXJhbSB7b2Zmc2V0fSBPcHRpb25hbGx5IHRoZSBvZmZzZXQgb2YgdGhlIHRvcCBvZiB0aGUgZWxlbWVudCBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIHNjcmVlbi5cbiAgICAgICAgICogICAgICAgIEEgdmFsdWUgb2YgMCBpcyBpZ25vcmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHNjcm9sbFRvQ2VudGVyT2YgPSBmdW5jdGlvbiAoZWxlbSwgZHVyYXRpb24sIG9mZnNldCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9ZKFxuICAgICAgICAgICAgICAgIE1hdGgubWF4KFxuICAgICAgICAgICAgICAgICAgICBnZXRSZWxhdGl2ZVRvcE9mKGVsZW0pIC0gZ2V0Vmlld0hlaWdodCgpLzIgKyAob2Zmc2V0IHx8IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0LzIpLFxuICAgICAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvblxuICAgICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENoYW5nZXMgZGVmYXVsdCBzZXR0aW5ncyBmb3IgdGhpcyBzY3JvbGxlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtuZXdEZWZhdWx0RHVyYXRpb259IE5ldyB2YWx1ZSBmb3IgZGVmYXVsdCBkdXJhdGlvbiwgdXNlZCBmb3IgZWFjaCBzY3JvbGwgbWV0aG9kIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqICAgICAgICBJZ25vcmVkIGlmIDAgb3IgZmFsc3kuXG4gICAgICAgICAqIEBwYXJhbSB7bmV3RWRnZU9mZnNldH0gTmV3IHZhbHVlIGZvciB0aGUgZWRnZSBvZmZzZXQsIHVzZWQgYnkgZWFjaCBzY3JvbGwgbWV0aG9kIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgc2V0dXAgPSBmdW5jdGlvbiAobmV3RGVmYXVsdER1cmF0aW9uLCBuZXdFZGdlT2Zmc2V0KSB7XG4gICAgICAgICAgICBpZiAobmV3RGVmYXVsdER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdER1cmF0aW9uID0gbmV3RGVmYXVsdER1cmF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmV3RWRnZU9mZnNldCA9PT0gMCB8fCBuZXdFZGdlT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgZWRnZU9mZnNldCA9IG5ld0VkZ2VPZmZzZXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXR1cDogc2V0dXAsXG4gICAgICAgICAgICB0bzogc2Nyb2xsVG9FbGVtLFxuICAgICAgICAgICAgdG9ZOiBzY3JvbGxUb1ksXG4gICAgICAgICAgICBpbnRvVmlldzogc2Nyb2xsSW50b1ZpZXcsXG4gICAgICAgICAgICBjZW50ZXI6IHNjcm9sbFRvQ2VudGVyT2YsXG4gICAgICAgICAgICBzdG9wOiBzdG9wU2Nyb2xsLFxuICAgICAgICAgICAgbW92aW5nOiBmdW5jdGlvbiAoKSB7IHJldHVybiAhIXNjcm9sbFRpbWVvdXRJZCB9XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhIHNjcm9sbGVyIGZvciB0aGUgYnJvd3NlciB3aW5kb3csIG9taXR0aW5nIHBhcmFtZXRlcnM6XG4gICAgdmFyIGRlZmF1bHRTY3JvbGxlciA9IGNyZWF0ZVNjcm9sbGVyKClcblxuICAgIC8vIENyZWF0ZSBsaXN0ZW5lcnMgZm9yIHRoZSBkb2N1bWVudEVsZW1lbnQgb25seSAmIGV4Y2x1ZGUgSUU4LVxuICAgIGlmIChcImFkZEV2ZW50TGlzdGVuZXJcIiBpbiB3aW5kb3cgJiYgZG9jdW1lbnQuYm9keS5zdHlsZS5zY3JvbGxCZWhhdmlvciAhPT0gXCJzbW9vdGhcIiAmJiAhd2luZG93Lm5vWmVuc21vb3RoKSB7XG4gICAgICAgIHZhciByZXBsYWNlVXJsID0gZnVuY3Rpb24gKGhhc2gpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIFwiXCIsIHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiI1wiKVswXSArIGhhc2gpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gVG8gYXZvaWQgdGhlIFNlY3VyaXR5IGV4Y2VwdGlvbiBpbiBDaHJvbWUgd2hlbiB0aGUgcGFnZSB3YXMgb3BlbmVkIHZpYSB0aGUgZmlsZSBwcm90b2NvbCwgZS5nLiwgZmlsZTovL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdmFyIGFuY2hvciA9IGV2ZW50LnRhcmdldFxuICAgICAgICAgICAgd2hpbGUgKGFuY2hvciAmJiBhbmNob3IudGFnTmFtZSAhPT0gXCJBXCIpIHtcbiAgICAgICAgICAgICAgICBhbmNob3IgPSBhbmNob3IucGFyZW50Tm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFhbmNob3IgfHwgZXZlbnQud2hpY2ggIT09IDEgfHwgZXZlbnQuc2hpZnRLZXkgfHwgZXZlbnQubWV0YUtleSB8fCBldmVudC5jdHJsS2V5IHx8IGV2ZW50LmFsdEtleSkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGhyZWYgPSBhbmNob3IuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSB8fCBcIlwiXG4gICAgICAgICAgICBpZiAoaHJlZi5pbmRleE9mKFwiI1wiKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChocmVmID09PSBcIiNcIikge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpIC8vIFByZXZlbnQgdGhlIGJyb3dzZXIgZnJvbSBoYW5kbGluZyB0aGUgYWN0aXZhdGlvbiBvZiB0aGUgbGlua1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0U2Nyb2xsZXIudG9ZKDApXG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2VVcmwoXCJcIilcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SWQgPSBhbmNob3IuaGFzaC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldEVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0YXJnZXRJZClcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldEVsZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCkgLy8gUHJldmVudCB0aGUgYnJvd3NlciBmcm9tIGhhbmRsaW5nIHRoZSBhY3RpdmF0aW9uIG9mIHRoZSBsaW5rXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0U2Nyb2xsZXIudG8odGFyZ2V0RWxlbSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxhY2VVcmwoXCIjXCIgKyB0YXJnZXRJZClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZmFsc2UpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gRXhwb3NlIHRoZSBcImNvbnN0cnVjdG9yXCIgdGhhdCBjYW4gY3JlYXRlIGEgbmV3IHNjcm9sbGVyOlxuICAgICAgICBjcmVhdGVTY3JvbGxlcjogY3JlYXRlU2Nyb2xsZXIsXG4gICAgICAgIC8vIFN1cmZhY2UgdGhlIG1ldGhvZHMgb2YgdGhlIGRlZmF1bHQgc2Nyb2xsZXI6XG4gICAgICAgIHNldHVwOiBkZWZhdWx0U2Nyb2xsZXIuc2V0dXAsXG4gICAgICAgIHRvOiBkZWZhdWx0U2Nyb2xsZXIudG8sXG4gICAgICAgIHRvWTogZGVmYXVsdFNjcm9sbGVyLnRvWSxcbiAgICAgICAgaW50b1ZpZXc6IGRlZmF1bHRTY3JvbGxlci5pbnRvVmlldyxcbiAgICAgICAgY2VudGVyOiBkZWZhdWx0U2Nyb2xsZXIuY2VudGVyLFxuICAgICAgICBzdG9wOiBkZWZhdWx0U2Nyb2xsZXIuc3RvcCxcbiAgICAgICAgbW92aW5nOiBkZWZhdWx0U2Nyb2xsZXIubW92aW5nXG4gICAgfVxuXG59KSk7XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBQcmltYXJ5TmF2KCkge1xuXG4gICAgLy8gY2FjaGUgZG9tIGVsZW1lbnRzXG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5LFxuICAgICAgICBuYXZUcmlnZ2VyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5qcy1uYXYtdHJpZ2dlclwiKSxcbiAgICAgICAgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5jb250YWluZXJcIiksXG4gICAgICAgIHByaW1hcnlOYXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmpzLXByaW1hcnktbmF2XCIpLFxuICAgICAgICBwcmltYXJ5TmF2TGlua3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmpzLXByaW1hcnktbmF2IGFcIik7XG5cbiAgICAvLyBGbGFnIHRoYXQgSlMgaGFzIGxvYWRlZFxuICAgIGJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm5vLWpzXCIpO1xuICAgIGJvZHkuY2xhc3NMaXN0LmFkZChcImpzXCIpO1xuXG4gICAgLy8gSGFtYnVyZ2VyIG1lbnVcbiAgICBuYXZUcmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpe1xuICAgICAgICAvLyB0b2dnbGUgYWN0aXZlIGNsYXNzIG9uIHRoZSBuYXYgdHJpZ2dlclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC50b2dnbGUoXCJvcGVuXCIpO1xuICAgICAgICAvLyB0b2dnbGUgdGhlIGFjdGl2ZSBjbGFzcyBvbiBzaXRlIGNvbnRhaW5lclxuICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnRvZ2dsZShcImpzLW5hdi1hY3RpdmVcIik7XG4gICAgfSk7XG5cbiAgICAvLyBJbi1tZW51IGxpbmsgY2xpY2tcbiAgICBmb3IodmFyIGk9MDsgaSA8IHByaW1hcnlOYXZMaW5rcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgIHZhciBwcmltYXJ5TmF2TGluayA9IHByaW1hcnlOYXZMaW5rc1tpXTtcbiAgICAgICAgcHJpbWFyeU5hdkxpbmsub25jbGljayA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyB0b2dnbGUgYWN0aXZlIGNsYXNzIG9uIHRoZSBuYXYgdHJpZ2dlclxuICAgICAgICAgICAgbmF2VHJpZ2dlci5jbGFzc0xpc3QudG9nZ2xlKFwib3BlblwiKTtcbiAgICAgICAgICAgIC8vIGltbWVkaWF0ZWx5IGhpZGUgdGhlIG5hdlxuICAgICAgICAgICAgcHJpbWFyeU5hdi5zdHlsZS5vcGFjaXR5PSBcIjBcIjtcbiAgICAgICAgICAgIC8vIG9uY2UgZHJhd2VyIGhhcyBoYWQgdGltZSB0byBwdWxsIHVwLCByZXN0b3JlIG9wYWNpdHlcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHByaW1hcnlOYXYuc3R5bGUub3BhY2l0eT0gXCIxXCI7IH0sIDEwMDApO1xuICAgICAgICAgICAgLy8gdG9nZ2xlIHRoZSBhY3RpdmUgY2xhc3Mgb24gc2l0ZSBjb250YWluZXJcbiAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKFwianMtbmF2LWFjdGl2ZVwiKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbn07XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBUaW1lbGluZUxvYWRpbmcoKSB7XG5cbnZhciB0aW1lbGluZUJsb2NrcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2QtdGltZWxpbmUtYmxvY2tcIik7XG5cbiAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCh0aW1lbGluZUJsb2NrcywgZnVuY3Rpb24oZWwsIGkpe1xuXG4gICAgdmFyIHdheXBvaW50ID0gbmV3IFdheXBvaW50KHtcbiAgICAgIGVsZW1lbnQ6IGVsLFxuICAgICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2ZhZGVJblVwJyk7XG4gICAgICB9LFxuICAgICAgb2Zmc2V0OiAnNzUlJ1xuICAgIH0pXG5cbiAgfSk7XG59O1xuIl19
