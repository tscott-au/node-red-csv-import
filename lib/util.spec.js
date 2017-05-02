'use strict'
/* global expect */
const projUtil = require('./util')

describe('Util module', () => {
  describe('filterArray', () => {
    it('should export a function', () => {
      expect(projUtil.filterArray).to.be.a('function')
    })

    it('should be have an array as param 1', () => {
      expect(function () { projUtil.filterArray() }).to.throw('Parameter: "source" was not an Array')
    })

    it('should be have an array as param 2', () => {
      expect(function () { projUtil.filterArray([]) }).to.throw('Parameter: "filters" was not an Array')
    })

    it('should return an object', () => {
      expect(projUtil.filterArray([], [])).to.be.eql({matched: [], unmatched: []})
    })

    var source = ['a', 'b', 'c', 'foo', 'bar']

    it('should return unmatched items', () => {
      expect(projUtil.filterArray(source, [])).to.be.eql({matched: [], unmatched: source})
    })

    it('should return expected items', () => {
      expect(projUtil.filterArray(source, source)).to.be.eql({matched: source, unmatched: []})
    })

    it('should return items filtered ', () => {
      var filter = ['b', 'bar']
      var unmatched = ['a', 'c', 'foo']
      expect(projUtil.filterArray(source, filter)).to.be.eql({matched: filter, unmatched: unmatched})
    })

    it('should return items filtered and sorted ', () => {
      var filter = ['bar', 'b']
      var unmatched = ['a', 'c', 'foo']
      expect(projUtil.filterArray(source, filter)).to.be.eql({matched: filter, unmatched: unmatched})
    })

    it('should allow a custom comparer ', () => {
      var filter = ['BAR', 'b']
      var matched = ['bar', 'b']
      var unmatched = ['a', 'c', 'foo']
      var customComparer = function (a, b) { return a.toLowerCase() === b.toLowerCase() }
      expect(projUtil.filterArray(source, filter, customComparer)).to.be.eql({matched: matched, unmatched: unmatched})
    })

    it('should allow a custom comparer negative check ', () => {
      var filter = ['BAR', 'b']

      var customComparer = function (a, b) { return false }
      expect(projUtil.filterArray(source, filter, customComparer)).to.be.eql({matched: [], unmatched: source})
    })

    it('should allow a custom comparer negative check ', () => {
      var filter = ['BAR', 'b']
      var customComparer = function (a, b) { return true }
      expect(projUtil.filterArray(source, filter, customComparer)).to.be.eql({matched: source, unmatched: []})
    })

    it('should allow a custom sorter ', () => {
      var filter = ['bar', 'b']
      var reverseMatch = ['b', 'bar']
      var unmatched = ['a', 'c', 'foo']
      var customSorter = function (a, b) { return b.filterIdx - a.filterIdx }
      expect(projUtil.filterArray(source, filter, undefined, customSorter)).to.be.eql({matched: reverseMatch, unmatched: unmatched})
    })

    it('should allow a custom transformer ', () => {
      var filter = ['bar', 'b']
      var result = [{'value': 'bar', 'filterIdx': 0}, {'value': 'b', 'filterIdx': 1}]
      var unmatched = ['a', 'c', 'foo']
      var customTransformer = function (ele) { return ele }
      expect(projUtil.filterArray(source, filter, undefined, undefined, customTransformer)).to.be.eql({matched: result, unmatched: unmatched})
    })
  })

  describe('filterArrayRegEx', () => {
    it('should export a function', () => {
      expect(projUtil.filterArrayRegEx).to.be.a('function')
    })

    var found = ['c:\\one.txt',
      'c:\\abc\\def\\two.txt',
      'c:/three.txt'
    ]
    it('should return unexpected items', () => {
      expect(projUtil.filterArrayRegEx(found, [])).to.be.eql({matched: [], unmatched: found})
    })

    it('should be a regex success', () => {
      var value = '123456789one.txt'
      var regExfilter = 'one.txt'
      expect(value.search(regExfilter)).to.be.eql(9)
    })

    it('should return expected items', () => {
      var expected = ['/.*one.txt/', '/.*two.txt/', '/.*three.txt/'].map(projUtil.toRegEx)
      expect(projUtil.filterArrayRegEx(found, expected)).to.be.eql({matched: found, unmatched: []})
    })

    it('should return expected items 2', () => {
      var expected = ['/.*one.txt/', '/.*three.txt/', '/.*two.txt/'].map(projUtil.toRegEx)
      expect(projUtil.filterArrayRegEx(found, expected, undefined)).to.be.eql({matched: [found[0], found[2], found[1]], unmatched: []})
    })
  })

  describe('expectedSourceFiles', () => {
    it('should support regex matches', () => {
      expect('asdf\\POLICY.CSV'.search('POLICY.CSV$')).to.be.eq(5)
    })

    var expressions = ['/.*policy.csv$/i', '/.*risk.csv/', '.*policY.*'].map(projUtil.toRegEx)

    var tests = [
    {args: ['/sadf/asdf/policY.csv', expressions[0]], descr: 'Case insensitive match', expected: true},
    {args: ['/sadf/asdf/policY.csv/ss', expressions[0]], descr: 'non match', expected: false},
    {args: ['/sadf/asdf/risk.csv', expressions[1]], descr: 'match', expected: true},
    {args: ['/sadf/asdf/risk.csv/ss', expressions[1]], descr: 'match anywhere', expected: true},
    {args: ['/sadf/asdf/policY.csv', expressions[2]], descr: 'Case match', expected: true},
    {args: ['/sadf/asdf/policY.csv/ss', expressions[2]], descr: 'Case match', expected: true}

    ]

    tests.forEach(function (test) {
      it('should do a ' + test.descr, function () {
        var res = projUtil.regExComparer.apply(null, test.args)
        expect(res).to.be.eq(test.expected)
      })
    })
  })
})
