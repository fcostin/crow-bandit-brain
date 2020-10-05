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
        sim: null,
        status: "",

        // canvas for learner-state-view
        canvas: null,
        canvas_ctx: null,
        temp_canvas: null,
        temp_canvas_ctx: null,
    },
    mounted: function() {
        this.canvas = document.getElementById("learner-state-view")
        this.canvas_ctx = this.canvas.getContext("2d");

        // We use a second canvas to write image data to directly.
        // Then we can resize the rendered image and draw it atop
        // our actual visible canvas.
        this.temp_canvas = document.createElement("canvas");
        this.temp_canvas_ctx = this.temp_canvas.getContext("2d");
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
                this.out_debug = [];
            }
        }
    },
    methods: {
        step: function(event) {
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

            this.sim.step(emit);

            this.out_debug = event_log;
            this.status = ""

            renderLearnerStateView(
                this.sim,
                this.canvas,
                this.canvas_ctx,
                this.temp_canvas,
                this.temp_canvas_ctx,
            );
        }
    }
});

function fmtSet(xs) {
    return "{" + Array.from(xs).sort().join(", ") + "}";
}

function fmtMap(xs) {
    return "{" + Array.from(xs).sort().map(item => item.join(": ")).join(", ") + "}";
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

// Find quantiles of input array xs. qs is an array of quantiles (each in range [0.0, 1.0]).
// Returns result array of computed quantiles s.t. result[j] corresponds to quantile qs[j] of xs.
const quantiles = function(xs, qs) {
    const s = [...xs].sort((a, b) => a - b); // sort without modifying xs
    const n = s.length;
    const res = new Array(qs.length);
    for (var j = 0; j < qs.length; j++) {
        const pos = (n - 1) * qs[j];
        const i = Math.floor(pos);
        const tau = pos - i;
        res[j] = s[i] + (i + 1 < n ? tau * (s[i+1] - s[i]) : 0.0);
    }
    return res;
};

function renderLearnerStateView(sim, canvas, canvas_ctx, temp_canvas, temp_canvas_ctx) {
    // this view currently only supports 2-d raw input vector x
    if (sim.ctx.raw_inputs.length != 2) {
        return;
    }
    // this view currently only supports two distict actions
    if (sim.ctx.actions.length != 2) {
        return;
    }

    const x0_rez = 40;
    const x1_rez = 40;
    
    // TODO: automatically pick appropriate bounding box (e.g. 5% 95% quantiles)
    const x0_grid = linspan(-0.2, 1.2, x0_rez);
    const x1_grid = linspan(-1.2, 1.2, x1_rez);

    // let's display x0 along x-axis (w) and x1 along y-axis (h)

    const w = x0_rez;
    const h = x1_rez;
    const bytes_per_pixel = 4;
    temp_canvas.width = w;
    temp_canvas.height = h;

    const imageData = temp_canvas_ctx.getImageData(0, 0, w, h);
    const buffer = imageData.data;

    var i, j, k = 0;

    // Prepare and store the model used to evaluate UCB for each action.
    // The work of solving for parameters theta and factorising
    // the matrix A can be reused when evaluating across all the
    // grid points.
    const model_by_action = new Map();
    for (const a of sim.ctx.actions) {
        model_by_action.set(a, sim.learner.getModelForAction(a));
    }

    const category_a0_r = 0xff;
    const category_a0_g = 0x7f;
    const category_a0_b = 0x0e;

    const category_a1_r = 0x1f;
    const category_a1_g = 0x77;
    const category_a1_b = 0xb4;

    // First pass: evaluate UCB value for the two action values, compute the
    // "gap" or difference between the two values and store that gap in a buffer
    // corresponding to the grid layout.

    const gaps = new Array(h * w);

    for (i = 0; i < h; i++) {
         // canvas vertical coords go from top to bottom.
         // flip to align with convention for charts.
        const x1 = x1_grid[h - i - 1];
        for(j = 0; j < w; j++) {
            const x0 = x0_grid[j];

            // todo: optimise this! so much wasteful transformation & mallocs...
            // compute raw input for this grid point (j, i)
            const raw_input_values = new Map([['x0', x0], ['x1', x1]]);
            // compute feature vector for this grid point
            const degree = sim.ctx.input_monomial_degree;
            const feature_values = monomialBasis(degree, raw_input_values);
            const d = feature_values.size;
            const feature_keys = Array.from(feature_values.keys()).sort();
            const featureVector = asarray([d], feature_keys.map(k => feature_values.get(k)));

            // evaluate UCB for each action
            const ucb_a0 = sim.learner.getUCB(model_by_action.get(sim.ctx.actions[0]), featureVector);
            const ucb_a1 = sim.learner.getUCB(model_by_action.get(sim.ctx.actions[1]), featureVector);

            const gap = ucb_a0 - ucb_a1;
            gaps[k] = gap;
            k += bytes_per_pixel;
        }
    }

    // Second pass - we want to colour the gap values we've computed in a way
    // that helps communicate the different values. One way to do this is pick
    // thresholds to define "buckets" and then assign a colour by the bucket.
    // One way to define thresholds is to compute quantiles. We'll use a fixed
    // palette of four colours for non-negative values and four colours for
    // negative values.

    const a0_margin = gaps.filter(g => g>=0.0);
    const a1_margin = gaps.filter(g => g<0.0).map(g => -g);

    const qs = [0.25, 0.50, 0.75];
    const a0_qs = quantiles(a0_margin, qs);
    const a1_qs = quantiles(a1_margin, qs);

    // Define our buckets and assign them colours

    const bucketise = function(g) {
        if (g >= 0) {
            if (g <= a0_qs[0]) {
                return 0;
            }
            if (g <= a0_qs[1]) {
                return 1;
            }
            if (g <= a0_qs[2]) {
                return 2;
            }
            return 3;
        }
        g = -g;
        if (g <= a1_qs[0]) {
            return 4;
        }
        if (g <= a1_qs[1]) {
            return 5;
        }
        if (g <= a1_qs[2]) {
            return 6;
        }
        return 7;
    }

    function set_pixel_rgba(k, b) {
        buffer[k+3] = 255;
        switch (b) {
            // light orange -> dark orange
            case 0: // fdd0a2
                buffer[k]   = 0xfd;
                buffer[k+1] = 0xd0;
                buffer[k+2] = 0xa2;
                return
            case 1: // fdae6b
                buffer[k]   = 0xfd;
                buffer[k+1] = 0xae;
                buffer[k+2] = 0x6b;
                return
            case 2: // fd8d3c
                buffer[k]   = 0xfd;
                buffer[k+1] = 0x8d;
                buffer[k+2] = 0x3c;
                return
            case 3: // e6550d
                buffer[k]   = 0xe6;
                buffer[k+1] = 0x55;
                buffer[k+2] = 0x0d;
                return
            // light blue -> dark blue
            case 4: // c6dbef
                buffer[k]   = 0xc6;
                buffer[k+1] = 0xdb;
                buffer[k+2] = 0xef;
                return
            case 5: // 9ecae1
                buffer[k]   = 0x9e;
                buffer[k+1] = 0xca;
                buffer[k+2] = 0xe1;
                return
            case 6: // 6baed6
                buffer[k]   = 0x6b;
                buffer[k+1] = 0xae;
                buffer[k+2] = 0xd6;
                return
            case 7: // 3182bd
                buffer[k]   = 0x31;
                buffer[k+1] = 0x82;
                buffer[k+2] = 0xbd;
                return
        }
    }

    // Third pass - write rgba values into imageData buffer
    k = 0;
    for (i = 0; i < h; i++) {
        for(j = 0; j < w; j++) {
            set_pixel_rgba(k, bucketise(gaps[k]));
            k += bytes_per_pixel;
        }
    }
    temp_canvas_ctx.putImageData(imageData, 0, 0);
    // OK, resize and draw the image atop the visible canvas.
    canvas_ctx.drawImage(temp_canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);

}

function linspan(a, b, n) {
    // equally spaced points in interval [a, b].
    let xs = [];
    const w = 1.0 / (n - 1);
    for (let i = 0; i < n; i++) {
        let tau = i * w;
        xs.push(a + (b-a)*tau);
    }
    return xs;
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


