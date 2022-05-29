import fetch from 'node-fetch'
import { common_states_init } from './common.mjs'

const name   = 'Discord Idle Champions #combinations'
const states = common_states_init({})

const url_combinations_channel = 'https://discord.com/api/v9/channels/358044869685673985/messages?limit=50'

// TODO: move to config
const discord_auth = ''

states.fetch[0] = () => fetch(url_combinations_channel, { headers: { Authorization: /* this.env. */ discord_auth }})
states.extract_codes = [ function () {
    this.res.parse_json.forEach((post, idx) => {
        this.env.push_codes_from_text({ name: name, text: post.content, raw: post })
    })
    this.resolve(true)
}]

export {
    name,
    states,
}
