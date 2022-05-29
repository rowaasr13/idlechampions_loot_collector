import fetch from 'node-fetch'
import { common_states_init } from './common.mjs'

const name   = 'Reddit /r/idlechampions "loot" flair'
const states = common_states_init({})

const url_search = 'https://www.reddit.com/r/idlechampions/search.json?q=flair_name%3A%22loot%22&restrict_sr=1&sort=new'

states.fetch[0] = () => fetch(url_search)
states.extract_codes = [ extract_codes ]

function extract_codes() {
    this.res.parse_json.data.children.forEach((post, idx) => {
        let html = post.data.selftext_html
        if (html) {
            html = html.replace(/&amp;/g, '&')
            html = html.replace(/&#?[0-9a-z]{1,5};/gi, function(entity) { return entity === '&amp;' ? '&' : ' ' })
            this.env.push_codes_from_text({ name: name, text: html, log_text: post.data.selftext, raw: post })
        } else {
            let title = post.data.title
            if (title) {
                title = title.replace(/&amp;/g, '&')
                this.env.push_codes_from_text({ name: name, text: title, types: [ 'md' ], raw: post })
            }
        }

    })
    this.resolve(true)
}

export {
    name,
    states,
    extract_codes,
}
