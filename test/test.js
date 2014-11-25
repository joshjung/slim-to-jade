var assert = require('assert'),
	S2J = require('../src/SlimToJade');

describe('slim-to-jade', function() {
	describe('basic tests', function() {
		var ha = new HashArray(['key'], function(type) {
			it('Should callback with "construct"', function() {
				assert.equal(type, 'construct');
			});
		});

		it('Should have a all.length of 0.', function() {
			assert.equal(ha.all.length, 0);
		});

		it('Should have a map with no keys.', function() {
			for (var key in ha.map)
				assert.equal(true, false);
		});
    
		var ha2 = new HashArray('key');

		it('should work with a single key not wrapped in an array.', function() {
				assert.deepEqual(ha2.keyFields, ['key']);
		});
	});
});