/*
    TODO:
        * file output
        * collect/capture *logs*
        * handle overflow
        * input?
*/

const chalk = require('chalk')
const stripAnsi = require('strip-ansi')
const moment = require('moment-timezone')

const zone = moment.tz.guess()
const now = () => moment().tz(zone).format('YYYY-MM-DD HH:mm:ss z')

const theme = {
    text: chalk.rgb(220, 220, 220),
    param: chalk.rgb(0, 86, 255),
    error: chalk.rgb(204, 25, 25),
    warn: chalk.rgb(255,140,0),
    debug: chalk.bold.rgb(21, 175, 254),

    title: chalk.rgb(255, 255, 255).bold,
    outline: chalk.rgb(120, 28, 206),
    label: chalk.rgb(150, 150, 150),

    log: {
        time: chalk.rgb(120, 120, 120),
        category: chalk.rgb(240, 230, 55)
        // category: chalk.rgb(255, 160, 0)
        // category: chalk.rgb(240, 30, 225)
    },

    check: {
        pass: chalk.bold.rgb(28, 246, 51),
        fail: chalk.bold.rgb(246, 28, 51)
    },

    progress: {
        status: chalk.rgb(118, 156, 21),
        complete: chalk.rgb(28, 246, 51)
    }
}

const pad = text => {
    max = process.stdout.columns - 4
    text = [' ', ...text.split('\n'), ' ']
    for (let i=0; i < text.length; i++) {
        if (text[i].length > max) {
            const line = text[i].substr(0, max)
            const extra = text[i].substr(max)
            text[i] = line
            text.splice(i + 1, 0, `        ${extra}`)
        }
    }
    return text.map(x => `  ${x.padEnd(max)}  `).join('\n')
}

const BARS_MAX_PROGRESS = 20
const BARS_PROGRESS_CHAR = '█'
const BARS_BLOCK_CHAR = theme.outline('█')

module.exports = {
    title (text, width) {
        width = Math.min(Math.max(text.length, width), process.stdout.columns)
        const border = theme.outline('—'.repeat(width))
        console.log(`${border}\n${theme.title(text)}\n${border}`)
    },
    lines ({ title, lines } = {}) {
        if (title) {
            const textWidth = lines.reduce((a, c) => c.length > a ? c.length : a, 0) + 3
            this.title(title, textWidth)
        }
        lines.forEach(line => {
            console.log(`  ${theme.text(line)}`)
        })
    },
    options ({ title, options } = {}) {
        let maxAliasListLength = 0
        options = options.map(x => {
            const aliases = x.aliases.join(', ')
            if (maxAliasListLength < aliases.length) maxAliasListLength = aliases.length
            x.aliasList = aliases
            return x
        })
        if (maxAliasListLength < 9) maxAliasListLength = 9
        options = options.map(x => {
            x.aliasList = x.aliasList.padEnd(maxAliasListLength)
            return `${theme.param(x.aliasList)}  — ${theme.text(x.description)}`
        })

        if (title) {
            const textWidth = options.map(x => stripAnsi(x)).reduce((a, c) => c.length > a ? c.length : a, 0) + 2
            this.title(title, textWidth)
        }
        options.forEach(option => {
            console.log(theme.text(`  ${option}`))
        })
    },
    log (message, category, color = theme.log.category) {
        let output = 
            theme.outline('[') + 
            theme.log.time(now())
            + theme.outline(']')
        if (typeof color === 'string') color = chalk.hex(color)
        if (category) {
            output += ' ' 
                + theme.outline('[') 
                + color(`${category.toUpperCase()}`)
                + theme.outline(']')
        }
        output += ' ' + theme.text(message)
        console.log(output)
    },
    check ({
        title,
        checks
    } = {}) {
        if (!checks) throw Error(`No checks provided.`)
        if (!Array.isArray(checks)) checks = [checks]
        if (title) {
            const textLength = checks.reduce((a, c) => c.label.length > a ? c.label.length : a, 0) + 7
            this.title(title, textLength)
        }
        checks.forEach(({
            pass = false,
            label
        }) => {
            const style = pass ? 'pass' : 'fail'
            const mark = pass ? '✔' : '✘'
            console.log(theme.check[style](`  ${mark}  — ${label}`))
        })
    },
    bars ({
        bars,
        title,
        _single = !Array.isArray(bars)
    } = {}) {
        if (!bars) throw Error(`No progress bars provided.`)
        if (!Array.isArray(bars)) bars = [bars]
        maxLabelLength = bars.reduce((a, c) => c.header.length > a ? c.header.length : a, 0)
        bars = bars.map(({
            header,
            progress = 0,
            key
        } = {}, i) => {
            const label = theme.label(header.padStart(maxLabelLength))
            const render = (progress) => {
                const style = progress >= 1 ? 'complete' : 'status'
                let progressBar = ''
                if (process.stdout.columns >= maxLabelLength + 30) {
                    const count = Math.min(progress * BARS_MAX_PROGRESS, BARS_MAX_PROGRESS)
                    progressBar = BARS_PROGRESS_CHAR.repeat(count)
                    progressBar = theme.progress[style](progressBar.padEnd(BARS_MAX_PROGRESS))
                    progressBar = `${BARS_BLOCK_CHAR}${progressBar}${BARS_BLOCK_CHAR} `    
                }
                const progressPercent = theme.progress[style](
                    (Math.round(progress * 100) + '%').padStart(4)
                )
                return ` ${label}: ${progressBar}${progressPercent}`
            }
            return {
                output: render(progress),
                key: key || header,
                update (progress) {
                    let index = ((bars.length - 1) - i)
                    process.stdout.moveCursor(0, -(index + 2))
                    process.stdout.write(render(progress))
                    process.stdout.moveCursor(0, index + 2)
                    process.stdout.cursorTo(0)
                }
            }
        })

        if (title) {
            const textLength = stripAnsi(((bars || [])[0] || {}).output || '').length
            this.title(title, textLength)
        }
        console.log(bars.map(x => x.output).join('\n') + '\n')

        if (_single) return bars.pop().update
        const updaters = {}
        bars.forEach(x => {
            updaters[x.key] = x.update
        })
        return updaters
    },
    error (opts) {
        if (typeof opts === 'string') opts = { message: opts }
        let { message, details, stack } = opts
        if (details) {
            message += typeof details !== 'string'
                ? `\n\n${JSON.stringify(details, null, 2)}`
                : `\n\n${details}`
        }
        if (stack) {
            if (!Array.isArray(stack)) stack = ((stack || '') + '').split('\n').slice(1).join('\n')
            message += `\n\n${stack}`
        }
        if (message.indexOf('\n') === -1) {
            message = theme.error.bgRgb(255, 255, 255).inverse('  ERROR  ' ) + ' ' + theme.error(message.trim())
        } else {
            message = theme.error(message.trim())
        }
        console.error(message)
    },
    warn (message) {
        if (message.indexOf('\n') === -1) {
            message = theme.warn.inverse(' WARNING ') + ' ' + theme.warn(message.trim())
        } else {
            message = theme.warn(message.trim())
        }
        console.log(message)
    },
    debug (...args) {
        let msg = typeof args[0] === 'string' ? args[0] : 'DEBUG'
        let obj = typeof args[0] === 'string' ? args[1] : args[0]
        obj = JSON.stringify(obj, null, 2)
        const textLength = obj.split('\n').reduce((a, c) => c.length > a ? c.length : a, 0)
        this.title(msg, textLength)
        console.log(theme.debug(obj))
    }
}
