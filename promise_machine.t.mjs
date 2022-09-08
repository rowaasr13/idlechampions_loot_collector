import me from './promise_machine.mjs'

let pm = new me()

pm.states = {
    first:  [ () => console.log('*1*'), 'second' ],
    second: [ () => { console.log('*2*'); if (Math.random() <0.5) { throw "unlucky!" } } , 'third', 'first' ],
    third:  [ function() {
        console.log('*3*');
        this.resolve('resolved!')
    }],
}
pm.state = 'first'

import EventEmitter from 'events'
const emitter = new EventEmitter()
pm.emitters.push(emitter)


        const events = ["MACHINE_START", "STATE_START", "STATE_FINISH", "MACHINE_FINISH", "MACHINE_FINISH_REQUEST"]
        events.forEach(event => {
            emitter.on(event, args => {
                delete args.this
                console.log(`*event*`, event, args)
            })
        })


//console.log(pm)

console.log("final result", await pm.run())
