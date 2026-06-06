const script = () => {
  const style = document.createElement('style');
  style.innerHTML = `
      html {
        -webkit-tap-highlight-color: transparent;
      }
      .debug-grid,
      .container-column {
        display: none;
      }
      [data-init-hidden],
      [data-init-loader] {
        opacity: 0;
      }
    `;
  document.head.appendChild(style);

  $.easing.exponentialEaseOut = function (t) {
    return Math.min(1, 1.001 - Math.pow(2, -10 * t));
  };
  $.fn.hasAttr = function (name) {
    return this.attr(name) !== undefined;
  };
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.defaults({
    invalidateOnRefresh: true
  });
  const xGetter = (el) => gsap.getProperty(el, 'x');
  const yGetter = (el) => gsap.getProperty(el, 'y');
  const xSetter = (el) => gsap.quickSetter(el, 'x', `px`);
  const ySetter = (el) => gsap.quickSetter(el, 'y', `px`);

  const childSelect = (parent) => {
    return (child) => child ? $(parent).find(child) : parent;
  }

  const cvUnit = (val, unit) => {
    let result;
    switch (true) {
      case unit === 'vw':
        result = window.innerWidth * (val / 100);
        break;
      case unit === 'vh':
        result = window.innerHeight * (val / 100);
        break;
      case unit === 'rem':
        result = val / 10 * parseFloat($('html').css('font-size'));
        break;
      default: break;
    }
    return result;
  }
  const viewport = {
    get w() {
      return window.innerWidth;
    },
    get h() {
      return window.innerHeight;
    },
  }
  const device = { desktop: 991, tablet: 767, mobile: 479 }
  const debounce = (func, timeout = 300) => {
    let timer

    return (...args) => {
      clearTimeout(timer)
      timer = setTimeout(() => { func.apply(this, args) }, timeout)
    }
  }
  const isInViewport = (el, orientation = 'vertical') => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (orientation == 'horizontal') {
      return (
        rect.left <= (window.innerWidth) &&
        rect.right >= 0
      );
    } else {
      return (
        rect.top <= (window.innerHeight) &&
        rect.bottom >= 0
      );
    }
  }
  const refreshOnBreakpoint = () => {
    const breakpoints = Object.values(device).sort((a, b) => a - b);
    const initialViewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const breakpoint = breakpoints.find(bp => initialViewportWidth < bp) || breakpoints[breakpoints.length - 1];
    let lastZoom = window.devicePixelRatio;
    window.addEventListener('resize', debounce(() => {
      const currentZoom = window.devicePixelRatio;
      if (Math.abs(currentZoom - lastZoom) > 0.01) {
        lastZoom = currentZoom;
        location.reload();
      }
      const newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
      if ((initialViewportWidth < breakpoint && newViewportWidth >= breakpoint) ||
        (initialViewportWidth >= breakpoint && newViewportWidth < breakpoint)) {
        location.reload();
      }
    }));
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const documentHeightObserver = (() => {
    let previousHeight = document.documentElement.scrollHeight;
    let resizeObserver;
    let debounceTimer;

    function refreshScrollTrigger() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const currentHeight = document.documentElement.scrollHeight;

        if (currentHeight !== previousHeight) {
          console.log("Document height changed. Refreshing ScrollTrigger...");
          ScrollTrigger.refresh();
          previousHeight = currentHeight;
        }
      }, 200); // Adjust the debounce delay as needed
    }

    return (action) => {
      if (action === "init") {
        console.log("Initializing document height observer...");
        resizeObserver = new ResizeObserver(refreshScrollTrigger);
        if (!isIOS) {
          resizeObserver.observe(document.documentElement);
        }
      }
      else if (action === "disconnect") {
        console.log("Disconnecting document height observer...");
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      }
    };
  })();
  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0));
  }
  const lerp = (a, b, t) => (1 - t) * a + t * b;
  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const getAllScrollTrigger = (fn) => {
    let triggers = ScrollTrigger.getAll();
    triggers.forEach(trigger => {
      if (fn === "refresh") {
        if (trigger.progress === 0) {
          trigger[fn]?.();
        }
      } else {
        trigger[fn]?.();
      }
    });
  };
  function resetScroll() {
    if (window.location.hash !== '') {
      if ($(window.location.hash).length >= 1) {
        $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);

        setTimeout(() => {
          $("html").animate({ scrollTop: $(window.location.hash).offset().top - 100 }, 1200);
        }, 300);
      } else {
        scrollTop()
      }
    } else if (window.location.search !== '') {
      let searchObj = JSON.parse('{"' + decodeURI(location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}')
      if (searchObj.sc) {
        if ($(`#${searchObj.sc}`).length >= 1) {
          let target = `#${searchObj.sc}`;
          setTimeout(() => {
            smoothScroll.scrollTo(`#${searchObj.sc}`, {
              offset: -100
            })
          }, 500);
        } else {
          scrollTop()
        }
      }
    } else {
      scrollTop()
    }
  };
  function scrollTop(onComplete) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    smoothScroll.scrollToTop({
      onComplete: () => {
        onComplete?.();
        getAllScrollTrigger("refresh");
      }
    });
  }
  class ParallaxImage {
    constructor({ el, scaleOffset = 0.1 }) {
      this.el = el;
      this.elWrap = null;
      this.scaleOffset = scaleOffset;
      this.init();
    }
    init() {
      this.elWrap = this.el.parentElement;
      this.setup();
    }
    setup() {
      const scalePercent = 100 + (this.scaleOffset * 100);
      gsap.set(this.el, {
        width: scalePercent + '%',
        height: $(this.el).hasClass('img-fill') ? scalePercent + '%' : 'auto'
      });
      this.scrub();
    }
    scrub() {
      let dist = this.el.offsetHeight - this.elWrap.offsetHeight;
      let total = this.elWrap.getBoundingClientRect().height + window.innerHeight;
      this.updateOnScroll(dist, total);
      smoothScroll.lenis.on('scroll', () => {
        this.updateOnScroll(dist, total);
      });
    }
    updateOnScroll(dist, total) {
      if (this.el) {
        if (isInViewport(this.elWrap)) {
          let percent = this.elWrap.getBoundingClientRect().bottom / total;
          gsap.quickSetter(this.el, 'y', 'px')(-dist * percent * 1.2);
          gsap.set(this.el, { scale: 1 + (percent * this.scaleOffset) });
        }
      }
    }
  }

  class Marquee {
    constructor(list, duration = 40) {
      this.list = list;
      this.duration = duration;
      this.animations = [];
      this.currentRate = 1;
    }
    setup(isReverse) {
      const cloneAmount = Math.ceil($(window).width() / this.list.width()) + 1;

      let itemClone = this.list.find('[data-marquee="item"]').clone();
      let itemWidth = this.list.find('[data-marquee="item"]').width();
      this.list.html('');
      const items = [];
      new Array(cloneAmount).fill().forEach(() => {
        let html = itemClone.clone()
        html.css('animation-duration', `${Math.ceil(itemWidth / this.duration)}s`);
        if (isReverse) {
          html.css('animation-direction', 'reverse');
        }
        html.addClass('anim-marquee');
        this.list.append(html);
        items.push(html[0]);
      });

      setTimeout(() => {
        this.animations = items.flatMap(el => el.getAnimations());
        
        gsap.ticker.add(() => {
           let velocity = smoothScroll.scroller ? smoothScroll.scroller.velocity : 0;
           
           let targetRate = 1;
           if (velocity < 0) {
               targetRate = 1 + (velocity * 0.5); 
           } else {
               targetRate = 1 + (velocity * 0.15);
           }
           targetRate = Math.max(-3, Math.min(targetRate, 3));
           
           this.currentRate = lerp(this.currentRate, targetRate, 0.08);
           
           this.animations.forEach(anim => {
             if(anim) anim.playbackRate = this.currentRate;
           });
        });
      }, 50);
    }
  }
  class SmoothScroll {
    constructor() {
      this.lenis = null;
      this.scroller = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        velocity: 0,
        direction: 0,
      };
      this.lastScroller = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        velocity: 0,
        direction: 0,
      };
    }

    init() {
      this.reInit();

      $.easing.lenisEase = function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      };

      gsap.ticker.add((time) => {
        if (this.lenis) {
          this.lenis.raf(time * 1000);
        }
      });
      gsap.ticker.lagSmoothing(0);
    }

    reInit() {
      if (this.lenis) {
        this.lenis.destroy();
      }
      this.lenis = new Lenis();
      this.lenis.on("scroll", (e) => {
        this.updateOnScroll(e);
        ScrollTrigger.update();
      });
    }
    reachedThreshold(threshold) {
      if (!threshold) return false;
      const dist = distance(
        this.scroller.scrollX,
        this.scroller.scrollY,
        this.lastScroller.scrollX,
        this.lastScroller.scrollY
      );

      if (dist > threshold) {
        this.lastScroller = { ...this.scroller };
        return true;
      }
      return false;
    }

    updateOnScroll(e) {
      this.scroller.scrollX = e.scroll;
      this.scroller.scrollY = e.scroll;
      this.scroller.velocity = e.velocity;
      this.scroller.direction = e.direction;

      if (header) {
        header.updateOnScroll(smoothScroll.lenis);
      };
    }

    start() {
      if (this.lenis) {
        this.lenis.start();
      }
      $(".body").css("overflow", "initial");
    }

    stop() {
      if (this.lenis) {
        this.lenis.stop();
      }
      $(".body").css("overflow", "hidden");
    }

    scrollTo(target, options = {}) {
      if (this.lenis) {
        this.lenis.scrollTo(target, options);
      }
    }

    scrollToTop(options = {}) {
      if (this.lenis) {
        this.lenis.scrollTo("top", { duration: .0001, immediate: true, lock: true, ...options });
      }
    }

    destroy() {
      if (this.lenis) {
        gsap.ticker.remove((time) => {
          this.lenis.raf(time * 1000);
        });
        this.lenis.destroy();
        this.lenis = null;
      }
    }
  }
  class TriggerSetup extends HTMLElement {
    constructor() {
      super();
      this.tlTrigger = null;
      this.onTrigger = () => { };
    }
    connectedCallback() {
      this.tlTrigger = gsap.timeline({
        scrollTrigger: {
          trigger: $(this).find('section'),
          start: 'top bottom+=50%',
          end: 'bottom top-=50%',
          once: true,
          onEnter: () => {
            this.onTrigger?.();
          }
        }
      });
    }
    destroy() {
      if (this.tlTrigger) {
        this.tlTrigger.kill();
        this.tlTrigger = null;
      }
    }
  }

  const smoothScroll = new SmoothScroll();
  smoothScroll.init();
  class Mouse {
    constructor() {
      this.mousePos = { x: 0, y: 0 };
      this.cacheMousePos = { ...this.mousePos };
      this.lastMousePos = { ...this.mousePos };
      this.currentSection = null;
      this.normalizeMousePos = {
        current: { x: 0.5, y: 0.5 },
        target: { x: 0.5, y: 0.5 },
      };
      this.cursorRaf = null;
      this.init();

      // Add mouse move event listener
      window.addEventListener("mousemove", (e) => {
        this.mousePos = this.getPointerPos(e);
      });
      window.addEventListener("touchmove", (e) => {
        this.mousePos = this.getPointerPos(e);
      });
    }

    init() {
      if (viewport.w > 991 && !isTouchDevice()) {
        setTimeout(() => {
          this.updateHtml();
        }, 200);
        $(".cursor").addClass("active");
        requestAnimationFrame(this.update.bind(this));
      }
    }
    updateHtml() {

    }
    getSectionAtCursor(clientX, clientY) {
      const el = document.elementFromPoint(clientX, clientY);
      if (!el) return null;
      const $el = $(el);
      const section = $el.closest("[data-section]");
      const mode = $el.closest("[data-mode]");
      return section.length ? section : (mode.length ? mode : null);
    }
    update() {
      const section = this.getSectionAtCursor(this.mousePos.x, this.mousePos.y);
      this.currentSection = section?.attr("data-section") || section?.attr("data-mode") || null;
      if (viewport.w > 991) {
        if (this.currentSection)
          $(".cursor").attr("data-color", this.currentSection);
        else $(".cursor").removeAttr("data-color");
      }
      this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.1);
      this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.1);

      this.normalizeMousePos.target.x = this.mousePos.x / window.innerWidth;
      this.normalizeMousePos.target.y = this.mousePos.y / window.innerHeight;

      if (!this.cursorRaf) {
        this.cursorRaf = requestAnimationFrame(this.lerpCursorPos.bind(this));
      }
      // this.toggleCursor();
      requestAnimationFrame(this.update.bind(this));
    }

    getPointerPos(ev) {
      if (ev.touches) {
        return {
          x: ev.touches[0].clientX,
          y: ev.touches[0].clientY,
        };
      }
      return {
        x: ev.clientX,
        y: ev.clientY,
      };
    }

    lerpCursorPos = () => {
      this.normalizeMousePos.current.x = lerp(
        this.normalizeMousePos.current.x,
        this.normalizeMousePos.target.x,
        0.1,
      );
      this.normalizeMousePos.current.y = lerp(
        this.normalizeMousePos.current.y,
        this.normalizeMousePos.target.y,
        0.1,
      );

      const delta = distance(
        this.normalizeMousePos.target.x,
        this.normalizeMousePos.current.x,
        this.normalizeMousePos.target.y,
        this.normalizeMousePos.current.y,
      );

      if (delta < 0.001 && this.cursorRaf) {
        cancelAnimationFrame(this.cursorRaf);
        this.cursorRaf = null;
        this.resetCursor();
        return;
      } else {
        this.cursorRaf = requestAnimationFrame(this.lerpCursorPos.bind(this));
        this.toggleCursor();
      }
    };

    reachedThreshold(threshold) {
      if (!threshold) return false;
      const dist = distance(
        this.mousePos.x,
        this.mousePos.y,
        this.lastMousePos.x,
        this.lastMousePos.y,
      );
      if (dist > threshold) {
        this.lastMousePos = { ...this.mousePos };
        return true;
      }
      return false;
    }
    toggleCursor() {
      let gotBtnSize = false;
      const hoverElements = $("[data-cursor]:hover");
      const bgHoverElements = $("[data-cursor-bg]:hover");
      const cursor = $(".cursor");
      const cursorInner = $(".cursor-inner");

      xSetter(cursorInner)(
        this.normalizeMousePos.current.x * window.innerWidth,
      );
      ySetter(cursorInner)(
        this.normalizeMousePos.current.y * window.innerHeight,
      );
      if (bgHoverElements.length) {
        const targetBgColor = $(bgHoverElements[bgHoverElements.length - 1]).attr("data-cursor-bg");
        if (targetBgColor !== "") {
          cursorInner.css("background-color", `var(${targetBgColor})`);
        } else {
          cursorInner.css("background-color", "");
        }
      } else {
        cursorInner.css("background-color", "");
      }
      const type = $(hoverElements[hoverElements.length - 1]).attr(
        "data-cursor",
      );
      switch (type) {
        case "drag":
          cursor.removeClass("hidden");
          cursor.addClass("on-drag");
          break;
        case "control":
          cursor.removeClass("hidden");
          cursor.addClass("on-control");
          break;
        case "video-play":
          cursor.removeClass("hidden");
          cursor.addClass("on-video-play");
          break;
        case "video-pause":
          cursor.removeClass("hidden");
          cursor.addClass("on-video-pause");
          break;
        case "footer":
          cursor.removeClass("hidden");
          cursor.addClass("on-footer");

          // Update text from data-footer-text
          const footerTarget = $(hoverElements[hoverElements.length - 1]);
          const footerText = footerTarget.attr("data-footer-text");
          if (footerText) {
            $('[data-cursor-footer="text"]').text(footerText);
          }
          break;
        case "hidden":
          cursor.addClass("hidden");
          break;
        case "txtLink":
          $(".cursor-inner").addClass("on-hover-sm");
          let targetEl;
          if (
            $("[data-cursor]:hover").attr("data-cursor-txtLink") == "parent"
          ) {
            targetEl = $("[data-cursor]:hover").parent();
          } else if (
            $("[data-cursor]:hover").attr("data-cursor-txtLink") == "child"
          ) {
            targetEl = $("[data-cursor]:hover").find(
              "[data-cursor-txtLink-child]",
            );
          } else {
            targetEl = $("[data-cursor]:hover");
          }

          this.mousePos.x =
            targetEl.get(0).getBoundingClientRect().left -
            $(".cursor-inner").width() / 2 -
            cvUnit(8, "rem");
          this.mousePos.y =
            targetEl.get(0).getBoundingClientRect().top +
            targetEl.get(0).getBoundingClientRect().height / 2;
          $(".cursor-inner").addClass("on-hover-sm");
          break;
        default:
          this.resetCursor();
          break;
      }
    }

    resetCursor() {
      const cursor = $(".cursor");
      // Reset cursor styles
      cursor.removeClass("on-drag");
      cursor.removeClass("hidden");
      cursor.removeClass("on-control");
      cursor.removeClass("on-video-play");
      cursor.removeClass("on-video-pause");
      cursor.removeClass("on-footer");
    }
  }
  const mouse = new Mouse();
  class Header {
    constructor() {
      this.el = null;
      this.isOpen = false;
    }
    init(data) {
      this.el = document.querySelector('.header');
      if (viewport.w <= 991) {
        this.toggleNav();
      }
      else {
        this.toggleDropdownDown();
      }
      this.toggleMode();
    }
    updateOnScroll(inst) {
      this.toggleHide(inst);
      this.toggleScroll(inst);
      this.toggleMode();
    }
    getCurrentSection(attribute) {
      let sections = $(attribute);
      if (sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          let rect = sections[i].getBoundingClientRect();
          if (rect.top < ($(this.el).height()) && (rect.bottom - $(this.el).height() * 0.5) > 0) {
            return $(sections[i]);
          }
        }
      }
    }
    toggleScroll(inst) {
      if (inst.scroll > $(this.el).height() * 2) $(this.el).addClass("on-scroll");
      else $(this.el).removeClass("on-scroll");
    }
    toggleHide(inst) {
      if (inst.direction == 1) {
        if (inst.scroll > ($(this.el).height() * 3)) {
          $(this.el).addClass('on-hide');
        }
      } else if (inst.direction == -1) {
        if (inst.scroll > ($(this.el).height() * 3)) {
          $(this.el).addClass("on-hide");
          $(this.el).removeClass("on-hide");
        }
      }
      else {
        $(this.el).removeClass("on-hide");
      }
    }
    toggleMode() {
      let mode = this.getCurrentSection('[data-section]')?.data('section');

      const currentClasses = $(this.el).attr('class') || '';
      const onModeClasses = currentClasses.split(' ').filter(cls => cls.startsWith('on-') && cls !== 'on-scroll' && cls !== 'on-hide' && cls !== 'on-open-nav');
      onModeClasses.forEach(cls => {
        $(this.el).removeClass(cls);
      });

      if (mode) {
        $(this.el).addClass(`on-${mode}`);
      }
    }
    toggleNav() {
      $(this.el).find('.header-toggle').on('click', this.handleClick.bind(this));
    }
    handleClick(e) {
      e.preventDefault();
      this.isOpen ? this.close() : this.open();
    }
    toggleDropdownDown() {
      const $allLinks = $(this.el).find('.header-menu-link.has-dropdown');
      let closeTimeout;

      $allLinks.on('mouseenter', (e) => {
        clearTimeout(closeTimeout);
        const $this = $(e.currentTarget);
        const $menu = $this.closest('.header-menu');
        const $links = $menu.find('.header-menu-link.has-dropdown');
        const index = $links.index($this);

        const $dropdown = $menu.find('.header-menu-dropdown-desktop');
        const $inners = $dropdown.find('.header-menu-dropdown-inner');

        if (!$this.hasClass('active')) {
          // Mở tab mới
          $links.removeClass('active');
          $this.addClass('active');

          $inners.removeClass('active');
          $inners.eq(index).addClass('active');

          $dropdown.addClass('active');
          $('.backdrop').addClass('active');
          smoothScroll.lenis.stop();
        }
      });

      const closeDropdown = () => {
        const $activeLinks = $(this.el).find('.header-menu-link.has-dropdown.active');
        if ($activeLinks.length) {
          $activeLinks.removeClass('active');
          $(this.el).find('.header-menu-dropdown-desktop').removeClass('active');
          $(this.el).find('.header-menu-dropdown-inner').removeClass('active');
          $('.backdrop').removeClass('active');
          smoothScroll.lenis.start();
        }
      };

      const handleMouseLeave = () => {
        closeTimeout = setTimeout(() => {
          closeDropdown();
        }, 200);
      };

      const handleMouseEnterDropdown = () => {
        clearTimeout(closeTimeout);
      };

      $allLinks.on('mouseleave', handleMouseLeave);

      // $allLinks.on('click', (e) => {
      //   e.preventDefault();
      // });

      const $dropdownDesktop = $(this.el).find('.header-menu-dropdown-desktop');
      $dropdownDesktop.on('mouseenter', handleMouseEnterDropdown);
      $dropdownDesktop.on('mouseleave', handleMouseLeave);

      $(this.el).find('.header-menu-link:not(.has-dropdown)').on('mouseenter', () => {
        clearTimeout(closeTimeout);
        closeDropdown();
      });

      $(document).on('click', (e) => {
        const $target = $(e.target);
        if (!$target.closest('.header-menu-link.has-dropdown').length && !$target.closest('.header-menu-dropdown-desktop').length) {
          closeDropdown();
        }
      });
    }
    open() {
      if (this.isOpen) return;
      $(this.el).addClass('on-open-nav');
      $(this.el).find('.header-toggle').addClass('active');
      this.isOpen = true;
      smoothScroll.lenis.stop();
      viewport.w <= 767 && $('.body').css('overflow', 'hidden');
    }
    close() {
      if (!this.isOpen) return;
      $(this.el).removeClass('on-open-nav');
      $(this.el).find('.header-toggle').removeClass('active');
      this.isOpen = false;
      smoothScroll.lenis.start();
      viewport.w <= 767 && $('.body').css('overflow', 'initial');
    }
  }
  const header = new Header();
  header.init();


  class Footer extends TriggerSetup {
    constructor() {
      super();
      this.onTrigger = () => {
        this.setup();
        this.animationReveal();
      }
    }
    connectedCallback() {
      requestAnimationFrame(() => {
        this.tlTrigger = gsap.timeline({
          scrollTrigger: {
            trigger: 'footer',
            start: 'top bottom+=50%',
            end: 'bottom top-=50%',
            once: true,
            invalidateOnRefresh: true,
            onEnter: () => {
              this.onTrigger?.();
            }
          }
        });
      });
    }
    setup() {
      console.log('Footer setup');
    }
    animationReveal() {
      new MasterTimeline({
        scrollTrigger: {
          trigger: '.footer-top'
        },
        allowMobile: true,
        tweenArr: [
          new FadeIn({ el: $('.footer-top-img').get(0) }),
          ...Array.from($('.footer-menu-label .label')).flatMap((el, idx) => new FadeSplitText({ el: $(el).get(0)})),
          ...Array.from($('.footer-top-link')).flatMap((el, idx) => new FadeIn({ el: $(el).get(0) })),
          ...Array.from($('.footer-menu-link-inner .txt')).flatMap((el, idx) => new FadeSplitText({ el: $(el).get(0) })),
        ],
        stagger: 0.05
      });
      new MasterTimeline({
        scrollTrigger: {
          trigger: '.footer-botom'
        },
        allowMobile: true,
        tweenArr: [
          ...Array.from($('.footer-botom-item')).flatMap((el, idx) => new FadeIn({ el: $(el).get(0), delay: 0.2 * (idx + 1) })),
        ],
      });
    }
    destroy() {
      super.destroy();
    }
  }


  const HomePage = {
    'home-hero-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home hero setup');
      }
      animationReveal() {
        new MasterTimeline({
          timeline: gsap.timeline({
            onStart: () => {
              $('[data-init-hidden]').removeAttr('data-init-hidden');
            }
          }),
          allowMobile: true,
          tweenArr: [
            new FadeIn({ el: $(this).find('.home-hero-scrolldown').get(0) }),
            ...Array.from($('.home-hero-slide-ctrl-btn')).flatMap((el, idx) => new FadeIn({ el: $(el).get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } })),
          ]
        });
      }
      interact() {
        this.initSlider();
      }
      initSlider() {
        $(this).find('[data-embla=embla]').addClass('embla__viewport');
        $(this).find('[data-embla=container]').addClass('embla__container');
        $(this).find('[data-embla=slide]').addClass('embla__slide');

        const slidesInner = $(this).find('.home-hero-slide').get(0);
        const prevBtn = $(this).find('.ctrl-btn-prev').get(0);
        const nextBtn = $(this).find('.ctrl-btn-next').get(0);

        this.emblaApi = EmblaCarousel(slidesInner, { loop: true }, [
          EmblaCarouselAutoplay({ delay: 5000, stopOnInteraction: false }),
          EmblaCarouselFade()
        ]);

        if (prevBtn && nextBtn) {
          this.prevNextButtons = new PrevNextButtons(this.emblaApi, prevBtn, nextBtn);
        }
      }
      destroy() {
        super.destroy();
      }
    },
    'home-intro-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
      }
      animationReveal() {
        this.SplitText();
        new MasterTimeline({
            scrollTrigger: {
              trigger: '.home-intro-btn'
            },
            allowMobile: true,
            tweenArr: [
              new FadeSplitText({ el: $('.home-intro-text .txt').get(0), splitType: 'lines', isDisableRevert: true}),
              new FadeIn({ el: $('.home-intro-btn').get(0), from: { y: cvUnit(10, 'rem') }, delay: 0.2 }),
              new FadeIn({ el: $('.home-intro-link').get(0), delay: 0.2})
            ]
        });
      }
      interact() {
      }
      SplitText() {
        const textSplitting = SplitText.create('.home-intro-text .txt', { type: 'words,chars' });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.home-intro',
            start: 'top top+=70%',
            end: 'bottom bottom+=35%',
            scrub: true,
          },
        })
        tl.fromTo(textSplitting.chars, { opacity: 0.2 }, { opacity: 1, ease: 'none', stagger: 0.2 })
      }
      destroy() {
        super.destroy();
      }
    },
    'home-cur-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home cur setup');
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-cur'
          },
          allowMobile: true,
          tweenArr: [
            new FadeIn({ el: $('.home-cur-tag').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } }),
            new FadeSplitText ({ el: $('.home-cur-text .heading').get(0),splitType: 'lines', delay: 0.2 }),
          ]
        });

        this.cardAnimation();

        const tlOverlap = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.home-cur'),
            start: 'top center+=10%',
            end: 'top top',
            scrub: true,
            onComplete: () => {
              this.cardAnimation();
            }
          },
        });
        tlOverlap.to('.home-intro-text-wrap', { scale: .98, autoAlpha: 0, duration: 1, ease: 'none' }, "<=0");
        tlOverlap.to('.home-intro-text-wrap', { y: 20, duration: 0.8, ease: 'none' }, "<=0.2");
      }
      interact() {
      }
      initCardContent() {
        $(this).find('.home-cur-card').each((i, card) => {
          const $card = $(card);
          const numberEl = $card.find('.home-cur-card-number .label').get(0);
          const imgEl    = $card.find('.home-cur-card-img-inner').get(0);
          const titleEl  = $card.find('.home-cur-card-title .heading').get(0);
          const desEl    = $card.find('.home-cur-card-des .txt').get(0);

          const splits = {};
          // Hide .home-cur-card-inner (not the wrapper, to avoid conflict with stack anim)
          const cardInner = $card.find('.home-cur-card-inner').get(0);
          splits.cardInner = cardInner;
          if (cardInner) gsap.set(cardInner, { autoAlpha: 0, y: cvUnit(10, 'rem') });
          if (numberEl) {
            splits.number = SplitText.create(numberEl, { type: 'lines words', mask: 'lines' });
            gsap.set(splits.number.words, { autoAlpha: 0, yPercent: 100 });
          }
          if (imgEl) {
            const borderRad = gsap.getProperty(imgEl, 'border-radius');
            splits.borderRad = borderRad;
            gsap.set(imgEl, { clipPath: `inset(20% round ${borderRad}px)`, scale: 1.4, autoAlpha: 0 });
          }
          if (titleEl) {
            splits.title = SplitText.create(titleEl, { type: 'lines words', mask: 'lines' });
            gsap.set(splits.title.words, { autoAlpha: 0, yPercent: 100 });
          }
          if (desEl) {
            splits.des = SplitText.create(desEl, { type: 'lines words', mask: 'lines' });
            gsap.set(splits.des.words, { autoAlpha: 0, yPercent: 100 });
          }
          // Store splits on the card element for reuse in animateCardContent
          $(card).data('cardSplits', splits);
        });
      }
      animateCardContent(card) {
        const $card = $(card);
        const tl = gsap.timeline();
        const imgEl    = $card.find('.home-cur-card-img-inner').get(0);
        const splits   = $card.data('cardSplits') || {};

        // Fade in .home-cur-card-inner (not card wrapper, controlled by stack anim)
        if (splits.cardInner) {
          tl.to(splits.cardInner, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', clearProps: 'all' }, 0);
        }

        if (splits.number) {
          tl.to(splits.number.words, { autoAlpha: 1, yPercent: 0, duration: 0.8, stagger: 0.02, ease: 'power2.out' }, 0);
        }
        if (imgEl) {
          const borderRad = splits.borderRad || 0;
          tl.to(imgEl, { clipPath: `inset(0% round ${borderRad}px)`, scale: 1, autoAlpha: 1, duration: 2, ease: 'expo.out' }, 0);
        }
        if (splits.title) {
          tl.to(splits.title.words, { autoAlpha: 1, yPercent: 0, duration: 0.8, stagger: 0.02, ease: 'power2.out' }, 0.1);
        }
        if (splits.des) {
          tl.to(splits.des.words, { autoAlpha: 1, yPercent: 0, duration: 0.8, stagger: 0.02, ease: 'power2.out' }, 0.2);
        }
      }
      cardAnimation() {
        const allCards = $(this).find('.home-cur-card');
        const cards = $(this).find('.home-cur-card:not(:first-child)');
        const numCards = allCards.length;
        const triggered = Array(numCards).fill(false);

        gsap.set(allCards, { transformOrigin: "top center" });

        // Pre-hide all card content before any animation
        this.initCardContent();

        // Fire card 0 content when section enters viewport (before stack starts)
        ScrollTrigger.create({
          trigger: $(this).find('.home-cur-anim'),
          start: 'top top+=70%',
          once: true,
          onEnter: () => {
            if (!triggered[0]) {
              triggered[0] = true;
              this.animateCardContent(allCards.get(0));
            }
          }
        });

        // Fire card 1 (card 2) when it enters the viewport
        ScrollTrigger.create({
          trigger: allCards.get(1),
          start: 'top top+=70%',
          once: true,
          onEnter: () => {
            if (!triggered[1]) {
              triggered[1] = true;
              this.animateCardContent(allCards.get(1));
            }
          }
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.home-cur-anim'),
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              const progress = self.progress;
              allCards.each((i, card) => {
                if (i === 0) return;
                // Fire slightly before previous card (i-1) starts stacking
                const threshold = Math.max(0, (i - 1) / (numCards - 1) - 0.1);
                if (progress >= threshold && !triggered[i]) {
                  triggered[i] = true;
                  this.animateCardContent(card);
                }
              });
            }
          },
        });

        cards.each((i, el) => {
          const targetCards = cards.slice(i);
          const previousCards = allCards.slice(0, i + 1);

          tl.to(targetCards, {
            yPercent: -(i + 1) * 90,
            ease: 'none'
          }, `step${i}`);

          tl.to(previousCards, {
            scale: "-=0.1",
            opacity: "-=0.2",
            ease: 'none'
          }, `step${i}`);
        });
      }
      destroy() {
        super.destroy();
      }
    },
    'home-ib-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home ib setup');
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-ib-text-wrap'
          },
          allowMobile: true,
          tweenArr: [
            new ScaleInset({ el: $('.home-ib-thumb-inner').get(0)}),
            new FadeIn({ el: $('.home-ib-decor img').get(0), delay: 0.6}),
            new FadeIn({ el: $('.home-ib-tag').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } }),
            new FadeSplitText({ el: $('.home-ib-text .txt').get(0), splitType: 'lines'}),
          ]
        });
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-ib-block'
          },
          allowMobile: true,
          tweenArr: [
            ...Array.from($('.home-ib-card')).flatMap((el, idx) => [
              new FadeIn({ el: $(el).find('.home-ib-card-img').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: idx * 0.25 }),
              new FadeSplitText({ el: $(el).find('.home-ib-card-title .txt').get(0), delay: idx * 0.25 }),
              new FadeSplitText({ el: $(el).find('.home-ib-card-des .txt').get(0), delay: idx * 0.25 + 0.2 }),
            ]),
            new FadeIn({ el: $('.home-ib-action').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.3 }),
          ]
        });
      }
      interact() {
      }
      destroy() {
        super.destroy();
      }
    },
    'home-video-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home video setup');
        let player;

        const initPlayer = () => {
          player = new YT.Player('ytplayer', {
            events: {
              onStateChange: onPlayerStateChange
            }
          });
        };

        if (window.YT && window.YT.Player) {
          initPlayer();
        } else {
          window.onYouTubeIframeAPIReady = initPlayer;
        }

        const thumb = $(this).find('.home-video-anim-thumb');
        const youtubeEmbed = $(this).find('.youtube-embed');

        thumb.on('click', function () {
          if (thumb.hasClass('is-play')) {
            console.log('play');
            player.playVideo();
            thumb.removeClass('is-play');
            thumb.addClass('is-pause');
          } else {
            console.log('pause');
            player.pauseVideo();
            thumb.removeClass('is-pause');
            thumb.addClass('is-play');
          }
        });

        let isPlaying = false;

        function onPlayerStateChange(event) {
          if (event.data === YT.PlayerState.PAUSED) {
            isPlaying = false;
            thumb.addClass('is-play');
            thumb.removeClass('is-pause');
            youtubeEmbed.removeAttr('data-cursor');
          }

          if (event.data === YT.PlayerState.ENDED) {
            isPlaying = false;
            thumb.addClass('is-play');
            thumb.removeClass('is-pause');
            youtubeEmbed.removeAttr('data-cursor');
          }

          if (event.data === YT.PlayerState.PLAYING) {
            isPlaying = true;
            thumb.removeClass('is-play');
            thumb.addClass('is-pause');
            youtubeEmbed.attr('data-cursor', 'hidden');
          }
        }

        window.addEventListener('scroll', () => {
          if (isPlaying && player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
          }
        }, { passive: true });
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-video-anim'
          },
          allowMobile: true,
          tweenArr: [
            new FadeIn({ el: $('.home-video-anim-inner').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } }),
          ]
        });
        this.videoAnimation();
      }
      interact() {
      }
      videoAnimation() {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.home-video'),
            start: 'top top+=85%',
            end: 'bottom-=25% bottom',
            scrub: true,
          },
        });
        tl.to($(this).find('.home-video-anim'), {
          width: '100%',
          height: '100vh',
          paddingRight: '0',
          paddingBottom: '0',
          ease: 'none'
        });
      }
      destroy() {
        super.destroy();
      }
    },
    'home-learn-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home learn setup');
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-learn-tag'
          },
          allowMobile: true,
          tweenArr: [
            new FadeIn({ el: $('.home-learn-tag').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } }),
            new ScaleInset({ el: $('.home-learn-slide').get(0) }), 
            new FadeSplitText({ el: $('.home-learn-text .heading').get(0), delay: 0.2 }),

            ...Array.from($('.home-learn-content-item')).flatMap((el, idx) => [
              new FadeIn({ el: $(el).find('.home-learn-item-ic').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: idx * 0.25 }),
              new FadeSplitText({ el: $(el).find('.home-learn-item-title .txt').get(0), delay: idx * 0.25 }),
              new FadeSplitText({ el: $(el).find('.home-learn-item-text .txt').get(0), delay: idx * 0.25 + 0.2 }),
            ]),
            new FadeIn({ el: $('.home-learn-action').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.8 }),
          ]
        });
        this.learnAnimation();
      }
      interact() {
      }
      learnAnimation() {
        const slideInner = $(this).find('.home-learn-slide-inner');
        const slideWrapper = $(this).find('.home-learn-slide');
        const contentItems = $(this).find('.home-learn-content-item');
        const totalItems = contentItems.length;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.home-learn-progress'),
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              if (totalItems > 0) {
                
                let index = Math.round(self.progress * (totalItems - 1));

                if (index !== this.currentIndex) {
                  contentItems.removeClass('active');
                  contentItems.eq(index).addClass('active');
                  this.currentIndex = index;
                }
              }
            }
          },
        });

        if (slideInner.length && slideWrapper.length) {
          tl.to(slideInner, {
            y: () => -(slideInner[0].scrollHeight - slideWrapper.height()),
            ease: 'none'
          });
        }
      }
      destroy() {
        super.destroy();
      }
    },
    'home-blog-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home blog setup');
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-blog-tag'
          },
          allowMobile: true,
          tweenArr: [
            new FadeIn({ el: $('.home-blog-tag').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } }),
            new FadeSplitText({ el: $('.home-blog-title .heading').get(0), delay: 0.2 }),
            new FadeIn({ el: $('.home-blog-links').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.3 }),
            new FadeIn({ el: $('.home-blog-slide-card').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.4 }),
            new ScaleInset({ el: $('.home-blog-slide-card-img').get(0), delay: 0.6 }), 
            new FadeSplitText({ el: $('.home-blog-slide-card-title .txt').get(0), delay: 0.6 }),
            new FadeSplitText({ el: $('.home-blog-slide-card-des .txt').get(0), delay: 0.6 }),
            new FadeIn({ el: $('.home-blog-btn').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.8 }),
          ]
        });
      }
      interact() {
        this.slideAnimation();
      }
      slideAnimation() {
        const bgItems = $(this).find('.home-blog-bg-slide-item');
        const totalItems = bgItems.length;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.home-blog-progress'),
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              if (totalItems > 0) {
                let index = Math.round(self.progress * (totalItems - 1));

                // if (index !== this.currentIndex) {
                // bgItems.removeClass('active');
                //   bgItems.eq(index).addClass('active');
                //   this.currentIndex = index;
                // }

                bgItems.each((i, bgItem) => {
                  if (i === 0) return;

                  if (i <= index) {
                    gsap.to(bgItem, { opacity: 1, duration: 0.2, ease: 'none', overwrite: 'auto' });
                  } else {
                    gsap.to(bgItem, { opacity: 0, duration: 0.4, ease: 'none', overwrite: 'auto' });
                  }
                });
              }
            }
          },
        });

        const fgInner = $(this).find('.home-blog-slide-inner');
        const fgWrapper = $(this).find('.home-blog-slide');

        if (fgInner.length && fgWrapper.length) {
          tl.to(fgInner, {
            x: () => -(fgInner[0].scrollWidth - fgWrapper.width()),
            ease: 'power3.inOut',
            duration: 1
          }, 0);
          tl.to(bgItems, {
            scale: 1.1,
            ease: 'none',
            duration: 1
          }, 0);
        }

        // if (bgItems.length > 1) {
        //   gsap.set(bgItems.slice(1), { clipPath: 'inset(0% 0% 0% 100%)' });

        //   const step = 1 / (bgItems.length - 1);
        //   bgItems.slice(1).each((index, item) => {
        //     tl.to(item, {
        //       clipPath: 'inset(0% 0% 0% 0%)',
        //       ease: 'power3.inOut',
        //       duration: step
        //     }, index * step);
        //   });
        // }

        $(this).find('.home-blog-btn-skip').on('click', (e) => {
          e.preventDefault();
          if (tl.scrollTrigger) {
            smoothScroll.lenis.scrollTo(tl.scrollTrigger.end, { duration: 0.8 });
          }
        });
      }
      destroy() {
        super.destroy();
      }
    },
    'home-testi-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home testi setup');
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-testi-tag'
          },
          allowMobile: true,
          tweenArr: [
            new FadeIn({ el: $('.home-testi-tag').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } }),
            new FadeIn({ el: $('.home-testi-ic-inner').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }}),
            new FadeSplitText({ el: $('.home-testi-slide-text-item .txt').get(0), splitType: 'lines'}),
            new ScaleInset({ el: $('.home-testi-avatar-slide-img').get(0)}),
            new ScaleInset({ el: $('.home-testi-avatar-slide-img').get(1) }),
            new FadeIn({ el: $('.home-testi-pagi').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.4 }),
            new FadeSplitText({ el: $('.home-testi-name-text .label').get(0), delay: 0.4 }),
            new FadeSplitText({ el: $('.home-testi-name-pos .label').get(0), delay: 0.4 }),
            new FadeIn({ el: $('.home-testi-ctrls').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.4 }),
          ]
        });
      }
      interact() {
        this.initSlideAnimation();
      }
      initSlideAnimation() {
        $(this).find('[data-embla=embla]').addClass('embla__viewport');
        $(this).find('[data-embla=container]').addClass('embla__container');
        $(this).find('[data-embla=slide]').addClass('embla__slide');
        $(this).find('[data-anim=anim-ctrl-progressing]').addClass('anim-ctrl-progressing');


        const slidesInner = $(this).find('.home-testi-slide-text').get(0);
        const prevBtn = $(this).find('.home-testi-ctrl-prev').get(0);
        const nextBtn = $(this).find('.home-testi-ctrl-next').get(0);

        const pagiNumber = $(this).find('[data-pagi="number"]');
        const pagiTotal = $(this).find('[data-total="number"]');

        this.emblaApi = EmblaCarousel(slidesInner, {}, [
          EmblaCarouselFade(),
          EmblaCarouselAutoplay({ delay: 5000, stopOnInteraction: false })
        ]);

        const slidesName = $(this).find('.home-testi-name-slide').get(0);
        if (slidesName) {
          $(slidesName).addClass('embla__viewport');
          $(slidesName).find('.home-testi-name-slide-inner').addClass('embla__container');
          $(slidesName).find('.home-testi-name-slide-item').addClass('embla__slide');

          this.emblaApiName = EmblaCarousel(slidesName, {}, [
            EmblaCarouselFade()
          ]);

          const syncMainToName = () => {
            if (this.emblaApiName && this.emblaApi) {
              if (this.emblaApiName.selectedScrollSnap() !== this.emblaApi.selectedScrollSnap()) {
                this.emblaApiName.scrollTo(this.emblaApi.selectedScrollSnap());
              }
            }
          };

          // Hàm đồng bộ Name -> Main
          const syncNameToMain = () => {
            if (this.emblaApiName && this.emblaApi) {
              if (this.emblaApi.selectedScrollSnap() !== this.emblaApiName.selectedScrollSnap()) {
                this.emblaApi.scrollTo(this.emblaApiName.selectedScrollSnap());
              }
            }
          };

          this.emblaApi.on('select', syncMainToName);
          this.emblaApiName.on('select', syncNameToMain);
        }

        const slidesAvatar = $(this).find('.home-testi-avatar-slide').get(0);
        if (slidesAvatar) {
          $(slidesAvatar).addClass('embla__viewport');
          $(slidesAvatar).find('.home-testi-avatar-slide-inner').addClass('embla__container');
          $(slidesAvatar).find('.home-testi-avatar-slide-item').addClass('embla__slide');

          this.emblaApiAvatar = EmblaCarousel(slidesAvatar);

          const syncMainToAvatar = () => {
            if (this.emblaApiAvatar && this.emblaApi) {
              if (this.emblaApiAvatar.selectedScrollSnap() !== this.emblaApi.selectedScrollSnap()) {
                this.emblaApiAvatar.scrollTo(this.emblaApi.selectedScrollSnap());
              }
            }
          };

          const syncAvatarToMain = () => {
            if (this.emblaApiAvatar && this.emblaApi) {
              if (this.emblaApi.selectedScrollSnap() !== this.emblaApiAvatar.selectedScrollSnap()) {
                this.emblaApi.scrollTo(this.emblaApiAvatar.selectedScrollSnap());
              }
            }
          };

          this.emblaApi.on('select', syncMainToAvatar);
          this.emblaApiAvatar.on('select', syncAvatarToMain);
        }

        // Setup Background Slider
        // const slidesBg = $(this).find('.home-testi-bg-slide').get(0);
        // if (slidesBg) {
        //   const bgInner = $(slidesBg).find('.home-testi-bg-slide-inner');
        //   const bgItem = $(slidesBg).find('.home-testi-bg-slide-item').first();

        //   if (bgInner.length && bgItem.length && this.emblaApi) {
        //     const totalSlides = this.emblaApi.scrollSnapList().length;
        //     const currentCount = bgInner.find('.home-testi-bg-slide-item').length;
        //     for (let i = currentCount; i < totalSlides; i++) {
        //       bgInner.append(bgItem.clone());
        //     }
        //   }

        //   $(slidesBg).addClass('embla__viewport');
        //   $(slidesBg).find('.home-testi-bg-slide-inner').addClass('embla__container');
        //   $(slidesBg).find('.home-testi-bg-slide-item').addClass('embla__slide');

        //   this.emblaApiBg = EmblaCarousel(slidesBg);

        //   const syncMainToBg = () => {
        //     if (this.emblaApiBg && this.emblaApi) {
        //       if (this.emblaApiBg.selectedScrollSnap() !== this.emblaApi.selectedScrollSnap()) {
        //         this.emblaApiBg.scrollTo(this.emblaApi.selectedScrollSnap());
        //       }
        //     }
        //   };

        //   const syncBgToMain = () => {
        //     if (this.emblaApiBg && this.emblaApi) {
        //       if (this.emblaApi.selectedScrollSnap() !== this.emblaApiBg.selectedScrollSnap()) {
        //         this.emblaApi.scrollTo(this.emblaApiBg.selectedScrollSnap());
        //       }
        //     }
        //   };

        //   this.emblaApi.on('select', syncMainToBg);
        //   this.emblaApiBg.on('select', syncBgToMain);
        // }

        if (prevBtn && nextBtn) {
          this.prevNextButtons = new PrevNextButtons(this.emblaApi, prevBtn, nextBtn);
        }

        if (this.emblaApi) {
          const totalSlides = this.emblaApi.scrollSnapList().length;
          pagiTotal.text(totalSlides < 10 ? `0${totalSlides}` : totalSlides);

          const updatePagi = () => {
            const currentSlide = this.emblaApi.selectedScrollSnap() + 1;
            pagiNumber.text(currentSlide < 10 ? `0${currentSlide}` : currentSlide);

            const progressEl = $(this).find('[data-anim=anim-ctrl-progressing]').get(0);
            if (progressEl) {
              progressEl.classList.remove('anim-ctrl-progressing');
              void progressEl.offsetWidth;
              progressEl.classList.add('anim-ctrl-progressing');
            }
          };

          updatePagi();
          this.emblaApi.on('select', updatePagi);
        }
      }
      destroy() {
        super.destroy();
      }
    },
    'home-marquee-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        new Marquee($(this).find('.home-marquee-list'), 120).setup();
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-marquee'
          },
          allowMobile: true,
          tweenArr: [
            ...Array.from($('.home-marquee-item-anim')).flatMap((el, idx) => new FadeIn({ el: $(el).get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } })),
          ]
        });
      }
      interact() {
      }
      destroy() {
        super.destroy();
      }
    },
    'home-faq-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('Home faq setup');
      }
      animationReveal() {
        new MasterTimeline({
          scrollTrigger: {
            trigger: '.home-faq-tag'
          },
          allowMobile: true,
          tweenArr: [
            new FadeIn({ el: $('.home-faq-tag').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 } }),
            new FadeSplitText({ el: $('.home-faq-head-title .heading').get(0), splitType: 'lines' }),
            new FadeIn({ el: $('.home-faq-head-review-user').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.2 }),
            new FadeIn({ el: $('.home-faq-head-review-star').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: 0.2 }),
            new FadeSplitText({ el: $('.home-faq-head-review-des .txt').get(0), delay: 0.4 }),
            ...Array.from($('.home-faq-item')).flatMap((el, idx) => [
              new FadeIn({ el: $(el).find('.home-faq-item').get(0), from: { y: cvUnit(10, 'rem'), x: cvUnit(5, 'rem') }, to: { y: 0, x: 0 }, delay: idx * 0.25 }),
              new FadeSplitText({ el: $(el).find('.home-faq-item-main-title .txt').get(0), delay: idx * 0.25 }),
            ]),
          ]
        });
      }
      interact() {
        $(this).find('.home-faq-item-main-title').on('click', (e) => {
          const item = $(e.currentTarget).closest('.home-faq-item');
          if (item.hasClass('active')) {
            item.removeClass('active');
          } else {
            $(this).find('.home-faq-item').removeClass('active');
            item.addClass('active');
          }
        });
      }
      destroy() {
        super.destroy();
      }
    },
  };
  const AboutPage = {
    'about-hero-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('about hero setup');
      }
      animationReveal() {
      }
      interact() {
        this.heroAnimation();
      }
      heroAnimation() {
        const textWrap = $(this).find('.about-hero-text-wrap');
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.about-hero'),
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              if (self.progress > 0.4) {
                textWrap.css('pointer-events', 'none');
              } else {
                textWrap.css('pointer-events', 'auto');
              }
            },
          },
        });
        tl.to($(this).find('.about-hero-text-wrap'), {
          yPercent: -100,
          scale: 0.7,
          autoAlpha: 0,
          duration: 0.85,
          ease: 'power1.inOut',
        });
        tl.to($(this).find('.about-hero-main'), {
          paddingRight: 0,
          paddingLeft: 0,
          duration: 1,
          ease: 'none',
        }, 0);
        tl.to($(this).find('.about-hero-bottom'), {
          marginTop: '-100vh',
          duration: 1,
          ease: 'none',
        }, 0);
        tl.to($(this).find('.about-hero-thumb.thumb-anim'), {
          width: '100%',
          height: '100vh',
          duration: 1,
          ease: 'none',
        }, 0);
      }
      destroy() {
        super.destroy();
      }
    },
    'about-overview-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('about overview setup');
      }
      animationReveal() {
      }
      interact() {
      }
      destroy() {
        super.destroy();
      }
    },
    'about-text-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('about text setup');
      }
      animationReveal() {
      }
      interact() {
      }
      destroy() {
        super.destroy();
      }
    },
    'about-mil-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('about mil setup');
      }
      animationReveal() {
      }
      interact() {
        this.animScrub();
      }
      animScrub(){
        const inner = $(this).find('.about-mil-slide-inner');
        const item = $(this).find('.about-mil-item');
        const tags = $(this).find('.about-mil-timeline-tags-inner');
        const tagItem = $(this).find('.about-mil-timeline-tag-item');
        // const timelineSvgInner = $(this).find('.about-mil-timeline-svgs-inner');

        // const timelineSvgItem = timelineSvgInner.find('.about-mil-timeline-svg').first();
        // if (timelineSvgItem.length && tags.length) {
        //   const targetWidth = tags[0].scrollWidth;
        //   const itemWidth = timelineSvgItem.outerWidth(true);
        //   if (itemWidth > 0) {
        //     const clonesNeeded = Math.ceil(targetWidth / itemWidth) - timelineSvgInner.find('.about-mil-timeline-svg').length + 1;
        //     for (let i = 0; i < clonesNeeded; i++) {
        //       timelineSvgInner.append(timelineSvgItem.clone());
        //     }
        //   }
        // }

        const svg = $(this).find('.about-mil-svg');
        if(svg.length) {
          gsap.set(svg, { width: inner[0].scrollWidth });
        }

        const path = $(this).find("#drawPath").get(0);
        const length = path.getTotalLength();

        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length
        });

        const winWidth = $(window).width();
        const svgW = svg.width();

        let startSlideTime = (winWidth / 2) / svgW;
        let slideDuration = (svgW - winWidth) / svgW;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.about-mil-progress'),
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              const p = self.progress;
              // item.eq(0).find('.about-mil-card').toggleClass('active', p >= 0.30631);
              // item.eq(1).find('.about-mil-card').toggleClass('active', p >= 0.44261);
              // item.eq(2).find('.about-mil-card').toggleClass('active', p >= 0.57563);
              // item.eq(3).find('.about-mil-card').toggleClass('active', p >= 0.70826);
              tagItem.eq(0).find('.about-mil-card-tag-text').toggleClass('active', p >= 0.30631);
              tagItem.eq(1).find('.about-mil-card-tag-text').toggleClass('active', p >= 0.44261);
              tagItem.eq(2).find('.about-mil-card-tag-text').toggleClass('active', p >= 0.57563);
              tagItem.eq(3).find('.about-mil-card-tag-text').toggleClass('active', p >= 0.70826);
            }
          },
        });

        const tlItem = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.about-mil-progress'),
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        });

        tl.to(path, {
          strokeDashoffset: 0,
          duration: 1,
          ease: 'none',
        }, 0);

        tl.to(svg, {
          x: `-${svgW - winWidth}`,
          duration: slideDuration,
          ease: 'none',
        }, startSlideTime);


        if (svgW <= winWidth) {
          startSlideTime = 0;
          slideDuration = 1;
        }

        const translateX = (inner.width() + winWidth);

        tlItem.to(inner, {
          x: - translateX,
          duration: slideDuration,
          ease: 'none',
        }, 0);

        tlItem.to(tags, {
          x: -translateX,
          duration: slideDuration,
          ease: 'none',
        }, 0);

        // tlItem.to(timelineSvgInner, {
        //   x: -translateX,
        //   duration: slideDuration,
        //   ease: 'none',
        // }, 0);
      }
      destroy() {
        super.destroy();
      }
    },
    'about-why-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('about why setup');
      }
      animationReveal() {
        const tlOverlap = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.about-why'),
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });
        tlOverlap.to('.about-mil', { scale: .98, autoAlpha: 0, duration: 1, ease: 'none' }, "<=0");
        tlOverlap.to('.about-mil', { y: 20, duration: 0.8, ease: 'none' }, "<=0.2");
      }
      interact() {
        this.cardAnimation();
      }
      cardAnimation() {
        const allCards = $(this).find('.about-why-card');
        const cards = $(this).find('.about-why-card:not(:first-child)');
        const firstCard = allCards.first();

        gsap.set(allCards, { transformOrigin: "top center" });

        const firstCardTl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.about-why-inner'),
            start: 'top top+=40%',
            end: 'top top',
            scrub: true,
          },
        });

        firstCardTl.to(firstCard, {
          rotationZ: 0,
          ease: 'power1.inOut'
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.about-why-inner'),
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        });

        cards.each((i, el) => {
          const targetCards = cards.slice(i);
          const currentCard = $(el);
          tl.to(targetCards, {
            y: () => -(el.offsetTop - firstCard[0].offsetTop),
            ease: 'none'
          }, `step${i}`);

          tl.to(currentCard, {
            rotationZ: 0,
            ease: 'none'
          }, `step${i}`);
        });
      }
      destroy() {
        super.destroy();
      }
    },
    'about-area-wrap': class extends TriggerSetup {
      constructor() {
        super();
        this.onTrigger = () => {
          this.setup();
          this.animationReveal();
          this.interact();
        }
      }
      setup() {
        console.log('about area setup');
      }
      animationReveal() {
      }
      interact() {
      }
      destroy() {
        super.destroy();
      }
    },
  }
  class PageManager {
    constructor(page) {
      if (!page || typeof page !== 'object') {
        throw new Error('Invalid page configuration');
      }

      // Store registered component names to prevent duplicate registration
      this.registeredComponents = new Set();

      this.sections = Object.entries(page).map(([name, Component]) => {
        if (typeof Component !== 'function') {
          throw new Error(`Section "${name}" must be a class constructor`);
        }

        // Only register the custom element if not already registered
        if (!this.registeredComponents.has(name)) {
          try {
            customElements.define(name, Component);
            this.registeredComponents.add(name);
          } catch (error) {
            // Handle case where element is already defined
            console.warn(`Custom element "${name}" is already registered`);
          }
        }

        return new Component();
      });
    }

    // Method to cleanup sections if needed
    destroy() {
      this.sections.forEach(section => {
        if (typeof section.destroy === 'function') {
          section.destroy();
        }
      });
    }
  }
  const pageName = $('.main-inner').attr('data-barba-namespace');
  const pageConfig = {
    home: HomePage,
    about: AboutPage
  };
  const registry = {};
  let footerInstance = null;

  if (!customElements.get('web-comp')) {
    customElements.define('web-comp', Footer);
  }
  const initFooter = () => {
    const footerEl = document.querySelector('footer, .footer');
    if (footerEl && !footerEl.closest('web-comp')) {
      if (footerInstance) {
        footerInstance.destroy();
      }
      const wrapper = document.createElement('web-comp');
      footerEl.parentNode.insertBefore(wrapper, footerEl);
      wrapper.appendChild(footerEl);
      footerInstance = wrapper;
    }
  };

  registry[pageName]?.destroy();
  scrollTop(() => {
    if (pageConfig[pageName]) {
      registry[pageName] = new PageManager(pageConfig[pageName]);
    }
    initFooter();

    // Gọi lại updateHtml để chuột nhận diện đúng các phần tử DOM sau khi page đã setup xong
    if (typeof mouse !== 'undefined') {
      mouse.updateHtml();
    }
  });
  documentHeightObserver("init");
  refreshOnBreakpoint();
}
window.onload = script
