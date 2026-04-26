const script = () => {
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
    }
    setup(isReverse) {
      const cloneAmount = Math.ceil($(window).width() / this.list.width()) + 1;

      let itemClone = this.list.find('[data-marquee="item"]').clone();
      let itemWidth = this.list.find('[data-marquee="item"]').width();
      this.list.html('');
      new Array(cloneAmount).fill().forEach(() => {
        let html = itemClone.clone()
        html.css('animation-duration', `${Math.ceil(itemWidth / this.duration)}s`);
        if (isReverse) {
          html.css('animation-direction', 'reverse');
        }
        html.addClass('anim-marquee');
        this.list.append(html);
      });
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
          // $('.home-intro').css('top', 0 + "px");
        }
      } else if (inst.direction == -1) {
        if (inst.scroll > ($(this.el).height() * 3)) {
          // let heightHeader = $(this.el).outerHeight();
          // $('.home-intro').css('top', heightHeader + "px");
          $(this.el).addClass("on-hide");
          $(this.el).removeClass("on-hide");
        }
      }
      else {
        // let heightHeader = $(this.el).outerHeight();
        // $('.home-intro').css('top', heightHeader + "px");
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
      const $links = $(this.el).find('.header-menu-link.has-dropdown');
      
      $links.on('click', (e) => {
        e.preventDefault();
        const $this = $(e.currentTarget);
        const $dropdown = $this.closest('.header-menu').find('.header-menu-dropdown-desktop');
        
        $this.toggleClass('active');
        $dropdown.toggleClass('active');

        if ($this.hasClass('active')) {
          $('.backdrop').addClass('active');
          smoothScroll.lenis.stop();
        } else {
          $('.backdrop').removeClass('active');
          smoothScroll.lenis.start();
        }

      });

      $(document).on('click', (e) => {
        const $target = $(e.target);
        if (!$target.closest('.header-menu-link.has-dropdown').length && !$target.closest('.header-menu-dropdown-desktop').length) {
          const $activeLinks = $(this.el).find('.header-menu-link.has-dropdown.active');
          if ($activeLinks.length) {
            $activeLinks.removeClass('active');
            $(this.el).find('.header-menu-dropdown-desktop').removeClass('active');
            $('.backdrop').removeClass('active');
            smoothScroll.lenis.start();
          }
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
      }
      interact() {
        this.initSlider();
      }
      initSlider(){
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
        console.log('Home intro setup');
        // let heightHeader = $('.header').outerHeight();
        // $('.home-intro-main').css('top', heightHeader + "px");
      }
      animationReveal() {
        this.SplitText();
      }
      interact() {
      }
      SplitText() {
        const textSplitting = SplitText.create('.home-intro-text .txt', { type: 'words,chars' });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.home-intro-text',
            start: 'top top+=70%',
            end:'top top-=30%',
            scrub: true,
          },
        })
        tl.fromTo(textSplitting.chars, { opacity: 0.2 }, { opacity: 1, ease: 'power2.inOut', stagger: 0.2 })
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
        this.cardAnimation();
      }
      interact() {
      }
      cardAnimation() {
        const allCards = $(this).find('.home-cur-card');
        const cards = $(this).find('.home-cur-card:not(:first-child)');
        
        gsap.set(allCards, { transformOrigin: "top center" });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: $(this).find('.home-cur-anim'),
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
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
      }
      animationReveal() {
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
          height: 'calc(100vh - 6.4rem)',
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
                // Tính toán index dựa trên phần trăm scroll (0 -> 1)
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

  });
  documentHeightObserver("init");
  refreshOnBreakpoint();
}
window.onload = script
