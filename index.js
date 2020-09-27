const default_param_input_defns = [
    "stimulus-red",
    "stimulus-blue",
    "no-stimulus-red",
    "no-stimulus-blue",
]

const default_param_action_defns = [
    "yes",
    "no",
]

const default_param_input_action_reward_defns = [
    "stimulus-red yes 1",
    "stimulus-red no 0",
    "stimulus-blue yes 0",
    "stimulus-blue no 1",
    "no-stimulus-red yes 0",
    "no-stimulus-red no 1",
    "no-stimulus-blue yes 1",
    "no-stimulus-blue no 0",
]

var app = new Vue({
    el: '#app',
    data: {
        param_input_defns: default_param_input_defns.join("\n"),
        param_action_defns: default_param_action_defns.join("\n"),
        param_input_action_reward_defns: default_param_input_action_reward_defns.join("\n"),
        ui_mode: "edit",
        out_debug: "",
        out_columns: ["Input", "Action", "Value", "UCB"],
        out_rows: [],
    },
    computed: {
        is_edit_disabled: function() {
            return this.ui_mode != "edit"
        },
        is_step_disabled: function() {
            return this.ui_mode != "run"
        },
    },
    methods: {
        step: function(event) {
            const result = step({
                "param_input_defns": this.param_input_defns,
                "param_action_defns": this.param_action_defns,
                "input_action_rewards": this.param_input_action_reward_defns,
            })
            this.out_debug = result.event_log;
            this.out_columns = result.out_columns;
            this.out_rows = result.out_rows;
        }
    }
});

function step(params) {
    const inputs = parseLines(parseName, params.param_input_defns);
    const actions = parseLines(parseName, params.param_action_defns);
    const input_action_rewards = parseLines(parseInputActionReward, params.input_action_rewards);

    const ctx = {
        "inputs": inputs,
        "actions": actions,
        "input_action_rewards": input_action_rewards,
    }

    let event_log = [];

    function emit(args) {
        event_log.push(args.join("  "));
    }

    const n_steps = 20;

    const result = simulate(n_steps, ctx, emit);

    return {
        "event_log": event_log,
        "out_columns": result.out_columns,
        "out_rows": result.out_rows,
    }
}

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

function simulate(n_steps, ctx, emit) {
    // notation: define shorthand sets of indices
    const A = new Set(ctx.actions);
    const I = new Set(ctx.inputs);

    const IA = new Set();
    for (const i of I) {
        for (const a of A) {
            IA.add(_ia(i, a));
        }
    }

    // Define mapping from (input, action) to reward
    const rewards = new Map(imap(
        x => [_ia(x.input, x.action), x.reward],
        ctx.input_action_rewards
    ));

    // define some constants
    const BIGV = 10.0; // BIGV is a finite but very enticing value.
    const C = 1.0; // C is explore-exploit tradeoff parameter.

    // Uncertainty bound used when estimating the value of doing
    // action a in response to input i. . n_ is the number of
    // times we've encountered the input i before. z_ is the number
    // of times we've tried doing action a in response to i.  
    const uncertainty = function(n_, z_) {
        return (z_ === 0.0) ? BIGV : Math.sqrt(Math.log(n_) / z_);
    };

    // initialise bandit memory

    // n is how many times we've seen input i.
    let n = new Map(imap(i => [i, 0.0], I));

    // Z is how many times we've done action a in response to input i.
    let z = new Map(imap(ia => [ia, 0.0], IA));

    // V is our prior for the value of doing action a in repsonse to input i.
    let v = new Map(imap(ia => [ia, 0.5], IA));


    let ucb = new Map();

    for (let step_i=0; step_i<n_steps; step_i++) {
        // The environment generates an input i' for us to observe.
        const i_prime = randomChoice(ctx.inputs);
        emit(['Environment sampled random input', i_prime]);

        // Observe the input i' with our sensors
        const s = new Map(imap(i => [i, 1.0*(i === i_prime)], I));

        emit(['Sensed', fmtMap(s)]);

        // Decide which action a* to do
        emit(['Considered action values', fmtMap(v)]);
        ucb = new Map(imap(
            ia => [ia, v.get(ia) + C * uncertainty(n.get(_ia_i(ia)), z.get(ia))],
            IA
        ));
        emit(['Considered UCB', fmtMap(ucb)]);
        const p = new Map(imap(
            a => [a, sum(imap(i => ucb.get(_ia(i, a)) * s.get(i), I))],
            A
        ));
        emit(['Considered action-potentials', fmtMap(p)]);
        const a_star = argmax(p);
        emit(['Decided action', a_star]);

        // Respond to i' by doing a* and see what reward r the environment gives us
        const r = rewards.get(_ia(i_prime, a_star));
        emit(['Reward', r]);

        // Update how many times we've observed i' and done a* in response to i'
        const succ_n = new Map(imap(i => [i, n.get(i) + 1.0*(i === i_prime)], I));

        const succ_z = new Map(imap(
            ia => [ia, z.get(ia) + 1.0 * (_ia_i(ia) === i_prime && _ia_a(ia) === a_star)],
            IA
        ));

        // Update our belief of how valuable doing a* in response to i' is.
        const succ_v = new Map(imap(
            ia => [ia, (
                (_ia_i(ia) === i_prime && _ia_a(ia) === a_star) ?
                (v.get(ia) * z.get(ia) + r) / (z.get(ia) + 1.0):
                v.get(ia)
            )],
            IA
        ));

        // Advance
        n = succ_n;
        z = succ_z;
        v = succ_v;
    }

    // provide output

    const out_columns = ["Input", "Action", "Value", "UCB"];
    let out_rows = [];
    for (const ia of IA) {
        let row = {
            "Input":_ia_i(ia),
            "Action":_ia_a(ia),
            "Value":v.get(ia),
            "UCB":Number(ucb.get(ia)).toFixed(3),
        };
        out_rows.push(row);
    }

    console.log(out_rows);

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