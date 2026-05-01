class TweenParallax {
    constructor(emblaApi) {
        this.TWEEN_FACTOR_BASE = 0.2
        this.tweenFactor = 0
        this.tweenNodes = []
        this.emblaApi = emblaApi
        this.init()
    }

    setTweenNodes() {
        this.tweenNodes = this.emblaApi.slideNodes().map((slideNode) => {
            return slideNode.querySelector('.embla__parallax__layer')
        })
    }

    setTweenFactor() {
        this.tweenFactor = this.TWEEN_FACTOR_BASE * this.emblaApi.scrollSnapList().length
    }

    tweenParallax(eventName) {
        const engine = this.emblaApi.internalEngine()
        const scrollProgress = this.emblaApi.scrollProgress()
        const slidesInView = this.emblaApi.slidesInView()
        const isScrollEvent = eventName === 'scroll'

        this.emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
            let diffToTarget = scrollSnap - scrollProgress
            const slidesInSnap = engine.slideRegistry[snapIndex]

            slidesInSnap.forEach((slideIndex) => {
                if (isScrollEvent && !slidesInView.includes(slideIndex)) return

                if (engine.options.loop) {
                    engine.slideLooper.loopPoints.forEach((loopItem) => {
                        const target = loopItem.target()

                        if (slideIndex === loopItem.index && target !== 0) {
                            const sign = Math.sign(target)

                            if (sign === -1) {
                                diffToTarget = scrollSnap - (1 + scrollProgress)
                            }
                            if (sign === 1) {
                                diffToTarget = scrollSnap + (1 - scrollProgress)
                            }
                        }
                    })
                }

                const translate = diffToTarget * (-1 * this.tweenFactor) * 100
                const tweenNode = this.tweenNodes[slideIndex]
                tweenNode.style.transform = `translateX(${translate}%)`
            })
        })
    }

    init() {
        this.setTweenNodes()
        this.setTweenFactor()
        this.tweenParallax()

        this.emblaApi
            .on('reInit', () => this.setTweenNodes())
            .on('reInit', () => this.setTweenFactor())
            .on('reInit', () => this.tweenParallax())
            .on('scroll', () => this.tweenParallax('scroll'))
            .on('slideFocus', () => this.tweenParallax())
    }

    destroy() {
        this.tweenNodes.forEach((slide) => slide.removeAttribute('style'))
    }
}

class TweenFade {
    constructor(emblaApi) {
        this.emblaApi = emblaApi
        this.tweenNodes = []
        this.init()
    }

    setTweenNodes() {
        this.tweenNodes = this.emblaApi.slideNodes().map((slideNode) => {
            return slideNode
        })
    }

    tweenFade(eventName) {
        const engine = this.emblaApi.internalEngine()
        const scrollProgress = this.emblaApi.scrollProgress()
        const slidesInView = this.emblaApi.slidesInView()
        const isScrollEvent = eventName === 'scroll'

        this.emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
            let diffToTarget = scrollSnap - scrollProgress
            const slidesInSnap = engine.slideRegistry[snapIndex]

            slidesInSnap.forEach((slideIndex) => {
                if (isScrollEvent && !slidesInView.includes(slideIndex)) return

                if (engine.options.loop) {
                    engine.slideLooper.loopPoints.forEach((loopItem) => {
                        const target = loopItem.target()

                        if (slideIndex === loopItem.index && target !== 0) {
                            const sign = Math.sign(target)

                            if (sign === -1) {
                                diffToTarget = scrollSnap - (1 + scrollProgress)
                            }
                            if (sign === 1) {
                                diffToTarget = scrollSnap + (1 - scrollProgress)
                            }
                        }
                    })
                }

                const opacity = 1 - Math.abs(diffToTarget * 2)
                const tweenNode = this.tweenNodes[slideIndex]
                tweenNode.style.opacity = Math.max(0, Math.min(1, opacity))
            })
        })
    }

    init() {
        this.setTweenNodes()
        this.tweenFade()

        this.emblaApi
            .on('reInit', () => this.setTweenNodes())
            .on('reInit', () => this.tweenFade())
            .on('scroll', () => this.tweenFade('scroll'))
            .on('slideFocus', () => this.tweenFade())
    }

    destroy() {
        this.tweenNodes.forEach((slide) => slide.removeAttribute('style'))
    }
}
class PrevNextButtons {
    constructor(emblaApi, prevBtn, nextBtn) {
        this.emblaApi = emblaApi
        this.prevBtn = prevBtn
        this.nextBtn = nextBtn
        this.autoplay = this.emblaApi.plugins()?.autoplay;
        this.scrollPrevHandler = () => this.scrollPrev()
        this.scrollNextHandler = () => this.scrollNext()
        this.toggleStateHandler = () => this.updateButtonState()
        this.init()
    }

    updateButtonState() {
        if (this.emblaApi.canScrollPrev()) {
            this.prevBtn.classList.remove('disable')
        } else {
            this.prevBtn.classList.add('disable')
        }

        if (this.emblaApi.canScrollNext()) {
            this.nextBtn.classList.remove('disable')
        } else {
            this.nextBtn.classList.add('disable')
        }
    }

    scrollPrev() {
        this.emblaApi.scrollPrev()
        if (!this.autoplay) return;
        this.autoplay.reset()
    }

    scrollNext() {
        this.emblaApi.scrollNext()
        if (!this.autoplay) return;
        this.autoplay.reset()
    }

    init() {
        this.updateButtonState()

        this.emblaApi
            .on('select', this.toggleStateHandler)
            .on('init', this.toggleStateHandler)
            .on('reInit', this.toggleStateHandler)
        this.prevBtn.addEventListener('click', this.scrollPrevHandler, false)
        this.nextBtn.addEventListener('click', this.scrollNextHandler, false)
    }

