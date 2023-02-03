import EventEmitter from 'events'
import fetch from 'node-fetch'
import fs from 'fs'
import IFM from './promise_machine.mjs'

import * as sources_reddit from './sources/reddit.mjs'
import * as sources_discord from './sources/discord.mjs'
import * as sources_icendar from './sources/icendar.mjs'

const code_one_letter_range = '0-9A-Za-z*&^%$#@!'

const sources = [
    sources_reddit,
    sources_discord,
    sources_icendar,
]

function get_code_patterns() {
    const code_one_letter_rx = '[' + code_one_letter_range + ']'

    const patterns = [
        // 4 groups of XXXX (4 X) joined by '-': i.e. XXXX-XXXX-XXXX-XXXX
        Array(4).fill(code_one_letter_rx + '{4}').join("[\\-_]"),
        // 3 groups of --""--
        Array(3).fill(code_one_letter_rx + '{4}').join("[\\-_]"),
        // 16 X with optional delimiters after each symbol
        Array(16).fill(code_one_letter_rx).join("\\-?"),
        // 12 X
        Array(12).fill(code_one_letter_rx).join("\\-?"),
    ]
    patterns.forEach((val, idx, array) => {
        array[idx] =
            '(?:^|(?<!' + code_one_letter_rx  + '))' + // boundary or start of line lookbehind
            '(' + val + ')' +                          // pattern
            '(?:$|(?!' + code_one_letter_rx + '))'     // boundary or end of line lookahead
    })
    const all_patterns = new RegExp(patterns.join('|'), 'g')

    return all_patterns
}

function push_code(array, code, data) {
    const normalized = code.replace(/[\-_]/g, '').toLowerCase()
    const exists = array.uniq[normalized]

    if (exists) { return }
    array.uniq[normalized] = true

    array.push(code)
}

function push_error(array, data) {
    array.push(data)
}

function push_codes_from_text(args) {
    const env = this
    const patterns = env.patterns
    let text = args.text.replace(/&amp;/g, "&")
    let log_text = (args.log_text || args.text).replace(/&amp;/g, "&")

    // do not try to parse known channel names that just happen to match code format
    text = text.replace(/twitch\.tv\/(?:demiplanerpg|dungeonscrawlers)/ig, '')

    let match, had_match
    while ((match = patterns.exec(text)) !== null) {
        had_match = true
        push_code(env.codes, match[0], { source_id: args.source, raw: args.raw })
    }

    if (!had_match) {
        console.log({ text, log_text, raw: args.raw })
        push_error(env.errors, { text: log_text, source_id: args.source, raw: args.raw })
    }
}

const document_body = (typeof document !== 'undefined') && document.body
const println = document_body ? function(...args) {
    const text = document.createTextNode([...args].join(' '))
    const wrapper = document.createElement('div')
    wrapper.appendChild(text)
    document_body.appendChild(wrapper)
} : function(...args) {
    console.log(...args)
}

async function main() {
    const all_patterns = get_code_patterns()
    const codes = []
    codes.uniq = {}
    const errors = []
    const emitter = IFM.add_console_log_events(new EventEmitter())

    const all_sources_promises = []
    for (let idx = 0; idx < sources.length; idx++) {
        const source = sources[idx]
        const ifm = new IFM()
        ifm.states = source.states
        ifm.emitters.push(emitter)
        ifm.env.codes = codes
        ifm.env.errors = errors
        ifm.env.patterns = all_patterns
        ifm.env.push_codes_from_text = push_codes_from_text
        ifm.state = 'init'

        all_sources_promises.push(ifm.run())
    }

    // Deliberately wait until all code retrieveal is done before trying to submit
    // TODO: try to plan async so it can be easily switched to submitting codes on the fly
    // the moment each one of them becomes available
    await Promise.all(all_sources_promises)

    if (codes.length > 0) {
        for (const code of codes) {
            println(code)
        }
    }

    fs.writeFileSync("codes.txt", codes.join("\n"))

    if (errors.length > 0) {
        println("\n\n\n=== Errors ===")
        for (const error of errors) {
            println(`=== ${error.source_id} parse error ===`)
            println(error.text)
            // console.log(error.raw)
        }
    }
}

main()
