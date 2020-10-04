import Vue from 'vue';
import {parse as scenarioParser}  from './scenario_parser.js';
import {NewLinUCB, asarray} from './linucb.js'

const default_param_raw_input_defns = [
    "x0",
    "x1",
]

const default_param_scenario_defns = [
    "NS-R 0.25 x0~N(mu=0.0, sigma=0.2) x1~N(mu=1.0, sigma=0.2)",
    "NS-B 0.25 x0~N(mu=0.0, sigma=0.2) x1~N(mu=-1.0, sigma=0.2)",
    "S1-R 0.05 x0~N(mu=0.2, sigma=0.2) x1~N(mu=1.0, sigma=0.2)",
    "S1-B 0.05 x0~N(mu=0.2, sigma=0.2) x1~N(mu=-1.0, sigma=0.2)",
    "S2-R 0.05 x0~N(mu=0.4, sigma=0.2) x1~N(mu=1.0, sigma=0.2)",
    "S2-B 0.05 x0~N(mu=0.4, sigma=0.2) x1~N(mu=-1.0, sigma=0.2)",
    "S3-R 0.05 x0~N(mu=0.6, sigma=0.2) x1~N(mu=1.0, sigma=0.2)",
    "S3-B 0.05 x0~N(mu=0.6, sigma=0.2) x1~N(mu=-1.0, sigma=0.2)",
    "S4-R 0.05 x0~N(mu=0.8, sigma=0.2) x1~N(mu=1.0, sigma=0.2)",
    "S4-B 0.05 x0~N(mu=0.8, sigma=0.2) x1~N(mu=-1.0, sigma=0.2)",
    "S5-R 0.05 x0~N(mu=1.0, sigma=0.2) x1~N(mu=1.0, sigma=0.2)",
    "S5-B 0.05 x0~N(mu=1.0, sigma=0.2) x1~N(mu=-1.0, sigma=0.2)",
]

const default_param_action_defns = [
    "react",
    "wait",
]

const default_param_input_action_reward_defns = [
    "NS-R react 0",
    "NS-B react 1",
    "S1-R react 1",
    "S1-B react 0",
    "S2-R react 1",
    "S2-B react 0",
    "S3-R react 1",
    "S3-B react 0",
    "S4-R react 1",
    "S4-B react 0",
    "S5-R react 1",
    "S5-B react 0",
    "NS-R wait 1",
    "NS-B wait 0",
    "S1-R wait 0",
    "S1-B wait 1",
    "S2-R wait 0",
    "S2-B wait 1",
    "S3-R wait 0",
    "S3-B wait 1",
    "S4-R wait 0",
    "S4-B wait 1",
    "S5-R wait 0",
    "S5-B wait 1",
]

