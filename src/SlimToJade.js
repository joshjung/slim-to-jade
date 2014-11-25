var Tokenizer = require('./Tokenizer');

var S2J = function () {};
S2J.prototype = {
  convert: function (input, callback) {
    var t = new Tokenizer(undefined, {split: /\n/}),
      self = this;

    this.nodes = [];
    this.depth = 0;

    // ALPHA = 'ALPHA' 
    // ([a-zA-Z0-9\-_]+=)(["'])(?:\\\2|.)*?\2
    t.addRule(/^([a-zA-Z0-9\-_]+\s*?=\s*?)(["'])(\\\2|[^"']+)*?\2$/, 'tKeyValue');
    // ALPHA
    t.addRule(/^[a-zA-Z0-9\-_]+$/, 'tIdentifier');
    // #ALPHA
    t.addRule(/^[#][a-zA-Z0-9\-_]+$/, 'tIdName');
    // .ALPHA
    t.addRule(/^\.[a-zA-Z0-9\-_]+$/, 'tClassName');
    // \n
    t.addRule(/^\r?\n$/, 'tEOL');
    // whitespace
    t.addRule(/^[ \t]+$/, 'tWhitespace');

    t.on('token', function (token, type) {
      self[type](token);
    });

    t._tokenize(input);
    self.flush();
    callback(self.final);
  },
  flush: function() {
    var self = this,
      final = '';
    
    this.nodes.forEach(function (node) {
      final += new Array(node.depth).join(' ');
      final += node.element ? node.element : '';
      final += node.id ? node.id : '';
      final += node.classes.map(function (c) {
        return '.' + c;
      }).join('');

      if (node.attrs.length)
      {
        var needsComma = false;
        final += '(' + node.attrs.map(function (a) {
          return ((a == node.attrs[node.attrs.length-1] && a != node.attrs[0]) ? ',' : '') + (a == node.attrs[0] ? '' : ' ') + a.key + '=' + a.value;
        }).join('') + ')';
      }
      final += '\n';
    });
    
    this.final = final;
  },
  updateNode: function (element, id, clazz, attr) {
    if (!this.node)
    {
      this.node = {
        depth: this.depth,
        classes: [],
        attrs: []
      };
      this.nodes.push(this.node);
    }

    this.node.element = element || this.node.element;
    this.node.id = id || this.node.id;

    if (clazz)
      this.node.classes.push(clazz);
    if (attr)
      this.node.attrs.push(attr)
  },
  tIdentifier: function (token) {
    this.updateNode(token.content)
  },
  tIdName: function (token) {
    this.updateNode(undefined, token.content);
  },
  tClassName: function (token) {
    this.updateNode(undefined, undefined, token.content.substr(1));
  },
  tKeyValue: function (token) {
    var s = token.content.split('=');
    
    this.updateNode(undefined, undefined, undefined, {key: s[0], value: s[1]});
  },
  tWhitespace: function (token) {
    // Beginning of line?
    if (!this.node) {
      this.depth = token.content.length;
    }
  },
  tEOL: function (token) {
    console.log('TO END OF LINE', token.content);
    this.node = undefined;
  }
};

module.exports = new S2J();