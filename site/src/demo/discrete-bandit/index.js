import Vue from 'vue';

const default_param_input_defns = [
    "stimulus-red",
    "stimulus-blue",
    "no-stimulus-red",
    "no-stimulus-blue",
]

const default_param_action_defns = [
    "react",
    "wait",
]

const default_param_input_action_reward_defns = [
    "stimulus-red react 1",
    "stimulus-red wait 0",
    "stimulus-blue react 0",
    "stimulus-blue wait 1",
    "no-stimulus-red react 0",
    "no-stimulus-red wait 1",
    "no-stimulus-blue react 1",
    "no-stimulus-blue wait 0",
]

var app = new Vue({
    el: '#app',
    data: {
        param_input_defns: default_param_input_defns.join("\n"),
        param_action_defns: default_param_action_defns.join("\n"),
        param_input_action_reward_defns: default_param_input_action_reward_defns.join("\n"),
        ui_mode: "edit",
        out_debug: "",
        out_columns: [],
        out_rows: [],
        sim: null,
    },
    computed: {
        is_edit_disabled: function() {
            return this.ui_mode != "edit"
        },
        is_step_disabled: function() {
            return this.ui_mode != "run"
        },
    },
    watch: {
        ui_mode: function(mode) {
            // reset sim to avoid running with stale data that
            // don't include latest edits.
            if (mode === "edit") {
                this.sim = null;
                this.out_columns = [];
                this.out_rows = [];
                this.out_debug = [];
            }
        }
    },
    methods: {
        step: function(event) {
            if (this.sim == null) {
                const ctx = {
                    "inputs":  parseLines(parseName, this.param_input_defns),
                    "actions": parseLines(parseName, this.param_action_defns),
                    "input_action_rewards": parseLines(parseInputActionReward, this.param_input_action_reward_defns),
                };
                this.sim = makeSimulation(ctx);
            }

            let event_log = [];

            function emit(args) {
                event_log.push(args.join("  "));
            }

            const snapshot = this.sim.step(emit);

            const snapshotTable = makeSnapshotTable(snapshot);

            this.out_debug = event_log;
            this.out_columns = snapshotTable.out_columns;
            this.out_rows = snapshotTable.out_rows;
        }
    }
});

function* imap(f, xs) {
    for (const x of xs) {
        yield f(x);
    }
}

function fmtSet(xs) {
    return "{" + Array.from(xs).sort().join(", ") + "}";
}

function fmtMap(xs) {
    return "{" + Array.from(xs).sort().map(item => item.join(": ")).join(", ") + "}";
}

function _ia(i, a) {
    return [i, a].join("#");
}

function _ia_i(ia) {
    return ia.split("#")[0];
}

function _ia_a(ia) {
    return ia.split("#")[1];
}

function sum(xs) {
    let acc = 0.0;
    for (const x of xs) {
        acc += x;
    }
    return acc;
}

function argmax(kvs) {
    // return key with maximal value.
    // break ties by sampling uniformly at random.
    let vstar = Number.NEGATIVE_INFINITY;
    let kstars = [];
    for (const kv of kvs.entries()) {
        if (kv[1] > vstar) {
            vstar = kv[1];
            kstars = [kv[0]];
        } else if (kv[1] === vstar) {
            kstars.push(kv[0]);
        }
    }
    return randomChoice(kstars);
}

// define some constants
const BIGV = 10.0; // BIGV is a finite but very enticing value.
const C = 1.0; // C is explore-exploit tradeoff parameter.

// Uncertainty bound used when estimating the value of doing
// action a in response to input i. . n_ is the number of
// times we've encountered the input i before. z_ is the number
// of times we've tried doing action a in response to i.  
const uncertainty = function(n_, z_) {
    return (z_ === 0.0) ? BIGV : Math.sqrt(Math.log(n_) / (1.0 * z_));
};

