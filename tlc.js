import ora from 'ora'
import axios from 'axios'
import csv from 'csvtojson'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import fs from 'fs'
import printer from 'console-table-printer'
import { table } from 'console'

let axiosConfig = {
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        "Access-Control-Allow-Origin": "*",
    }
};


const argv = yargs(hideBin(process.argv))
    .usage('$0 <cmd> [args]')
    .command('load <filename>', 'Load trades from csv', (args) => {
        args.positional('filename', {
            type: 'string',
            describe: 'The filename of csv to load',
            required: true
        })
    }, function (argv) {
        loadTrade(argv.filename, argv.verbose)
    })
    .command('list', 'List the available csv files', (args) => { },
        function (args) {
            list(args.verbose)
        })
    .command('trades', 'Find trades', (args) => { }, function (args) {
        trades(args.verbose)
    })
    .option('verbose', {
        alias: 'v'
    })
    .help()
    .argv


async function loadTrade(filename = 'test.csv', verbose = false) {
    console.log(`Verbose: ${verbose}`)
    let trades
    try {
        trades = await csv().fromFile(filename)
        if (verbose) console.log(`There are ${trades.length} trades`)
    } catch (error) {
        return console.log('File name does not exist or could not be loaded\n', error.message)
    }

    for (const trade of trades) {
        const spinner = ora(`Trading ${trade.Symbol} - ${trade.Portfolio}: `).start()
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
            const result = await axios.post('http://localhost:8080/trade', trade, axiosConfig)
            if (verbose) spinner.succeed(`${JSON.stringify(result.data.success)}`)
            else
                spinner.succeed(result.data.success.portfolio)
        } catch (error) {
            if (error.response == undefined)
                spinner.fail(error.message)
            else
                if (verbose)
                    spinner.fail(JSON.stringify(error.response.data.errors))
                else
                    spinner.fail(`Trade failed with ${error.response.data.errors.length} error(s)`)
        } finally {
        }
    }
}

async function list(verbose = false) {
    console.log(`Verbose: ${verbose}`)
    if (verbose) console.log('List files in current directory')
    fs.readdir('.', { withFileTypes: false }, (err, files) => {
        console.log(err)
        files.forEach((file) => { if (file.substr(file.length - 3) == 'csv') console.log(file) })
    })
}

async function trades(verbose = false) {
    try {
        const results = await axios.get('http://localhost:8080/trade', axiosConfig)
        // console.log(results.data)
        const data = results.data.map((trade) => {
            // trade.date = dateformat(trade.date, "dd/mm/yy")
            // trade.expiry = dateformat(trade.expiry, "dd/mm/yy")
            trade.date = trade.date.replace(/\T.+/, '')
            trade.expiry = trade.expiry.replace(/\T.+/, '')
            delete (trade._id)
            delete (trade.__v)
        })
        table(results.data)
    } catch (error) {
        console.log(error.message)
    }
}