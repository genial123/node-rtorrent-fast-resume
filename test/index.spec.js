/*
 * rtorrent-fast-resume
 */

const { assert } = require('chai');
const wtFixtures = require('webtorrent-fixtures');
const bencode = require('bencode');
const fastResume = require('./../');

const fixtures = Object.values(wtFixtures).filter(f => f.torrent && f.torrentPath && f.contentPath);


/*
 * Run tests
 */

describe('rtorrent-fast-resume', () => {
    fixtures.forEach((fixture) => {
        it(`should add resume metadata to fixture "${fixture.torrentPath}"`, async () => {
            const result = await fastResume(fixture.torrent, fixture.contentPath);

            assert.isNotEmpty(result);
            assert.instanceOf(result, Buffer);

            const meta = bencode.decode(result);

            assert.isObject(meta.libtorrent_resume);
            assert.isNumber(meta.libtorrent_resume.bitfield);
            assert.isArray(meta.libtorrent_resume.files);
            assert.isNotEmpty(meta.libtorrent_resume.files);

            meta.libtorrent_resume.files.forEach((file) => {
                assert.strictEqual(file.priority, 1);
                assert.isNumber(file.completed);
                assert.isNumber(file.mtime);
            });
        });
    });
});
