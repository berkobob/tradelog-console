const term = require('terminal-kit').terminal
const fs = require('fs')

module.exports = (path='.', verbose) => {
    if (verbose) term('List of files in the %s directory\n', path)
    fs.readdir(path, (error, files) => {
        if (error) return term.red(error)
        files
            .filter(file => file.substr(file.length - 3) == 'csv')
            .forEach((file, x) => term.green('%d: %s\n', x+1, file));
    })
}