var app = new Vue({
    el: '#app',
    data: {
        param_raw_input_defns: default_param_raw_input_defns.join("\n"),
        param_scenario_defns: default_param_scenario_defns.join("\n"),
        param_action_defns: default_param_action_defns.join("\n"),
        param_input_action_reward_defns: default_param_input_action_reward_defns.join("\n"),
        param_input_monomial_degree: 2,
        ui_mode: "edit",
        out_debug: "",
        out_columns: [],
        out_rows: [],
        sim: null,
        status: "",
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
            // try {
                if (this.sim == null) {
                    const ctx = {};
                    try {
                        ctx.raw_inputs = parseLines(parseName, this.param_raw_input_defns);
                    } catch(e) {
                        this.status = "failed to parse raw inputs: " + e
                        return
                    }
                    try {
                        ctx.input_scenarios = scenarioParser(this.param_scenario_defns);
                    } catch(e) {
                        this.status = "failed to parse scenarios: " + e
                        return
                    }
                    try {
                        ctx.actions = parseLines(parseName, this.param_action_defns);
                    } catch(e) {
                        this.status = "failed to parse actions: " + e
                        return
                    }
                    try {
                        ctx.input_action_rewards = parseLines(parseInputActionReward, this.param_input_action_reward_defns);
                    } catch(e) {
                        this.status = "failed to parse input-action-rewards: " + e
                        return
                    }
                    ctx.input_monomial_degree = this.param_input_monomial_degree
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
                this.status = ""
            //} catch(e) {
            //    this.status = e
            //}
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

function randomChoice(items) {
    return items[Math.floor(items.length * Math.random())];
}

function weightedRandomChoice(items, getWeight) {
    const weights = items.map(getWeight, items);
    const cumulativeWeights = new Array(weights.length);
    let acc = 0.0
    for (var i = 0; i < weights.length; i++) {
        acc += weights[i];
        cumulativeWeights[i] = acc;
    }
    const x = cumulativeWeights[weights.length-1]*Math.random();
    let j = 0;
    // bisection search here may be faster for large inputs, but our inputs are currently small.
    while (cumulativeWeights[j] < x) {
        j++;
    }
    return items[j];
}

// Standard Normal variate using Box-Muller transform.
// Ref: https://stackoverflow.com/a/36481059
function randNormalBoxMuller() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function randNormal(mu, sigma) {
    return randNormalBoxMuller() * sigma + mu;
}

// define how to generate samples of raw input values from generator definitions

function extractArg(k, args) {
    for(const arg of args) {
        if (arg.k === k) {
            return arg.v;
        }
    }
    throw new Error("missing expected argument: "+k);
}

function evalDistribution(distDefn) {
    if (distDefn.func === "N") { // Normal (aka Gaussian) distribution
        const mu = extractArg("mu", distDefn.args);
        const sigma = extractArg("sigma", distDefn.args);
        return randNormal(mu, sigma);
    } else {
        throw new Error("distribution not defined: "+distDefn.func);
    }
}

function evalGenerator(genDefn) {
    return [genDefn.variable_name, evalDistribution(genDefn.distribution)];
}

function evalGenerators(genDefns) {
    const result = new Map();
    for(const genDefn of genDefns) {
        const kv = evalGenerator(genDefn);
        result.set(kv[0], kv[1]);
    }
    return result;
}

function monomialBasis(degree, raw_inputs) {
    if (!(Number.isInteger(degree) && (degree >= 0))) {
        throw new Error("monomialBasis degree parameter must be non-negative integer")
    }
    const unitKey = "1";
    switch(degree) {
        case 0:
            return new Map().set(unitKey, 1.0);
        case 1:
            return new Map(raw_inputs).set(unitKey, 1.0);
        default:
            const result = new Map();
            const left = monomialBasis(1, raw_inputs);
            const right = monomialBasis(degree - 1, raw_inputs);
            for (const lkv of left.entries()) {
                for (const rkv of right.entries()) {
                    if (lkv[0] > rkv[0]) {
                        continue;
                    }
                    let k = "";
                    if (lkv[0] === unitKey) {
                        k = rkv[0]
                    } else if (rkv[0] === unitKey) {
                        k = lkv[0]
                    } else {
                        k = lkv[0] + "." + rkv[0]
                    }
                    const v = lkv[1] * rkv[1];
                    result.set(k, v);
                }
            }
            return result;
    }
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

    sim.ctx = ctx;

    // Ref: http://rob.schapire.net/papers/www10.pdf Equation (4)
    const delta = 0.1;
    const alpha = 1.0 + Math.sqrt(Math.log(2.0 / delta) / 2.0);

    sim.learner = null;

    sim.get_reward = function(scenario, action) {
      for (const item of sim.ctx.input_action_rewards) {
        if (scenario.scenario_name === item.input && action == item.action) {
          return item.reward
        }
      }
      throw new error("no input-action-reward defined");
    }



    // TODO for each action a initialise the starting model and store in memory

    sim.step = function(emit) {

        // The environment randomly samples a scenario according to the scenario weights.
        const scenario = weightedRandomChoice(sim.ctx.input_scenarios, scenario => scenario.probability);

        emit(['sampled scenario: ', scenario.scenario_name]);

        // The environment generates raw inputs from that scenario for crow to observe.
        const raw_input_values = evalGenerators(scenario.generators);

        emit(['crow observed raw inputs: ', fmtMap(raw_input_values)]);

        // Feature detection pass

        const degree = sim.ctx.input_monomial_degree;
        const feature_values = monomialBasis(degree, raw_input_values);

        const d = feature_values.size;

        emit(['crow generated input features: ', fmtMap(feature_values)]);

        const feature_keys = Array.from(feature_values.keys()).sort();
        const x = asarray([d], feature_keys.map(k => feature_values.get(k)));

        if (sim.learner === null) {
          sim.learner = NewLinUCB(alpha, d, sim.ctx.actions);
        }
        const p_by_a = sim.learner.chooseAction(x);

        emit(['crow calculated action weights: ', fmtMap(p_by_a)]);

        const a_star = argmax(p_by_a);

        emit(['crow did action: ', a_star]);

        const r = sim.get_reward(scenario, a_star);
        if (r === 1.0) {
            emit(['crow demonstrated the desired action']);
            emit(['crow got a reward']);
        } else {
            emit(['crow failed to demonstrate the desired action']);
            emit(['crow did not get a reward']);
        }

        sim.learner.updateReward(x, a_star, r);

        emit(['crow observed the reward from the environment']);

        const snapshot = {}; // TODO
        return snapshot
    }

    return sim
}

function makeSnapshotTable(snapshot) {
    const out_columns = ["colname1", "colname2"];
    let out_rows = [{"colname1": "todo", "colname2": "todo"}];
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