    destroy() {
        this.prevBtn.classList.remove('disable')
        this.nextBtn.classList.remove('disable')
        this.prevBtn.removeEventListener('click', this.scrollPrevHandler, false)
        this.nextBtn.removeEventListener('click', this.scrollNextHandler, false)
    }
}

class DotButtons {
    constructor(emblaApi, dotsNode, dotNodeTemplate) {
        this.emblaApi = emblaApi
        this.dotsNode = dotsNode
        this.dotNodeTemplate = dotNodeTemplate
        this.dotNodes = []
        this.clickHandlers = []
        this.autoplay = this.emblaApi.plugins()?.autoplay;
        this.addDotBtnsHandler = () => this.addDotBtnsWithClickHandlers()
        this.toggleActiveHandler = () => this.toggleDotBtnsActive()
        this.init()
    }

    scrollTo(index) {
        this.emblaApi.scrollTo(index)
        if (!this.autoplay) return;
        this.autoplay.reset()
    }

    addDotBtnsWithClickHandlers() {
        const snapList = this.emblaApi.scrollSnapList()

        // Check if dot length is 1, then hide/remove dotNode
        if (snapList.length <= 1) {
            if (this.dotsNode) {
                this.dotsNode.style.display = 'none'
                // Or remove it completely: this.dotsNode.remove()
            }
            return
        }

        // Show dotNode if it was hidden
        if (this.dotsNode) {
            this.dotsNode.style.display = ''
        }

        this.dotsNode.innerHTML = snapList
            .map(() => this.dotNodeTemplate.cloneNode(true).outerHTML)
            .join('')

        // Remove old click handlers before adding new ones
        this.clickHandlers.forEach((handler, index) => {
            if (this.dotNodes[index]) {
                this.dotNodes[index].removeEventListener('click', handler, false)
            }
        })
        this.clickHandlers = []

        this.dotNodes = Array.from(this.dotsNode.children)
        this.dotNodes.forEach((dotNode, index) => {
            const handler = () => this.scrollTo(index)
            this.clickHandlers.push(handler)
            dotNode.addEventListener('click', handler, false)
        })
    }

    toggleDotBtnsActive() {
        const previous = this.emblaApi.previousScrollSnap()
        const selected = this.emblaApi.selectedScrollSnap()
        if (this.dotNodes[previous]) {
            this.dotNodes[previous].classList.remove('active');
        }
        if (this.dotNodes[selected]) {
            this.dotNodes[selected].classList.add('active');
        }
    }

    init() {
        this.emblaApi
            .on('init', this.addDotBtnsHandler)
            .on('reInit', this.addDotBtnsHandler)
            .on('init', this.toggleActiveHandler)
            .on('reInit', this.toggleActiveHandler)
            .on('select', this.toggleActiveHandler)
    }

    destroy() {
        // Remove all click handlers
        this.clickHandlers.forEach((handler, index) => {
            if (this.dotNodes[index]) {
                this.dotNodes[index].removeEventListener('click', handler, false)
            }
        })
        this.dotsNode.innerHTML = ''
        this.dotNodes = []
        this.clickHandlers = []
    }
}

class TweenSplitText {
    constructor(emblaApi, options = {}) {
        this.emblaApi = emblaApi
        this.splitTextCache = []
        this.lastIndex = -1
        this.titleSelector = options.titleSelector || '.embla__slide__title'
        this.init()
    }

    setupTextCache() {
        const slideNodes = this.emblaApi.slideNodes()
        const selectedIndex = this.emblaApi.selectedScrollSnap()

        slideNodes.forEach((slideEl, index) => {
            const titleEls = slideEl.querySelectorAll(this.titleSelector)
            
            this.splitTextCache[index] = { words: [] }

            if (titleEls.length > 0) {
                titleEls.forEach(titleEl => {
                    const st = new SplitText(titleEl, {
                        type: "words lines",
                        wordsClass: "bp-word",
                        linesClass: "bp-line",
                    })
                    this.splitTextCache[index].words.push(...st.words)
                })
            }
            if (index !== selectedIndex) {
                const words = this.splitTextCache[index].words
                if (words.length) gsap.set(words, { yPercent: 100 })
            }
        })
        
        this.lastIndex = selectedIndex
    }

    animateText() {
        const currentIndex = this.emblaApi.selectedScrollSnap()
        if (currentIndex === this.lastIndex) return

        const prevIdx = this.lastIndex

        const scrollDown = currentIndex > prevIdx
        const prevY = scrollDown ? -100 : 100

        if (this.splitTextCache[currentIndex]) {
            const words = this.splitTextCache[currentIndex].words
            
            if (words.length) {
                gsap.set(words, { yPercent: scrollDown ? 100 : -100 })
                gsap.to(words, {
                    yPercent: 0,
                    duration: 0.4,
                    stagger: 0.02,
                })
            }
        }

        if (prevIdx >= 0 && this.splitTextCache[prevIdx]) {
            const prevWords = this.splitTextCache[prevIdx].words

            if (prevWords.length) {
                gsap.to(prevWords, {
                    yPercent: prevY,
                    duration: 0.4,
                    stagger: 0.02,
                })
            }
        }

        this.lastIndex = currentIndex
    }

    init() {
        this.setupTextCache()

        this.emblaApi
            .on('reInit', () => {
                this.splitTextCache = []
                this.setupTextCache()
            })
            .on('select', () => this.animateText())
    }

    destroy() {
        this.splitTextCache = []
    }
}
