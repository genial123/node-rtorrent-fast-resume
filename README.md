# node-rtorrent-fast-resume

Module for adding rtorrent resume metadata to torrent files.


## Installation

```bash
npm install -g rtorrent-fast-resume
```


## Usage

#### CLI

```bash
rtorrent-fast-resume [base-directory] < plain.torrent > with_fast_resume.torrent
rtorrent-fast-resume [base-directory] plain.torrent [with_fast_resume.torrent]
```

#### Node

```js
const fs = require('fs');
const fastResume = require('rtorrent-fast-resume');

const dataPath = '/path/to/data';
const torrent = fs.readFileSync('/path/to/input.torrent');

fastResume(torrent, dataPath).then((torrentWithFastResume) => {
    fs.writeFileSync('/path/to/output.torrent', torrentWithFastResume);
});
```


## License

[MIT](LICENSE)
