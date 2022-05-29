function common_states_init(states) {
    states.init            = [ function () { this.env.retry_count = 5 }, 'fetch' ]
    states.fetch           = [ undefined, 'parse_json', 'retry_fetch' ]
    states.retry_fetch     = [ retry_fetch, 'fetch' ]
    states.parse_json      = [ parse_json, 'extract_codes', 'retry_fetch' ]
    states.log_parsed_json = [ log_parsed_json, 'extract_codes' ]
    states.parse_text      = [ parse_text, 'extract_codes', 'retry_fetch' ]
    states.log_parsed_text = [ log_parsed_text, 'extract_codes', 'retry_fetch' ]

    return states
}

function parse_json() {
    return this.res.fetch.json()
}

function parse_text() {
    return this.res.fetch.text()
}

function retry_fetch(err) {
    if (this.env.retry_count-- < 0) {
       this.reject()
    }
}

function log_parsed_json() {
    process.stdout.write(JSON.stringify(this.res.parse_json, undefined, 4))
}

function log_parsed_text() {
    process.stdout.write(this.res.parse_text)
}

export {
    common_states_init,
    retry_fetch,
}
