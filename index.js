var commander = require('commander'),
  path=require('path'),
  S2J = require('./src/SlimToJade'),
  fs = require('fs');

commander.
  version('0.0.1').
  usage('[options] <file ...>').
  option('-d, --directory <dir>', 'Apply to a directory and all its children.').
    parse(process.argv);

if (commander.directory)
{
  commander.directory = path.resolve(__dirname, commander.directory);
  console.log('Converting directory', commander.directory);

  find(commander.directory, function (files) {
    files.forEach(function (fn) {
      console.log('Converting: ', fn);
      new S2J(function (err) {
        err.message += ' in ' + fn;
        throw err;
      }).convert(fs.readFileSync(fn).toString(), function (err, lines) {
        fs.writeFileSync(fn.replace('.slim', '.jade'), lines);
      });
    });
  }, function (file, fn) {
    return fn.indexOf('.slim') != -1 ? fn : null;
  })
}
else
{
  commander.args.forEach(function (fn) {
    new S2J().convert(fs.readFileSync(fn).toString(), function (err, lines) {
      process.stdout.write(lines);
    });
  });
}

function find(dir, callback, filter, recurse, found, waiter) {
  waiter = waiter ? waiter : {
    waitCount: 0
  };

  found = found ? found : [];
  recurse = recurse == null ? true : recurse;

  waiter.waitCount++;

  fs.readdir(dir, function(err, files) {
    if (err) {
      console.log(err);
      return;
    }

    var filteredFiles = [];

    for (var i = 0; i < files.length; i++) {
      var filename = dir + '/' + files[i];
      var stat = fs.statSync(filename);

      var findToken = null;

      if (stat.isDirectory()) {
        find(filename, callback, filter, recurse, found, waiter);
      } else if (!filter || (findToken = filter(files[i], filename, stat))) {
        found.push(findToken);
      }
    }

    waiter.waitCount--;

    if (waiter.waitCount == 0) {
      callback(found);
    }
  });
};