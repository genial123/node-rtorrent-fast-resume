/*
 * rtorrent-fast-resume
 */

const path = require('path');
const Promise = require('bluebird');
const bencode = require('bencode');
const fs = Promise.promisifyAll(require('fs'));


module.exports = async (torrentBuf, dataPath) => {
    const dataStat = await fs.statAsync(dataPath);

    /* Read and parse metadata */
    const metadata = bencode.decode(torrentBuf);
    const isSingleFileTorrent = !('files' in metadata.info);

    const torrentLength = metadata.info.length;
    const torrentPieceLength = metadata.info['piece length'];
    const torrentPieces = metadata.info.pieces;
    const torrentName = metadata.info.name.toString('utf-8');

    let torrentFiles = metadata.info.files;
    let offset = 0;

    /* Prepare resume data */
    const resume = {
        bitfield: Math.floor(torrentPieces.length / 20)
    };

    /* Single file torrents have no files array */
    if (isSingleFileTorrent) {
        torrentFiles = [{
            path: [dataStat.isDirectory() ? torrentName : ''],
            length: torrentLength
        }];
    }
    else {
        try {
            const subdirPath = path.join(dataPath, torrentName);
            const subdirStat = await fs.statAsync(subdirPath);

            if (subdirStat.isDirectory()) {
                dataPath = subdirPath;
            }
        }
        catch (e) {
            /* noop */
        }
    }

    /* Process files */
    const processFile = async (torrentFile) => {
        const torrentPaths = torrentFile.path.map(p => p.toString('utf-8'));
        const filePath = path.resolve(path.join(dataPath, ...torrentPaths));
        const fileStat = await fs.statAsync(filePath);

        /* Ensure file size match */
        if (fileStat.size !== torrentFile.length) {
            throw new Error(`File size mismatch for ${filePath}, expected: ${torrentFile.length} got: ${fileStat.size}`);
        }

        /* Calculate completed pieces */
        const completedLength = (offset + torrentFile.length + torrentPieceLength);
        const completedPieces = Math.floor((completedLength - 1) / torrentPieceLength);
        const offsetPieces = Math.floor(offset / torrentPieceLength);
        offset += torrentFile.length;

        return {
            priority: 1,
            mtime: Math.floor(fileStat.mtime / 1000),
            completed: (completedPieces - offsetPieces)
        };
    };

    /* Wait for file processing */
    resume.files = await Promise.mapSeries(torrentFiles, processFile);

    /* Set resume data and return encoded torrent */
    metadata.libtorrent_resume = resume;
    return bencode.encode(metadata);
};
