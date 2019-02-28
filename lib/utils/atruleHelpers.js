

module.exports = {
'charset': false,
'import': false,
'namespace': false,
'media': true,
'supports': false,
'document': false,
'page': false,
'font-face': false,
'keyframes': function stashKeyframe(node, cssSelectors) {
   cssSelectors.keyFrames.add({ruleName: node.params, ref: node});
},
'viewport': false,
'counter-style': false,
'font-feature-values': false,
'swash': false,
'ornaments': false,
'annotation': false,
};

