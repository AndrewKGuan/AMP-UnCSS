

const stubs = {
  /*
   TODO: Need to write function that checks and handles [layout="responsive"] &
   [layout="..."]
   */
  'amp-3d-gltf': () => false,
  'amp-3q-player': () => false,
  'amp-access': () => false, // Fully described HTML. However, can use <template>
  'amp-access-laterpay': () => false,
  'amp-accordion': () => {
    /**
     * Any section can be expanded or not expanded. Potential ways to handle:
     *    1) Duplicate section and give it [expanded] attribute.
     *    2) Toggle [expanded] and test CSS this way
     *    3) Ignore [expanded] attributes in style descriptors
     */
    return null;
  },
  'amp-ad': () => false, // May need Puppeteer.
  'amp-ad-exit': () => false,
  'amp-addthis': () => false, // Contains own CSS. Only need to target element.
  'amp-analytics': () => false, // No need for CSS.
  'amp-anim': () => {
    /**
     * 1) Inserts <img> tag
     * 2) Nested elements are prepended to the <amp-anim> tag.
     * 3) Supports Layouts
     */
    return null;
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
  'amp-brightcove': () => false, // TODO: Supports Layouts
  'amp-byside-content': () => false,
  'amp-call-tracking': () => false,
  'amp-carousel': () => {
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
     *   <div class="amp-carousel-button amp-carousel-button-prev" role="button"/>
     *   <div class="amp-carousel-button amp-carousel-button-next" role="button"/>
     * </amp-carousel ...>
     */
    return null;
  },
  'amp-consent': () => false, // No DOM manipulation
  'amp-dailymotion': () => false,
  'amp-date-countdown': () => false,
  'amp-date-display': () => false, // Requires <template> tag but self describes DOM
  'amp-date-picker': () => false, // Can include nested elements which shouldn't need any work. However, base calendar build is complicated. Should we target this?
  'amp-embed': () => false,
  'amp-embedly-card': () => false,
  'amp-experiment': () => {
    /**
     * <body> tag is updated with [amp-x-experimentName="experimentVariable"]
     *  as defined by the experiment JSON. In theory, we could simply append each
     *  data value to the body tag to cover all bases. This would be an On^2
     *  operation, but n would be small as it is hand written.
     */
    return null;
  },
  'amp-facebook': () => false, // Loads an iFrame. No styling occurs
  'amp-facebook-comments': () => false, // Loads an iFrame. No styling occurs
  'amp-facebook-like': () => false, // Loads an iFrame. No styling occurs
  'amp-facebook-page': () => false, // Loads an iFrame. No styling occurs
  'amp-fit-text': () => false,
  'amp-font': () => {
    /**
     * The extension observes loading of a font and when it loads executes the
     *    optional attributes on-load-add-class and on-load-remove-class and
     *    when there is any error or timeout runs on-error-remove-class and
     *    on-error-add-class. These classes are toggled on the documentElement
     *    for standalone documents, and on body for documents without a
     *    documentElement i.e. inside a ShadowRoot.
     *
     *    We should add all possible on-* tags to both the body and the root
     *    to cover all bases.
     */
    return null;
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
  'amp-google-document-embed': () => {}, // TODO: Supports layouts
  'amp-google-vrview-image': () => false,
  'amp-hulu': () => false,
  'amp-iframe': () => {
    /**
     * if [layout="responsive"]:
     * @code
     *  <!-- INSERT -->
     *    <i-amphtml-sizer></i-amphtml-sizer>
     *  <!-- END INSERT -->
     *  <!-- Wrap iFrame -->
     *    <i-amphtml-scroll-container>
     *      <iFrame src="..." />
     *    </i-amphtml-scroll-container>
     *  <!-- END WRAP -->
     */
    return null;
  },
  'amp-ima-video': () => false,
  'amp-image-lightbox': () => {
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
    return null;
  },
  'amp-image-slider': () => false,
  'amp-imgur': () => false,
  'amp-instagram': () => false,
  'amp-install-serviceworker': () => false, // Not a visual element
  'amp-izlesene': () => false,
  'amp-jwplayer': () => false,
  'amp-kaltura-player': () => false,
  'amp-layout': () => {
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
    return null;
  },
  'amp-lightbox': () => false, // Only updates amp-boilerplate classes. Shouldn't need any work.
  'amp-lightbox-gallery': () => false,
  'amp-list': () => {
    /**
     * @code
     * <amp-list ...>
     *   <misc-elements />
     * </amp-list>
     *
     * Becomes
     * @code
     * <amp-list ...>
     *   <div role="list">
     *     <misc-elements role="listitem" />
     *     <misc-elements role="listitem" />
     *   </div>
     * </amp-list>
     *
     * Similar to template, it may make sense to stub out the <misc-elements>
     *   2 or 3 times to cover child selectors.
     */
    return null;
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
  'amp-sidebar': () => {
    /**
     * <amp-sidebar> with a nested <nav> element have a special behaviour where
     *    the nave element is duplicated outside the toolbar when a given media-
     *    query is met. To facilitate this, we need to check for the existence
     *    of <nav>, copy it and it's child elements, and paste them in the
     *    [toolbar-target].
     */
    return null;
  },
  'amp-social-share': () => false,
  'amp-soundcloud': () => false,
  'amp-sticky-ad': () => false,
  'amp-story': () => false,
  'amp-subscriptions': () => false,
  'amp-subscriptions-google': () => false,
  'amp-springboard-player': () => false,
  'amp-timeago': () => false,
  'amp-twitter': () => {}, // TODO: Supports layouts
  'amp-user-notification': () => false,
  'amp-video-iframe': () => false,
  'amp-video': () => false,
  'amp-viqeo-player': () => false,
  'amp-vimeo': () => false,
  'amp-vine': () => {}, // TODO: Supports layouts
  'amp-vk': () => false,
  'amp-viz-vega': () => false,
  'amp-web-push': () => false,
  'amp-wistia-player': () => false,
  'amp-yotpo': () => false,
  'amp-youtube': () => {}, // TODO: Supports layouts
  'template': () => {
    /**
     * Ingests list of data and outputs 1 template per list item. Potential
     *    solutions:
     *    1) Duplicate template structure (3) times to have access to
     *    first-child, last-child, even, odd, second, etc. css targets..
     *    2) Grab all classes outlined in template and add them to DO NOT TOUCH
     *    list...
     */
  },
};

module.exports = stubs;