function makeSimulation(ctx) {
    const sim = new Object();
    // notation: define shorthand sets of indices
    sim.A = new Set(ctx.actions);
    sim.I = new Set(ctx.inputs);
    sim.IA = new Set();
    for (const i of sim.I) {
        for (const a of sim.A) {
            sim.IA.add(_ia(i, a));
        }
    }
    // Define mapping from (input, action) to reward
    sim.rewards = new Map(imap(
        x => [_ia(x.input, x.action), x.reward],
        ctx.input_action_rewards
    ));

    // initialise learner memory

    // n is how many times we've seen input i.
    sim.n = new Map(imap(i => [i, 0.0], sim.I));

    // Z is how many times we've done action a in response to input i.
    sim.z = new Map(imap(ia => [ia, 0.0], sim.IA));

    // V is our prior for the value of doing action a in repsonse to input i.
    sim.v = new Map(imap(ia => [ia, 0.5], sim.IA));

    sim.step = function(emit) {
        // The environment generates an input i' for us to observe.
        const i_prime = randomChoice(ctx.inputs);
        emit(['crow-learner observed input:', i_prime]);

        // Observe the input i' with our sensors
        const s = new Map(imap(i => [i, 1.0*(i === i_prime)], sim.I));

        // emit(['Sensed', fmtMap(s)]);

        // Decide which action a* to do
        // emit(['Considered action values', fmtMap(sim.v)]);
        const ucb = new Map(imap(
            ia => [ia, sim.v.get(ia) + C * uncertainty(sim.n.get(_ia_i(ia)), sim.z.get(ia))],
            sim.IA
        ));
        // emit(['Considered UCB', fmtMap(ucb)]);
        const p = new Map(imap(
            a => [a, sum(imap(i => ucb.get(_ia(i, a)) * s.get(i), sim.I))],
            sim.A
        ));
        // emit(['Considered action-potentials', fmtMap(p)]);
        const a_star = argmax(p);
        emit(['crow-learner performed action:', a_star]);

        // Respond to i' by doing a* and see what reward r the environment gives us
        const r = sim.rewards.get(_ia(i_prime, a_star));
        if (r === 1.0) {
            emit(['crow-learner demonstrated the desired action']);
            emit(['crow-learner got a reward']);
        } else {
            emit(['crow-learner failed to demonstrate the desired action']);
            emit(['crow-learner did not get a reward']);
        }

        // Update how many times we've observed i' and done a* in response to i'
        const succ_n = new Map(imap(i => [i, sim.n.get(i) + 1.0*(i === i_prime)], sim.I));

        const succ_z = new Map(imap(
            ia => [ia, sim.z.get(ia) + 1.0 * (_ia_i(ia) === i_prime && _ia_a(ia) === a_star)],
            sim.IA
        ));

        // Update our belief of how valuable doing a* in response to i' is.
        const succ_v = new Map(imap(
            ia => [ia, (
                (_ia_i(ia) === i_prime && _ia_a(ia) === a_star) ?
                (sim.v.get(ia) * sim.z.get(ia) + r) / (sim.z.get(ia) + 1.0):
                sim.v.get(ia)
            )],
            sim.IA
        ));

        // Advance
        sim.n = succ_n;
        sim.z = succ_z;
        sim.v = succ_v;

        const snapshot = {
            'n': sim.n,
            'z': sim.z,
            'v': sim.v,
            'ucb': ucb,
            'I': sim.I,
            'A': sim.A,
            'IA': sim.IA,
        };
        return snapshot
    }

    return sim
}

function makeSnapshotTable(snapshot) {
    const out_columns = ["input", "action", "n", "z", "value", "UCB"];
    let out_rows = [];
    for (const ia of snapshot.IA) {
        let row = {
            "input":_ia_i(ia),
            "action":_ia_a(ia),
            "n": snapshot.n.get(_ia_i(ia)),
            "z": snapshot.z.get(ia),
            "value":snapshot.v.get(ia),
            "UCB":Number(snapshot.ucb.get(ia)).toFixed(3),
        };
        out_rows.push(row);
    }

    return {
        "out_columns": out_columns,
        "out_rows": out_rows,
    }
}

function parseLines(parseLine, text) {
    const lines = text.match(/[^\r\n]+/g);
    return lines.map(parseLine);
}

function parseName(line) {
    let names = line.match(/[A-Za-z][A-Za-z0-9-_]*/g);
    return names[0];
}

function parseInputActionReward(line) {
    let m = line.match(/(?<input>[A-Za-z][A-Za-z0-9-_]*)[\s]+(?<action>[A-Za-z][A-Za-z0-9-_]*)[\s]+(?<reward>[+-]?\d+(\.\d+)?)/);
    return {
        "input": m.groups.input,
        "action": m.groups.action,
        "reward": parseFloat(m.groups.reward),
    }
}

function randomChoice(items) {
    return items[Math.floor(items.length * Math.random())];
}
