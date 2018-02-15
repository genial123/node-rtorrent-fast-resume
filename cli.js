#!/usr/bin/env node

const Promise = require('bluebird');
const getStdin = require('get-stdin');
const fs = Promise.promisifyAll(require('fs'));
const fastResume = require('./index');


/*
 * Usage:
 * rtorrent-fast-resume [base-directory] < plain.torrent > with_fast_resume.torrent
 * rtorrent-fast-resume [base-directory] plain.torrent [with_fast_resume.torrent]
 */

(async function main() {
    try {
        let torrentBuf;
        const stdin = await getStdin.buffer();
        let [dataPath, inputPath, outputPath] = process.argv.slice(2, process.argv.length); // eslint-disable-line prefer-const

        /* Default args */
        if (!stdin.length && dataPath && !inputPath) {
            inputPath = dataPath;
            dataPath = null;
        }

        if (!dataPath) {
            dataPath = process.cwd();
        }

        /* Check data path */
        await fs.accessAsync(dataPath);

        /* Input file */
        if (stdin.length) {
            torrentBuf = stdin;
        }
        else if (inputPath) {
            torrentBuf = await fs.readFileAsync(inputPath);
        }
        else {
            throw new Error('Invalid input torrent file');
        }

        /* Result */
        const result = await fastResume(torrentBuf, dataPath);

        if (outputPath) {
            await fs.writeFileAsync(outputPath, result);
        }
        else {
            process.stdout.write(result);
        }
    }
    catch (e) {
        process.stderr.write(`${e.message}\n\n`);
        process.stderr.write('Usage:\trtorrent-fast-resume [base-directory] < plain.torrent > with_fast_resume.torrent\n');
        process.stderr.write('\trtorrent-fast-resume [base-directory] plain.torrent [with_fast_resume.torrent]\n');
        process.exit(1);
    }
})();
