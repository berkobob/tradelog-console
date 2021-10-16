const term = require('terminal-kit').terminal
const csv = require('csvtojson')
const axios = require('axios')
const readline = require('readline-sync')

let axiosConfig = {
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
    },
};

module.exports = async (filename, verbose, pause) => {
    
    if (filename == undefined) {
        term('Choose a file to load: ')
        filename = await term.fileInput({
            baseDir: './',
            cancelable: true
        });
        term.processExit()
    }
    
    if (verbose) term('Loading files from %s\n', filename)
 
    try {
        const trades = await csv().fromFile(filename)
        if (verbose) await long(trades, pause)
        else await short(trades)
    } catch (error) {
        term.red(error)
    }    
}

async function long(trades, pause) {
    term.blink('There are %d trades to process\n', trades.length)

    for (const index in trades) {
        let msg = ''
        try {
            // var spinner = await term.spinner();
            term.yellow(' Trade %d: %s', index, trades[index].Description);
            const result = await axios.post(
                'http://localhost:8080/trade',
                trades[index],
                axiosConfig
            );
            // await spinner.destroy()
            term.eraseLine()
                .column(0)
                .green.bold(' ✓ ')
                .white('Trade %d: %s\n', index, result.data.msg);
        } catch (error) {
            // await spinner.destroy()
            let msg = ""
            if (error.response == undefined) msg = error.message
            else {
                if (error.response.data.errors == undefined)
                    msg = error.response.data.error;
                else
                    error.response.data.errors.forEach(error => msg += error.message + '. ')
            }
            term.eraseLine()
                .column(0)
                .red.bold(' X ')
                .white('Trade %d: %s - Errors: %s\n', index, trades[0].Description, msg);
        } finally {
            if (pause) {
                readline.keyInPause('', { hideEchoBack: true, mask: '' });
            } else await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    term.processExit()
}  

async function short(trades) {
    const progressbar = term.progressBar({
        title: 'Processing trades:',
        percent: true,
        items: trades.length,
        eta: true
    })

    const errors = []
    for (const trade of trades) {
        progressbar.startItem(trade.Description)
        try {
            const result = await axios.post(
                'http://localhost:8080/trade',
                trade,
                axiosConfig
            )
        } catch (e) {
            if (e.response.data.errors == undefined)
                errors.push({ trade: trade, errors: [{ message: e.response.data.error }]})
            else
            errors.push({trade: trade, errors: e.response.data.errors})
        } finally {
            progressbar.itemDone(trade)
        }
    }
    
    term('\n')
    errors.forEach(error => {
        const description = error.trade.Description
        error.errors.forEach(error =>
            term('%s failed with %s\n', description, error.message)
        );
    })
}