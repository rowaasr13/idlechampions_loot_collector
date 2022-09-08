// Goal:
// mix unbound state machine from infinite-play
// and events from first iteration of ic_loot

let my_name
const me = class PromiseMachine {
    env                = {}
    res                = {}
    emitters           = []
    states             = {}

    last_state_promise = Promise.resolve()
    state
    prev_state
    next_then_state
    next_catch_state

    emitted_machine_start
    settled
    res_settled
    settled_promise
    settled_promise_resolve
    settled_promise_reject

    constructor(args) {
        this.apply_constructor_args(args)
        this.apply_new_settled_promise()
    }

    apply_new_settled_promise() {
        this.settled_promise = new Promise((resolve, reject) => {
            this.settled_promise_resolve = resolve
            this.settled_promise_reject = reject
        })
    }

    apply_constructor_args(args) {
        if (!args) { return }
    }

    then_state(next_state) {
        this.next_then_state = next_state
    }

    catch_state(next_state) {
        this.next_catch_state = next_state
    }

    resolve(res) {
        this.settled = true
        this.res_settled = res
        this.emit("MACHINE_FINISH_REQUEST", { res: res })
    }

    emit(event_name, event_data) {
        const emitters = this.emitters
        const len = emitters.length
        if (event_data) {
            event_data = { event_source: me, this: this, ...event_data }
        } else {
            event_data = { event_source: me, this: this }
        }

        for (let idx = 0; idx < len; idx++) {
            const emitter = emitters[idx]

            emitters[idx].emit(event_name, event_data)
        }
    }

    run() {
        this.next_state()
        return this.settled_promise
    }

    next_state() {
        if (!this.emitted_machine_start) {
            this.emit("MACHINE_START")
            this.emitted_machine_start = true
        }

        // Emit START
        // Execute function
        // Save its result
        // Save then/catch overrides
        // Add then/catch
        //      Emit finish inside then/catch, so we can clearly write result of function promise

        const state = this.state
        delete this.next_then_state
        delete this.next_catch_state
        delete this.settled

        this.emit("STATE_START", { state: this.state })

        const state_handler = this.states[state]
        if (!state_handler) {
            const message = `${my_name} error: unknown state "${state}"`
            const error = new Error(message)
            throw error
        }

        const handler = state_handler[0]
        if (state_handler[1]) { this.then_state(state_handler[1]) }
        if (state_handler[2]) { this.catch_state(state_handler[2]) }

        this.last_state_promise = this.last_state_promise.then(() => state_handler[0].apply(this))

        this.last_state_promise = this.last_state_promise.then((res) => {
            const state = this.state
            this.prev_state = state
            this.state = this.next_then_state
            this.res[state] = res
            this.emit("STATE_FINISH", { state: state, promise_state: 'fulfilled' })
        }, (err) => {
            const state = this.state
            this.prev_state = state
            this.state = this.next_catch_state
            this.res[state] = err
            this.emit("STATE_FINISH", { state: state, promise_state: 'rejected' })

            if ((!this.state) && err) {
                throw err
            }
        })

        this.last_state_promise = this.last_state_promise.then(() => {
            if (this.settled) {
                const res = this.res_settled
                this.emit("MACHINE_FINISH", { res: res })
                this.settled_promise_resolve(res)
            } else {
                this.last_state_promise = this.last_state_promise.then(() => this.next_state())
            }
        })
    }

    static add_console_log_events(emitter) {
        const events = ["MACHINE_START", "STATE_START", "STATE_FINISH", "MACHINE_FINISH", "MACHINE_FINISH_REQUEST"]
        events.forEach(event => {
            emitter.on(event, args => {
                console.log(`*${my_name} event*`, event, args)
            })
        })

        return emitter
    }
}
my_name = me.toString().match(/^([^{]+)/)[0].replace(/^\s*class\s*/i, '').replace(/\s+$/, '')

export {
    me as default
}
