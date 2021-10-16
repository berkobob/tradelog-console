const yargs = require('yargs')
const { describe } = require('yargs')
const {hideBin} = require('yargs/helpers')

const load = require('./src/load')
const list = require('./src/list')

yargs(hideBin(process.argv))
    .usage('$0 <cmd> [args] [options]')
    .command(
        'load [filename]',
        'Load trades for csv and send to tradelog',
        args => {
            args.positional('filename', {
                type: 'string',
                describe: 'The filename of the csv to load'
            })
        },
        (argv) => load(argv.filename, argv.verbose, argv.pause))
    .command(
        'list [dirname]',
        'List all the CSV files in the current directory',
        args => {
            args.positional('dirname', {
                type: 'string',
                describe: 'The directory to list csv files'
            }),
                args('poo')
        },
        (argv) => list(argv.dirname, argv.verbose)
    ) // #TODO Add a pause between trades flaf to load
    .option('verbose', {
        type: 'boolean',
        alias: 'v',
        default: false,
        describe: 'Show verbose output instead of a summary'
    })
    .option('pause', {
        type: 'boolean',
        alias: 'p',
        default: false,
        describe: 'Pause between each record by waiting for a key stroke'
    })
    .help()
    .parse()