import fetch from 'node-fetch'
import fs from 'fs'

const codes_text = fs.readFileSync('codes.txt', { encoding: 'utf8' })
const codes = codes_text.split("\n")

const defaults = [
    ['language_id',             1],
    ['timestamp',               0],
    ['request_id',              0],
    ['network_id',              11],
    ['mobile_client_version',   999],
]

function get_server() {
    const url = new URL('http://master.idlechampions.com/~idledragons/post.php')
    const params = new URLSearchParams([
        ...defaults,
        ['call',            'getPlayServerForDefinitions'],
    ])
    url.search = params
    console.log(url.toString())

    return fetch(url, { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'} }).then(
        (res) => res.json()
    ).then(
        (res) => {
            console.log(res)
            this.play_server = res.play_server
            console.log("!!!set!!!", this.play_server)
        }
    )
}

function get_user() {
    const url = new URL(this.play_server + '/post.php') // FIXME: // in URL by proper concatenation!!!
    const params = new URLSearchParams([
        ...defaults,
        ['call',            'getuserdetails'],
        ['user_id',         this.user_id],
        ['hash',            this.hash],
        ['include_free_play_objectives', 'false'],
        ['instance_key',    1],
    ])
    url.search = params
    console.log(url.toString())

    return fetch(url, { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'} }).then(
        (res) => res.json()
    ).then(
        (res) => {
            console.log(JSON.stringify(res, null, 4))
            this.instance_id = res.details.instance_id
        }
    )
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

async function submit_codes() {
    for (let idx = 0; idx < codes.length; idx++) {
        const code = codes[idx]
        const url = new URL(this.play_server + '/post.php') // FIXME: // in URL by proper concatenation!!!
        const params = new URLSearchParams([
            ...defaults,
            ['call',            'redeemcoupon'],
            ['user_id',         this.user_id],
            ['hash',            this.hash],
            ['instance_id',     this.instance_id],
            ['code',            code],
        ])
        url.search = params
        console.log(url.toString())

        await fetch(url, { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'} }).then(
            (res) => res.json()
        ).then(
            (res) => {
                console.log(res)
            }
        )
        await sleep(2000)
    }
}

let ctx

ctx = {
    get_server,
    get_user,
    submit_codes,
    user_id: '',  // Epic
    hash:    '',  // Epic
    play_server: undefined,
    instance_id: undefined,
}

await ctx.get_server()
await ctx.get_user()
await ctx.submit_codes()

console.log('END EPIC', ctx)

ctx = {
    get_server,
    get_user,
    submit_codes,
    user_id: '', // Steam
    hash:    '', // Steam
    play_server: ctx.play_server,
    instance_id: undefined,
}

await ctx.get_server()
try { await ctx.get_user() } catch { await ctx.get_user() }
await ctx.submit_codes()

console.log('END STEAM', ctx)
