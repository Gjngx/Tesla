const parseRem = (input) => {
    return (input / 10) * parseFloat(getComputedStyle(document.querySelector('html')).fontSize)
}
function getScreenType() {
    const width = window.innerWidth;
    let type = width > 991 ? 'dsk' : window.innerWidth > 767 ? 'tb' : 'mb';
    let size = width;
    const isMobile = width <= 767;
    const isTablet = width > 767 && width <= 991;
    const isDesktop = width > 991;
    return { type, size , isMobile, isDesktop, isTablet };
}
function convertHyphen(el) {
    el.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = node.nodeValue.replace(/-/g, '‑');
        }
    });
}
class MasterTimeline {
    constructor({ triggerInit, timeline, tweenArr, stagger = .1, scrollTrigger, allowMobile }) {
        this.timeline = timeline;
        this.triggerInit = triggerInit;
        this.scrollTrigger = scrollTrigger;
        this.tweenArr = tweenArr;
        this.stagger = stagger;
        this.allowMobile = getScreenType().isMobile ? allowMobile : true;
        document.fonts.ready.then(() => this.setup());
    }
    setup() {
        if (!this.allowMobile) return;
        gsap.timeline({
            scrollTrigger: {
                trigger: this.triggerInit,
                start: 'top bottom+=100vh',
                end: 'bottom top',
                once: true,
                scrub: false,
                onEnter: () => {
                    this.tweenArr.forEach((item) => item.init?.())
                }
            }
        });
        if (!this.timeline) {
            this.timeline = gsap.timeline({
                scrollTrigger: {
                    start: 'top top+=80%',
                    end: '+=100%',
                    scrub: false,
                    once: true,
                    ...this.scrollTrigger
                }
            })
        };
        this.tweenArr.forEach((item) => this.timeline.add(item.animation, item.delay || `<=${this.stagger}` || "<=.1"));
    }
}
class RevealText {
    constructor({ el, color, delay, isDisableRevert, isHighlight = false, isFast = false, ...props }) {
        this.DOM = { el: el };
        this.color = color;
        this.textSplit = [];
        this.delay = delay;
        this.textSplit = SplitText.create(this.DOM.el, { type: 'lines, words' });
        const isColorDefault = this.color === 'white' || this.color === 'black';
        this.fromColor = !isColorDefault ? 'rgba(255,255,255, 0)' : this.color == 'white' ? 'rgba(255,255,255, 0)' : 'rgba(29,29,29, 0)';
        this.toColor = !isColorDefault ? this.color : this.color == 'white' ? 'rgba(255,255,255, 1)' : 'rgba(29,29,29, 1)';

        if (isHighlight) {
            this.animation = gsap.timeline({
                onComplete: () => {
                    if (!isDisableRevert) {
                        this.textSplit.revert();
                    }
                },
                ...props
            });
            this.textSplit.words.forEach((word, idx) => {
                let toColor = word.closest('.txt-highlight') ? '#FF6B30' : this.toColor;
                this.animation.to(word, {
                    keyframes: {
                        color: [this.fromColor, '#FF6B30', toColor],
                        easeEach: 'power2.in',
                        ease: 'power1.out',
                    },
                    duration: isFast ? 0.8 : 1
                }, idx * (isFast ? 0.03 : 0.08))
            });
        }
        else {
            this.animation = gsap.to(this.textSplit.words, {
                keyframes: {
                    color: [this.fromColor, '#232323', this.toColor],
                    easeEach: 'power2.in',
                    ease: 'power1.out',
                },
                duration: isFast ? 0.8 : 1,
                stagger: isFast ? 0.03 : 0.08,
                onComplete: () => {
                    if (!isDisableRevert) {
                        this.textSplit.revert();
                    }
                },
                ...props
            })
        }
    }
    init() {
        gsap.set(this.textSplit.words, { color: this.fromColor });
    }
}
class RevealTextReset  {
    constructor({ el, color, delay, isFast = false, isHighlight = false, ...props }) {
        this.DOM = { el: el };
        this.color = color;
        this.textSplit = [];
        this.delay = delay;
        this.isHighlight = isHighlight
        this.isFast = isFast;

        this.textSplit = SplitText.create(this.DOM.el, { type: 'lines, words' });
        this.isColorDefault = this.color === 'white' || this.color === 'black';
        this.fromColor = !this.isColorDefault ? 'rgba(255,255,255, 0)' : this.color == 'white' ? 'rgba(255,255,255, 0)' : 'rgba(29,29,29, 0)';
        this.toColor = !this.isColorDefault ? this.color : this.color == 'white' ? 'rgba(255,255,255, 1)' : 'rgba(29,29,29, 1)';

        if (this.isHighlight) {
            this.animation = gsap.timeline({
                onComplete: () => {
                    this.reset();
                },
                ...props
            });

            this.textSplit.words.forEach((word, idx) => {
                let toColor = word.closest('.txt-highlight') ? '#FF6B30' : this.toColor;
                this.animation.to(word, {
                    keyframes: {
                        color: [this.fromColor, '#FF6B30', toColor],
                        easeEach: 'power2.in',
                        ease: 'power1.out',
                    },
                    duration: isFast ? 0.8 : 1
                }, idx * (isFast ? 0.03 : 0.08))
            });
        }
        else {
            this.animation = gsap.to(this.textSplit.words, {
                keyframes: {
                    color: [this.fromColor, '#FF6B30', this.toColor],
                    easeEach: 'power2.in',
                    ease: 'power1.out',
                },
                duration: isFast ? 0.8 : 1,
                stagger: isFast ? 0.03 : 0.08,
                onComplete: () => {
                    this.reset();
                },
                ...props
            })
        }
    }
    init() {
        if (getScreenType().isMobile) {
            this.fromColor = !this.isColorDefault ? 'rgba(255,255,255, .1)' : this.color == 'white' ? 'rgba(255,255,255, .1)' : 'rgba(29,29,29, .1)';
            this.reset()
        }
        gsap.set(this.textSplit.words, { color: this.fromColor });
    }
    reset() {
        let isReset = true;
        let isInit = getScreenType().isMobile ? true : false;

        let tlText = gsap.timeline();
        let tl = gsap.timeline({
            scrollTrigger: {
                trigger: this.DOM.el,
                start: 'top top+=65%',
                end: 'bottom top+=65%',
                onEnter: () => {
                    if (isReset && isInit)  {
                        isReset = false;
                        if (this.isHighlight) {
                            this.textSplit.words.forEach((word, idx) => {
                                let toColor = word.closest('.txt-highlight') ? '#FF6B30' : this.toColor;
                                tlText.to(word, {
                                    keyframes: {
                                        color: [this.fromColor, '#FF6B30', toColor],
                                        easeEach: 'power2.in',
                                        ease: 'power1.out',
                                    },
                                    duration: this.isFast ? 0.8 : 1
                                }, idx * (this.isFast ? 0.03 : 0.08))
                            });
                        }
                        else {
                            gsap.to(this.textSplit.words, {
                                keyframes: {
                                    color: [this.fromColor, '#FF6B30', this.toColor],
                                    easeEach: 'power2.in',
                                    ease: 'power1.out',
                                },
                                overwrite: true,
                                duration: this.isFast ? .8 : 1,
                                stagger: this.isFast ? .03 : .08,
                            })
                        }
                    }
                },
            }
        })
        let resetTL = gsap.timeline({
            scrollTrigger: {
                trigger: this.DOM.el,
                start: 'top bottom',
                end: 'bottom top',
                onLeaveBack: () => {
                    if (!isInit) {
                        this.fromColor = !this.isColorDefault ? 'rgba(255,255,255, .1)' : this.color == 'white' ? 'rgba(255,255,255, .1)' : 'rgba(29,29,29, .1)';
                    }
                    isInit = true;

                    if (!isReset) isReset = true;
                    gsap.set(this.textSplit.words, {color: this.fromColor, overwrite: true })
                },
            }
        })
    }
}
class FadeSplitText {
    constructor({ el, delay, duration = 0.8, splitType, isDisableRevert, ...props }) {
        if (!el || el.textContent === '') return;
        this.DOM = { el: el };
        this.delay = delay;
        this.textSplit = null;
        this.splitType = splitType || 'words';
        let animation;
        document.fonts.ready.then(() => {
            gsap.set(this.DOM.el, { width: this.DOM.el.offsetWidth + 5 })
            this.textSplit = SplitText.create(this.DOM.el, {
                type: this.splitType === 'words' ? "lines words" : 'lines',
                mask: "lines",
                onSplit: (self) => {
                    gsap.set(self[this.splitType], { autoAlpha: 0, yPercent: 100 });
                    animation = gsap.to(self[this.splitType], {
                        autoAlpha: 1,
                        yPercent: 0,
                        stagger: this.splitType === 'words' ? 0.02 : 0.1,
                        duration: duration,
                        willChange: 'transform, opacity',
                        ease: 'power2.out',
                        clearProps: 'overflow',
                        onComplete: () => {
                            if (!isDisableRevert) {
                                self.revert();
                                convertHyphen(self.elements[0]);
                            }
                            else {
                                gsap.set(this.DOM.el.querySelectorAll('[aria-hidden="true"]'), { clearProps: 'overflow' });
                            }
                        },
                        onStart: () => {
                            setTimeout(() => {
                                if (this.DOM.el.querySelectorAll('.txt-strike').length !== 0) {
                                    this.DOM.el.querySelectorAll('.txt-strike').forEach(element => element.classList.add('active'));
                                }
                                if (this.DOM.el.querySelectorAll('.heading-decor').length !== 0) {
                                    this.DOM.el.querySelectorAll('.heading-decor').forEach(element => element.classList.add('active'));
                                }
                            }, duration * 1000 * 0.5625);
                        },
                        ...props
                    });
                }
            });
            this.animation = animation;
        })
    }
    init() {
        document.fonts.ready.then(() => {

        })
    }
}
class FadeIn {
    constructor({ el, type, delay, isDisableRevert, from, to, ...props }) {
        this.DOM = { el: el };
        this.type = type || 'default';
        this.delay = delay;
        this.options = {
            bottom: {
                set: { opacity: 0, y: parseRem(32), ...from },
                to: { opacity: 1, y: 0, ...to }
            },
            top: {
                set: { opacity: 0, y: parseRem(-32), ...from },
                to: { opacity: 1, y: 0, ...to }
            },
            left: {
                set: { opacity: 0, x: parseRem(32), ...from },
                to: { opacity: 1, x: 0, ...to },
            },
            right: {
                set: { opacity: 0, x: parseRem(-32), ...from },
                to: { opacity: 1, x: 0, ...to }
            },
            default: {
                set: { opacity: 0, y: parseRem(32), ...from },
                to: { opacity: 1, y: 0, ...to }
            }
        };

        if(!this.DOM.el) return;
        this.animation = gsap.fromTo(this.DOM.el,
            { ...this.options[this.type]?.set || this.options.default.set },
            { ...this.options[this.type]?.to || this.options.default.to,
            duration: 1,
            ease: 'power3',
            clearProps: isDisableRevert ? '' : 'all',
            ...props
        });
    }
    init() {
        if (!this.DOM.el) return;
        gsap.set(this.DOM.el, { ...this.options[this.type]?.set || this.options.default.set });
    }
}
class ScaleLine {
    constructor({ el, type, isCenter, delay, isDisableRevert, ...props }) {
        if (!el) return;

        this.DOM = { el: el };
        this.type = type || 'default';
        this.delay = delay;
        this.options = {
            top: {
                set: { scaleY: 0, transformOrigin: isCenter ? 'center center' : 'top left' },
                to: { scaleY: 1 }
            },
            left: {
                set: { scaleX: 0, transformOrigin: isCenter ? 'center center' : 'top left' },
                to: { scaleX: 1 }
            },
            right: {
                set: { scaleX: 0, transformOrigin: isCenter ? 'center center' : 'top right' },
                to: { scaleX: 1 }
            },
            bottom: {
                set: { scaleX: 0, transformOrigin: isCenter ? 'center center' : 'bottom right' },
                to: { scaleX: 1 }
            },
            default: {
                set: { scaleX: 0, transformOrigin: isCenter ? 'center center' : 'top left' },
                to: { scaleX: 1 }
            }
        };
        this.animation = gsap.fromTo(this.DOM.el,
            { ...this.options[this.type]?.set || this.options.default.set },
            { ...this.options[this.type]?.to || this.options.default.to,
                duration: 1.2,
                ease: 'power1.out',
                clearProps: isDisableRevert ? '' : 'all',
                ...props
            });
    }
    init() {
        if (!this.DOM?.el) return;

        gsap.set(this.DOM.el, { ...this.options[this.type]?.set || this.options.default.set });
    }
}
class ScaleInset {
    constructor({el, elInner, delay, duration, isDisableRevert }) {
        this.DOM = {
            el: el, elInner: elInner || el?.querySelector('img')
    };
        this.delay = delay;
        this.borderRad = gsap.getProperty(this.DOM.el, 'border-radius');
        this.animation = gsap
            .timeline()
            .to(this.DOM.el,
                { clipPath: `inset(0% round ${this.borderRad}px)`, duration: 2, ease: 'expo.out', clearProps: isDisableRevert ? '' : 'all' })
            .to(this.DOM.elInner,
                { scale: 1, duration: 2, autoAlpha: 1, ease: 'expo.out', clearProps: isDisableRevert ? '' : 'all', overwrite: true }, "<=0")
    }
    init() {
        if (!this.DOM.el) return;
        gsap.set(this.DOM.el, { clipPath: `inset(20% round ${this.borderRad}px)` });
        gsap.set(this.DOM.elInner, { scale: 1.4, autoAlpha: 0 });
    }
}
