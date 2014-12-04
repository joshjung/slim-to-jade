var Tokenizer = require('tokenizer');

var S2J = function () {};
S2J.prototype = {
  convert: function (input, callback) {
    var self = this,
        t = new Tokenizer(undefined, {
          split: /\r?\n/
        });

    // Maps a depth to the very last node that the tokenizer saw at that depth. Useful for the pipe.
    this.depthToNode = [];
    this.nodes = [];
    this.depth = 0;

    // ALPHA = 'ALPHA' 
    // | ALPHA \n
    t.addRule(/^\|.*\n/, 'tPipeEndOfLine');
    // text to end of line \n
    t.addRule(/^[^\=]+\n$/, 'valueEndOfLine');
    // key="val"
    t.addRule(/^([a-zA-Z0-9\-_]+\s*?=\s*?)(["'])(\\\2|[^"']+)*?\2/, 'tKeyValue');
    // ALPHA
    t.addRule(/^[a-zA-Z0-9\-_]+/, 'tIdentifier');
    // #ALPHA
    t.addRule(/^[#][a-zA-Z0-9\-_]+/, 'tIdName');
    // .ALPHA
    t.addRule(/^\.[a-zA-Z0-9\-_]+/, 'tClassName');
    // whitespace
    t.addRule(/^[ \t]+/, 'tWhitespace');

    t.on('token', function (token, type) {
      console.log('tok:', token.content);
      self[type](token);
    });

    t.on('split', function (splitter) {
      self.tEOL();
    });

    t.end(input, function () {
      self.flush();
      callback(self.final);
    });
  },
  flush: function() {
    var self = this,
        final = '';

    this.nodes.forEach(function (node) {
      final += new Array(node.depth).join('  ') + (node.depth == 1 ? '  ' : '');
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
        }).join('') + ')' + (node.content || '');
      }
      final += '\n';
    });

    this.final = final;
  },
  updateNode: function (element, id, clazz, attr, content) {
    if (!this.node)
    {
      this.node = {
        depth: this.depth,
        classes: [],
        attrs: [],
        content: ''
      };
      this.nodes.push(this.node);
      this.depthToNode[this.depth] = this.node;
    }

    this.node.element = element || this.node.element;
    this.node.id = id || this.node.id;
    this.node.content += content || '';

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

    this.updateNode(undefined, undefined, undefined, {
      key: s[0],
      value: s[1]
    });
  },
  valueEndOfLine: function (token) {
    this.updateNode(undefined, undefined, undefined, undefined, token.content.replace('\n', ''));
  },
  tWhitespace: function (token) {
    if (!this.node) {
      var c = 0;

      for (var i = 0; i < token.content.length; i++)
        c += (token.content.substr(i, 1) == '\t') ? 1 : 0.5;

      this.depth = Math.round(c);
    }
  },
  tEOL: function (token) {
    this.depth = 0;
    this.node = undefined;
  },
  tPipeEndOfLine: function (token) {
    this.node = undefined;

    // Track back to last node at this depth.
    var i = this.depth;

    while (!this.node && i != -1)
      this.node = this.depthToNode[this.depth - (i--)];

    if (!this.node)
      throw Error('Unable to find node at depth ' + (this.depth-1));

    this.updateNode(undefined, undefined, undefined, undefined, token.content)
  }
};

module.exports = new S2J();