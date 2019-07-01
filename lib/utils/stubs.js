const cheerioInterface = require('../interfaces/cheerio-interface');
const cheerio = require('cheerio');

const stubs = {
  'amp-3d-gltf': () => false,
  'amp-3q-player': () => false,
  'amp-access': () => false, // Fully described HTML. However, can use <template>
  'amp-access-laterpay': () => false,
  /**
   * Adds the necessary elements and styling to an <amp-accordion> instance
   * @param {*} element - An instance of <amp-accordion> in the DOM
   * @param {*} $ - Cheerio doc object
   */
  'amp-accordion': (element, $) => {
    /**
     * Any section can be expanded or not expanded. Potential ways to handle:
     *    1) Duplicate section and give it [expanded] attribute.
     *    2) Toggle [expanded] and test CSS this way
     *    3) Ignore [expanded] attributes in style descriptors
     */
    // Clone accordion children
    const childrenClones = element.children().clone();
    // Update original children <section> with [expanded=true]
    element.contents('section').each((_, el) => {
      cheerio(el).attr('expanded', true);
    });
    childrenClones.each((_, el) => {
      // Stub clones
      stubs.stubClones(_, el, $);
      // Update clones' <section> with [expanded=false]
      cheerio(el).attr('expanded', false);
    });

    element.append(childrenClones);
    // Append clones to accordion
  },
  'amp-ad': () => false, // May need Puppeteer.
  'amp-ad-exit': () => false,
  'amp-addthis': () => false, // Contains own CSS. Only need to target element.
  'amp-analytics': () => false, // No need for CSS.
  /**
   * Adds the necessary elements and styling to an <amp-anim> instance
   * @param {*} element - An instance of <amp-anim> in the DOM
   * @param {*} $ - Cheerio doc object
   */
  'amp-anim': (element, $) => {
    /**
     * 1) Inserts <img> tag
     * 2) Nested elements are prepended to the <amp-anim> tag.
     * 3) Supports Layouts
     */
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }

    const imgStub = '<img decoding="async" class="i-amphtml-fill-content i-amphtml-replaced-content" src="">';
    element.append(imgStub);
  },
  'amp-animation': () => false,
  'amp-apester-media': () => false,
  'amp-audio': () => false,
  'amp-app-banner': () => false,
  'amp-auto-ads': () => false,
  'amp-base-carousel': () => false, // Currently experimental.,
  'amp-beopinion': () => false,
  'amp-bodymovin-animation': () => false,
  'amp-brid-player': () => false,
  'amp-brightcove': (element, $) => {
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  'amp-byside-content': () => false,
  'amp-call-tracking': () => false,
  /**
   * Adds the necessary elements and styling to an <amp-carousel> instance
   * @param {*} element - An instance of <amp-carousel> in the DOM
   * @param {*} $ - Cheerio doc object
   */
  'amp-carousel': (element, $) => {
    /**
     * @code
     * <amp-carousel ...>
     *   <misc-element ../>
     * </amp-carousel>
     *
     * @code
     * <amp-carousel ...>
     *   <div class="i-amphtml-scrollable-carousel-container>
     *     <!-- IF CAROUSEL IS RESPONSIVE -->
     *       <i-amphtml-sizer ></i-amphtml-sizer>
     *     <!-- END of IsReponsive -->
     *     <!-- INNER HTML -->
     *       <misc-element ../>
     *     <!-- END INNER HTML -->
     *   </div>
     *   <div class="amp-carousel-button amp-carousel-button-prev"role="button"/>
     *   <div class="amp-carousel-button amp-carousel-button-next" role="button"/>
     * </amp-carousel ...>
     */


    const listItem =
        '<div class="i-amphtml-slide-item i-amphtml-slide-item-show"></div>';
    const prevButton =
        '<div tabindex="0" class="amp-carousel-button amp-carousel-button-prev"'
        + ' role="button" title="Previous item in carousel (2 of 3)" '
        + 'aria-disabled="false"></div>';
    const nextButton =
        '<div tabindex="0" class="amp-carousel-button amp-carousel-button-next"'
        + 'role="button" title="Next item in carousel (1 of 3)"'
        + 'aria-disabled="false"></div>';
    const container = '<div class="i-amphtml-slides-container '
        + 'i-amphtml-slidescroll-no-snap" aria-live="polite"></div>';
    const containerNode = cheerio(container);

    element.children().each((i, child) => {
      const childNode = cheerio(child);
      childNode.addClass('amp-carousel-slide');
      stubs.stubClones(i, child, $);
    });

    element.children().wrap(listItem);
    containerNode.append(element.children());
    element.empty().append(containerNode);
    element.append(prevButton);
    element.append(nextButton);

    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  'amp-consent': () => false, // No DOM manipulation
  'amp-dailymotion': () => false,
  'amp-date-countdown': () => false,
  'amp-date-display': () => false, // Requires <template> tag but self describes DOM
  'amp-date-picker': () => false, // Can include nested elements which shouldn't need any work. However, base calendar build is complicated. Should we target this?
  'amp-embed': () => false,
  'amp-embedly-card': () => false,
  'amp-experiment': (element, $) => {
    /**
     * <body> tag is updated with [amp-x-experimentName="experimentVariable"]
     *  as defined by the experiment JSON. Must take each "amp-x-experimentName"
     *  and add it to a list of CSS selectors that are completely ignored.
     */
    const configJson = JSON.parse(
        element.children().toArray()[0].children[0].data
    );
    const variantNames = [];
    Object.keys(configJson).forEach((experimentName) => {
      Object.keys(configJson[experimentName].variants)
          .forEach((x) => variantNames.push(x));
    });

    /*
     TODO: Add variant names to a list of class names that should be ignored
     */

    return null;
  },
  'amp-facebook': () => false, // Loads an iFrame. No styling occurs
  'amp-facebook-comments': () => false, // Loads an iFrame. No styling occurs
  'amp-facebook-like': () => false, // Loads an iFrame. No styling occurs
  'amp-facebook-page': () => false, // Loads an iFrame. No styling occurs
  'amp-fit-text': () => false,
  'amp-font': (element, $) => {
    /**
     * The extension observes loading of a font and when it loads executes the
     *    optional attributes on-load-add-class and on-load-remove-class and
     *    when there is any error or timeout runs on-error-remove-class and
     *    on-error-add-class. These classes are toggled on the documentElement
     *    for standalone documents, and on body for documents without a
     *    documentElement i.e. inside a ShadowRoot.
     *
     *    We should add all possible on-* tags to the body. However, if the
     *    element gets loaded inside a ShadowRoot, there is no way for us to
     *    tell since we're working with a static DOM.
     */
    const fontClassAugments = Array.from(new Set([
      element.attr('on-error-remove-class'),
      element.attr('on-error-add-class'),
      element.attr('on-load-remove-class'),
      element.attr('on-load-add-class'),
    ]));

    fontClassAugments.forEach((className) => {
      // Add class to document root
      if (!$.root().children().first().hasClass(className)) {
        $.root().children().first().addClass(className);
      }
    });
  },
  'amp-form': () => false, // No DOM manipulation
  'amp-fx-collection': () => false,
  'amp-fx-flying-carpet': () => false,
  'amp-geo': () => {
    /**
     * Updates body class based on country code. To handle this, we iterate
     *    through styles targeting "amp-geo-*" or "amp-iso-country-*" and add
     *    them to a "DO NOT TOUCH" list.
     */
    return null;
  },
  'amp-gfycat': () => false,
  'amp-gist': () => false, // Generates an embedded iframe
  'amp-google-document-embed': (element, $) => {
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  'amp-google-vrview-image': () => false,
  'amp-hulu': () => false,
  'amp-iframe': (element, $) => {
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  'amp-ima-video': () => false,
  /**
   * Adds the necessary elements and styling to an <amp-img> instance
   * @param {*} element - An instance of <amp-img> in the DOM
   * @param {*} $ - Cheerio doc object
   */
  'amp-img': (element, $) => {
    element.append(
        '<img decoding="async" src="" class="i-amphtml-fill-content i-amphtml-replaced-content">');
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  /**
   * Adds the necessary elements and styling to an <amp-image-lightbox> instance
   * @param {*} element - An instance of <amp-image-lightbox> in the DOM
   * @param {*} $ - Cheerio doc object
   */
  'amp-image-lightbox': (element, $) => {
    /**
     * Inserts a lightbox set
     * @code
     * <div class="i-amphtml-image-lightbox-container" style="">
     *   <div class="i-amphtml-image-lightbox-viewer">
     *     <img class="i-amphtml-image-lightbox-viewer-image" src="..." style="...">
     *   </div>
     *   <div id="lightbox1-caption" class="amp-image-lightbox-caption i-amphtml-image-lightbox-caption i-amphtml-empty">
     *   </div>
     * </div>
     * <button class="i-amphtml-screen-reader">Close the lightbox</button>
     */

    element.append(stubs.inserts.ampImgLightbox);
  },
  'amp-image-slider': () => false,
  'amp-imgur': () => false,
  'amp-instagram': () => false,
  'amp-install-serviceworker': () => false, // Not a visual element
  'amp-izlesene': () => false,
  'amp-jwplayer': () => false,
  'amp-kaltura-player': () => false,
  /**
   * Adds the necessary elements and styling to an element nested in amp-layout
   * @param {*} element - An instance of <amp-layout> in the DOM
   * @param {*} $ - Cheerio doc object
   */
  'amp-layout': (element, $) => {
    /**
     * <amp-layout> provides the same responsive based layouts that AMP elements
     *  can use to any HTML5 element.
     */
    const nestedElement = element.first();
    stubs.layout(nestedElement, $);
  },
  'amp-lightbox': () => false, // Only updates amp-boilerplate classes. Shouldn't need any work.
  'amp-lightbox-gallery': () => false, // Todo
  /**
   * Adds the necessary elements and styling to an <amp-list> element.
   * @param {*} element - Cheerio element object
   * @param {*} $ - Cheerio doc object
   */
  'amp-list': (element, $) => {
    /**
     * @code
     * <amp-list ...>
     *   <template>
     *     <misc-elements... />
     *   </template
     * </amp-list>
     *
     * Becomes
     * @code
     * <amp-list ...>
     *   <template> #document.fragment </template>
     *   <div role="list">
     *     <misc-elements role="listitem" />
     *     <misc-elements role="listitem" />
     *   </div>
     * </amp-list>
     *
     * <amp-list> leverages the <amp-moustache> template, either as a direct
     *    descendant or via the [template] attribute. In either case, we can
     *    copy the template's children elements, update them with the
     *    [role="listitem"] attribute and append them to the amp-list element.
     */

    stubs.stubLayout(element, $);
    let template;

    const templateRef = element.attr('template');

    if (templateRef) template = $(`#${templateRef}`);
    else template = element.children().filter('amp-template');

    const templateClone = template.clone();
    const stubbedTemplateClone = stubs.generateTemplateClone(templateClone, $);
    element.append(stubbedTemplateClone);
  },
  'amp-live-list': () => {
    /**
     * Same as <amp-list> but with push data.
     */
    return null;
  },
  'amp-mathml': () => false,
  'amp-mowplayer': () => false,
  'amp-next-page': () => false, // Experimental
  'amp-nexxtv-player': () => false,
  'amp-o2-player': () => false,
  'amp-orientation-observer': () => false,
  'amp-ooyala-player': () => false,
  'amp-pan-zoom': () => false,
  'amp-playbuzz': () => false,
  'amp-pixel': () => false, // No need for CSS
  'amp-pintrest': () => false, // Probably no need for CSS
  'amp-position-observer': () => false,
  'amp-reddit': () => false,
  'amp-riddle-quiz': () => false,
  'amp-reach-player': () => false,
  'amp-selector': () => false, // NOTE: May need to ask client to whitelist TODO
  'amp-share-tracking': () => false,
  /**
   * Adds the necessary elements and styling to an <amp-sidebar> element.
   * @param {*} element - Cheerio element object
   * @param {*} $ - Cheerio doc object
   */
  'amp-sidebar': (element, $) => {
    /**
     * <amp-sidebar> with a nested <nav> element have a special behaviour where
     *    the nave element is duplicated outside the toolbar when a given media-
     *    query is met. To facilitate this, we need to check for the existence
     *    of <nav>, copy it and it's child elements, and paste them in the
     *    [toolbar-target].
     */

    if (element.contents('nav')) { // check for nav element
      const navClone = element.children('nav').clone();
      navClone.each((_, el) => stubs.stubClones(_, el, $)); // Do necessary stubbing for each child
      if ($('[toolbar-target]')) {
        // find [toolbar-target] element
        const target = $('#' + $('[toolbar-target]').attr('toolbar-target'));

        /* The `toolbar` element within the `<amp-sidebar>` element, will
         have classes applied to the element depending if the `toolbar-target`
         element is shown or hidden. This is useful for applying different
         styles on the `toolbar` element and the `toolbar-target` element. The
         classes are `amp-sidebar-toolbar-target-shown`, and
         `amp-sidebar-toolbar-target-hidden`.
        */
        target.addClass('amp-sidebar-toolbar-target-shown');
        target.addClass('amp-sidebar-toolbar-target-hidden');
        // paste clone into [toolbar-target]
        target.append(navClone);
      }
    }
  },
  'amp-social-share': () => false,
  'amp-soundcloud': () => false,
  'amp-sticky-ad': () => false,
  'amp-story': () => false,
  'amp-subscriptions': () => false,
  'amp-subscriptions-google': () => false,
  'amp-springboard-player': () => false,
  'amp-timeago': () => false,
  'amp-twitter': (element, $) => {
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  'amp-user-notification': () => false, // Self defined, no work.
  'amp-video-iframe': () => false,
  'amp-video': () => false,
  'amp-viqeo-player': () => false,
  'amp-vimeo': () => false,
  'amp-vine': (element, $) => {
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  'amp-vk': () => false,
  'amp-viz-vega': () => false,
  'amp-web-push': () => false,
  'amp-wistia-player': () => false,
  'amp-yotpo': () => false,
  'amp-youtube': (element, $) => {
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
  /**
   * Adds the necessary elements and styling to an element utilizing the
   *  layout attribute
   * @param {*} element - Cheerio element object
   * @param {*} $ - Cheerio doc object
   * @return {null}
   */
  'layout': (element, $) => {
    /**
     * If [layout="responsive"]...
     * @code
     * <amp-layout layout="responsive">
     *   <misc-elements/>
     * </amp-layout>
     *
     * becomes...
     *
     * <amp-layout layout="responsive">
     *   <i-amphtml-sizer style="..." />
     *   <div class="i-amphtml-fill-content>
     *      <misc-elements/>
     *   </div>
     * </amp-layout>\
     *
     * There are other options as well but for now lets stick with this...
     */

    const layoutType = element.attr('layout');
    if (layoutType === 'responsive') {
      element.prepend(stubs.inserts.responsiveLayout);
    } else if (layoutType === 'intrinsic') {
      element.prepend(stubs.inserts.intrinsicLayout);
    }
    // TODO: Update this with additional fills if necessary.
    // } else if (layoutType === 'container') {
    // } else if (layoutType === 'fill') {
    // } else if (layoutType === 'fixed') {
    // } else if (layoutType === 'flex-item') {
    // } else if (layoutType === 'fixed-height') {}
    return null;
  },
  /**
   * Clones and returns the children of a <template> component 3 times in order
   *    to utilize any :nth-child(even), :nth-child(odd) pseudo selectors.
   * @param {*} element - Cheerio element object
   * @param {*} $ - Cheerio doc object
   * @return {*} Cheerio element
   */
  'generateTemplateClone': (element, $) => {
    /**
     * Ingests list of data and outputs 1 template per list item. Potential
     *    solutions:
     *    1) Duplicate template structure (3) times to have access to
     *    first-child, last-child, even, odd, second, etc. css targets..
     *    2) Grab all classes outlined in template and add them to DO NOT TOUCH
     *    list...
     *    3
     *    PROBLEM: What if dynamic class exists? Throw an error? Lay out in
     *      assumptions
     */
    const templateContents = element.children().clone();
    templateContents.each((_, e) => stubs.stubClones(_, e, $))
        .each(handleNestedDynamicAttr);
    templateContents.first().attr('role', 'listitem');
    const templateContentsTwo = templateContents.clone();
    const templateContentsThree = templateContents.clone();
    const templateContentsFour = templateContents.clone();
    const listDiv = cheerio('<div role="list"></div>')
        .append(templateContents)
        .append(templateContentsTwo)
        .append(templateContentsThree)
        .append(templateContentsFour);

    return listDiv;


    /**
     * Recurse through children, checking for any attribute that contains "{{"
     *    which signifies a template literal.
     * @param {int} _ - unused index value
     * @param {*} element - Cheerio element
     */
    function handleNestedDynamicAttr(_, element) {
      const attributes = Array(['class', 'id', 'hidden']);
      const cheerioEl = cheerio(element);
      if (cheerioEl.children().length > 0) {
        cheerioEl.children().each(handleNestedDynamicAttr);
      }
      attributes.forEach((attr) => {
        if (cheerioEl.attr('class') && cheerioEl.attr('class').includes('{{')) {
          // TODO: Do something if exists!
        }
      });
    }
  },
  'inserts': {
    responsiveLayout: '<i-amphtml-sizer style="padding-top: 56.4815%;"></i-amphtml-sizer>',
    intrinsicLayout: '<i-amphtml-sizer class="i-amphtml-sizer"><img alt="" role="presentation" aria-hidden="true" class="i-amphtml-intrinsic-sizer" src="data:image/svg+xml;charset=utf-8,<svg height=&quot;610px&quot; width=&quot;1080px&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot; version=&quot;1.1&quot;/>"></i-amphtml-sizer>',
    ampImgLightbox: '<div class="i-amphtml-image-lightbox-container" style=""><div class="i-amphtml-image-lightbox-viewer"><img class="i-amphtml-image-lightbox-viewer-image" src="..." style="..."></div><div id="lightbox1-caption" class="amp-image-lightbox-caption i-amphtml-image-lightbox-caption i-amphtml-empty"></div></div><button class="i-amphtml-screen-reader">Close the lightbox</button>',
  },
  /**
   * Function to recurse through element and make stubs. To be used when a stub
   *    function requires creating a clone since the clones will not be iterated
   *    through in the initial Stubs() call.
   * @param {int} _ - unused index value
   * @param {*} element - Cheerio element
   * @param {*} $ - Cheerio doc object
   */
  'stubClones': (_, element, $) => {
    const cheerioEl = cheerio(element);
    if (cheerioEl.children().length > 0) {
      cheerioEl.children().each((_, el) => stubs.stubClones(_, el, $));
    }
    if (element.type === 'tag' && stubs[element.name]) {
      stubs[element.name](cheerioEl, $);
    }
  },
  /**
   * Checks whether [layout] attribute indicates a stub and stubs element if
   *    necessary
   * @param {*} element - Cheerio element
   * @param {*} $ - Cheerio doc object
   */
  'stubLayout': (element, $) => {
    if (element.attr('layout')) {
      stubs.layout(element, $);
    }
  },
};

/**
 * Iterates through the document and adds all necessary stubs.
 * @param {*} $ - Cheerio Dom element
 */
function stubPage($) {
  $('*').each((_, el) => {
    if (el.type === 'tag' && stubs[el.name]) {
      stubs[el.name](cheerio(el), $);
    }
  });
}


module.exports = stubPage;
