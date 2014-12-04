var commander = require('commander'),
  S2J = require('./src/SlimToJade'),
  fs = require('fs');

commander.version('0.0.1').
  usage('[options] <file ...>').
	parse(process.argv);

commander.args.forEach(function (fn) {
  S2J.convert(fs.readFileSync(fn).toString(), function (lines) {
  	process.stdout.write(lines);
  });
});