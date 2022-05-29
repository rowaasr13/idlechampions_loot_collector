// https://incendar.com/idlechampions_codes.php

import fetch from 'node-fetch'
import { common_states_init } from './common.mjs'

const name   = 'incendar'
const states = common_states_init({})

const url = 'https://incendar.com/idlechampions_codes.php'

states.fetch[0] = () => fetch(url)
states.fetch[1] = 'parse_text'
// states.parse_text[1] = 'log_parsed_text'

states.extract_codes = [ function () {
    let text = this.res.parse_text
    let re = /3rd party.+?<textarea[^>]*>(.+?)<\/textarea>/s;
    let match = re.exec(text)

    let codes = match[1].split(/\s+/)

    console.log('>>> match', match)
    console.log('>>> codes', codes)

    codes.forEach((code) => {
        this.env.push_codes_from_text({ name: name, text: code })
    })

    this.resolve(true)
}]

export {
    name,
    states,
}
