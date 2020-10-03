const default_param_raw_input_defns = [
    "x0",
    "x1",
    "x2",
]

const default_param_scenario_defns = [
    "NS-R 0.25 x0~N(mu=0.0, sigma=0.3) x1~N(mu=1.0, sigma=0.3) x2~N(mu=0.0, sigma=0.3)",
    "NS-B 0.25 x0~N(mu=0.0, sigma=0.3) x1~N(mu=0.0, sigma=0.3) x2~N(mu=1.0, sigma=0.3)",
    "S1-R 0.05 x0~N(mu=0.2, sigma=0.3) x1~N(mu=1.0, sigma=0.3) x2~N(mu=0.0, sigma=0.3)",
    "S1-B 0.05 x0~N(mu=0.2, sigma=0.3) x1~N(mu=0.0, sigma=0.3) x2~N(mu=1.0, sigma=0.3)",
    "S2-R 0.05 x0~N(mu=0.4, sigma=0.3) x1~N(mu=1.0, sigma=0.3) x2~N(mu=0.0, sigma=0.3)",
    "S2-B 0.05 x0~N(mu=0.4, sigma=0.3) x1~N(mu=0.0, sigma=0.3) x2~N(mu=1.0, sigma=0.3)",
    "S3-R 0.05 x0~N(mu=0.6, sigma=0.3) x1~N(mu=1.0, sigma=0.3) x2~N(mu=0.0, sigma=0.3)",
    "S3-B 0.05 x0~N(mu=0.6, sigma=0.3) x1~N(mu=0.0, sigma=0.3) x2~N(mu=1.0, sigma=0.3)",
    "S4-R 0.05 x0~N(mu=0.8, sigma=0.3) x1~N(mu=1.0, sigma=0.3) x2~N(mu=0.0, sigma=0.3)",
    "S4-B 0.05 x0~N(mu=0.8, sigma=0.3) x1~N(mu=0.0, sigma=0.3) x2~N(mu=1.0, sigma=0.3)",
    "S5-R 0.05 x0~N(mu=1.0, sigma=0.3) x1~N(mu=1.0, sigma=0.3) x2~N(mu=0.0, sigma=0.3)",
    "S5-B 0.05 x0~N(mu=1.0, sigma=0.3) x1~N(mu=0.0, sigma=0.3) x2~N(mu=1.0, sigma=0.3)",
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
            try {
                if (this.sim == null) {
                    const ctx = {};
                    try {
                        ctx.raw_inputs = parseLines(parseName, this.param_raw_input_defns);
                    } catch(e) {
                        this.status = "failed to parse raw inputs: " + e
                        return
                    }
                    try {
                        ctx.input_scenarios = scenarioParser.parse(this.param_scenario_defns);
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
            } catch(e) {
                this.status = e
            }
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


    /*
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

    // initialise bandit memory

    // n is how many times we've seen input i.
    sim.n = new Map(imap(i => [i, 0.0], sim.I));

    // Z is how many times we've done action a in response to input i.
    sim.z = new Map(imap(ia => [ia, 0.0], sim.IA));

    // V is our prior for the value of doing action a in repsonse to input i.
    sim.v = new Map(imap(ia => [ia, 0.5], sim.IA));
    */

    sim.step = function(emit) {

        // The environment randomly samples a scenario according to the scenario weights.
        const scenario = weightedRandomChoice(sim.ctx.input_scenarios, scenario => scenario.probability);

        emit(['sampled scenario: ', scenario.scenario_name]);

        // The environment generates raw inputs from that scenario for us to observe.

        emit(['todo implement sim.step:']);

        /*
        // The environment generates an input i' for us to observe.
        const i_prime = randomChoice(ctx.inputs);
        emit(['crow-bandit observed input:', i_prime]);

        
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
        emit(['crow-bandit performed action:', a_star]);

        // Respond to i' by doing a* and see what reward r the environment gives us
        const r = sim.rewards.get(_ia(i_prime, a_star));
        if (r === 1.0) {
            emit(['crow-bandit demonstrated the desired action']);
            emit(['crow-bandit got a reward']);
        } else {
            emit(['crow-bandit failed to demonstrate the desired action']);
            emit(['crow-bandit did not get a reward']);
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

        */

        const snapshot = {};
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

// TODO: take a deep breath, install npm, set up a webpack pipeline and factor this into modules.
/*
 * Generated by PEG.js 0.10.0.
 *
 * http://pegjs.org/
 */
const scenarioParser = (function() {
 "use strict";

 function peg$subclass(child, parent) {
   function ctor() { this.constructor = child; }
   ctor.prototype = parent.prototype;
   child.prototype = new ctor();
 }

 function peg$SyntaxError(message, expected, found, location) {
   this.message  = message;
   this.expected = expected;
   this.found    = found;
   this.location = location;
   this.name     = "SyntaxError";

   if (typeof Error.captureStackTrace === "function") {
     Error.captureStackTrace(this, peg$SyntaxError);
   }
 }

 peg$subclass(peg$SyntaxError, Error);

 peg$SyntaxError.buildMessage = function(expected, found) {
   var DESCRIBE_EXPECTATION_FNS = {
         literal: function(expectation) {
           return "\"" + literalEscape(expectation.text) + "\"";
         },

         "class": function(expectation) {
           var escapedParts = "",
               i;

           for (i = 0; i < expectation.parts.length; i++) {
             escapedParts += expectation.parts[i] instanceof Array
               ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
               : classEscape(expectation.parts[i]);
           }

           return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
         },

         any: function(expectation) {
           return "any character";
         },

         end: function(expectation) {
           return "end of input";
         },

         other: function(expectation) {
           return expectation.description;
         }
       };

   function hex(ch) {
     return ch.charCodeAt(0).toString(16).toUpperCase();
   }

   function literalEscape(s) {
     return s
       .replace(/\\/g, '\\\\')
       .replace(/"/g,  '\\"')
       .replace(/\0/g, '\\0')
       .replace(/\t/g, '\\t')
       .replace(/\n/g, '\\n')
       .replace(/\r/g, '\\r')
       .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
       .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
   }

   function classEscape(s) {
     return s
       .replace(/\\/g, '\\\\')
       .replace(/\]/g, '\\]')
       .replace(/\^/g, '\\^')
       .replace(/-/g,  '\\-')
       .replace(/\0/g, '\\0')
       .replace(/\t/g, '\\t')
       .replace(/\n/g, '\\n')
       .replace(/\r/g, '\\r')
       .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
       .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
   }

   function describeExpectation(expectation) {
     return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
   }

   function describeExpected(expected) {
     var descriptions = new Array(expected.length),
         i, j;

     for (i = 0; i < expected.length; i++) {
       descriptions[i] = describeExpectation(expected[i]);
     }

     descriptions.sort();

     if (descriptions.length > 0) {
       for (i = 1, j = 1; i < descriptions.length; i++) {
         if (descriptions[i - 1] !== descriptions[i]) {
           descriptions[j] = descriptions[i];
           j++;
         }
       }
       descriptions.length = j;
     }

     switch (descriptions.length) {
       case 1:
         return descriptions[0];

       case 2:
         return descriptions[0] + " or " + descriptions[1];

       default:
         return descriptions.slice(0, -1).join(", ")
           + ", or "
           + descriptions[descriptions.length - 1];
     }
   }

   function describeFound(found) {
     return found ? "\"" + literalEscape(found) + "\"" : "end of input";
   }

   return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
 };

 function peg$parse(input, options) {
   options = options !== void 0 ? options : {};

   var peg$FAILED = {},

       peg$startRuleFunctions = { Start: peg$parseStart },
       peg$startRuleFunction  = peg$parseStart,

       peg$c0 = function(scenario_name, probability, generators) {
               return {
                 "scenario_name": scenario_name,
                 "probability": probability,
                 "generators": generators,
               };
             },
       peg$c1 = peg$otherExpectation("name"),
       peg$c2 = /^[A-Za-z\-_]/,
       peg$c3 = peg$classExpectation([["A", "Z"], ["a", "z"], "-", "_"], false, false),
       peg$c4 = /^[A-Za-z0-9\-_]/,
       peg$c5 = peg$classExpectation([["A", "Z"], ["a", "z"], ["0", "9"], "-", "_"], false, false),
       peg$c6 = function(name) { return makeName(name); },
       peg$c7 = peg$otherExpectation("decimal"),
       peg$c8 = /^[0-9]/,
       peg$c9 = peg$classExpectation([["0", "9"]], false, false),
       peg$c10 = ".",
       peg$c11 = peg$literalExpectation(".", false),
       peg$c12 = function(x, y) { return makeFloat(x, y); },
       peg$c13 = "~",
       peg$c14 = peg$literalExpectation("~", false),
       peg$c15 = function(variable_name, distribution) {
               return {
                   "variable_name": variable_name,
                   "distribution": distribution,
               };
             },
       peg$c16 = "(",
       peg$c17 = peg$literalExpectation("(", false),
       peg$c18 = ")",
       peg$c19 = peg$literalExpectation(")", false),
       peg$c20 = function(function_name, param_bindings) {
               return {
                   "func": function_name,
                   "args": param_bindings,
               }
             },
       peg$c21 = ",",
       peg$c22 = peg$literalExpectation(",", false),
       peg$c23 = function(head, tail) {
               return tail.reduce(function(acc, elem) {
                 return acc.concat(elem[2]);
               }, [head]);
             },
       peg$c24 = "=",
       peg$c25 = peg$literalExpectation("=", false),
       peg$c26 = function(param_name, param_value) {
               return {
                   "k":param_name,
                   "v":param_value,
               }
           },
       peg$c27 = peg$otherExpectation("whitespace"),
       peg$c28 = /^[ \t\n\r]/,
       peg$c29 = peg$classExpectation([" ", "\t", "\n", "\r"], false, false),

       peg$currPos          = 0,
       peg$savedPos         = 0,
       peg$posDetailsCache  = [{ line: 1, column: 1 }],
       peg$maxFailPos       = 0,
       peg$maxFailExpected  = [],
       peg$silentFails      = 0,

       peg$result;

   if ("startRule" in options) {
     if (!(options.startRule in peg$startRuleFunctions)) {
       throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
     }

     peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
   }

   function text() {
     return input.substring(peg$savedPos, peg$currPos);
   }

   function location() {
     return peg$computeLocation(peg$savedPos, peg$currPos);
   }

   function expected(description, location) {
     location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

     throw peg$buildStructuredError(
       [peg$otherExpectation(description)],
       input.substring(peg$savedPos, peg$currPos),
       location
     );
   }

   function error(message, location) {
     location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

     throw peg$buildSimpleError(message, location);
   }

   function peg$literalExpectation(text, ignoreCase) {
     return { type: "literal", text: text, ignoreCase: ignoreCase };
   }

   function peg$classExpectation(parts, inverted, ignoreCase) {
     return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
   }

   function peg$anyExpectation() {
     return { type: "any" };
   }

   function peg$endExpectation() {
     return { type: "end" };
   }

   function peg$otherExpectation(description) {
     return { type: "other", description: description };
   }

   function peg$computePosDetails(pos) {
     var details = peg$posDetailsCache[pos], p;

     if (details) {
       return details;
     } else {
       p = pos - 1;
       while (!peg$posDetailsCache[p]) {
         p--;
       }

       details = peg$posDetailsCache[p];
       details = {
         line:   details.line,
         column: details.column
       };

       while (p < pos) {
         if (input.charCodeAt(p) === 10) {
           details.line++;
           details.column = 1;
         } else {
           details.column++;
         }

         p++;
       }

       peg$posDetailsCache[pos] = details;
       return details;
     }
   }

   function peg$computeLocation(startPos, endPos) {
     var startPosDetails = peg$computePosDetails(startPos),
         endPosDetails   = peg$computePosDetails(endPos);

     return {
       start: {
         offset: startPos,
         line:   startPosDetails.line,
         column: startPosDetails.column
       },
       end: {
         offset: endPos,
         line:   endPosDetails.line,
         column: endPosDetails.column
       }
     };
   }

   function peg$fail(expected) {
     if (peg$currPos < peg$maxFailPos) { return; }

     if (peg$currPos > peg$maxFailPos) {
       peg$maxFailPos = peg$currPos;
       peg$maxFailExpected = [];
     }

     peg$maxFailExpected.push(expected);
   }

   function peg$buildSimpleError(message, location) {
     return new peg$SyntaxError(message, null, null, location);
   }

   function peg$buildStructuredError(expected, found, location) {
     return new peg$SyntaxError(
       peg$SyntaxError.buildMessage(expected, found),
       expected,
       found,
       location
     );
   }

   function peg$parseStart() {
     var s0, s1;

     s0 = [];
     s1 = peg$parseScenarioDefn();
     while (s1 !== peg$FAILED) {
       s0.push(s1);
       s1 = peg$parseScenarioDefn();
     }

     return s0;
   }

   function peg$parseScenarioDefn() {
     var s0, s1, s2, s3, s4, s5, s6;

     s0 = peg$currPos;
     s1 = peg$parseName();
     if (s1 !== peg$FAILED) {
       s2 = peg$parse_();
       if (s2 !== peg$FAILED) {
         s3 = peg$parseDecimal();
         if (s3 !== peg$FAILED) {
           s4 = peg$parse_();
           if (s4 !== peg$FAILED) {
             s5 = [];
             s6 = peg$parseGenerator();
             while (s6 !== peg$FAILED) {
               s5.push(s6);
               s6 = peg$parseGenerator();
             }
             if (s5 !== peg$FAILED) {
               s6 = peg$parse_();
               if (s6 !== peg$FAILED) {
                 peg$savedPos = s0;
                 s1 = peg$c0(s1, s3, s5);
                 s0 = s1;
               } else {
                 peg$currPos = s0;
                 s0 = peg$FAILED;
               }
             } else {
               peg$currPos = s0;
               s0 = peg$FAILED;
             }
           } else {
             peg$currPos = s0;
             s0 = peg$FAILED;
           }
         } else {
           peg$currPos = s0;
           s0 = peg$FAILED;
         }
       } else {
         peg$currPos = s0;
         s0 = peg$FAILED;
       }
     } else {
       peg$currPos = s0;
       s0 = peg$FAILED;
     }

     return s0;
   }

   function peg$parseName() {
     var s0, s1, s2, s3, s4;

     peg$silentFails++;
     s0 = peg$currPos;
     s1 = peg$currPos;
     if (peg$c2.test(input.charAt(peg$currPos))) {
       s2 = input.charAt(peg$currPos);
       peg$currPos++;
     } else {
       s2 = peg$FAILED;
       if (peg$silentFails === 0) { peg$fail(peg$c3); }
     }
     if (s2 !== peg$FAILED) {
       s3 = [];
       if (peg$c4.test(input.charAt(peg$currPos))) {
         s4 = input.charAt(peg$currPos);
         peg$currPos++;
       } else {
         s4 = peg$FAILED;
         if (peg$silentFails === 0) { peg$fail(peg$c5); }
       }
       while (s4 !== peg$FAILED) {
         s3.push(s4);
         if (peg$c4.test(input.charAt(peg$currPos))) {
           s4 = input.charAt(peg$currPos);
           peg$currPos++;
         } else {
           s4 = peg$FAILED;
           if (peg$silentFails === 0) { peg$fail(peg$c5); }
         }
       }
       if (s3 !== peg$FAILED) {
         s2 = [s2, s3];
         s1 = s2;
       } else {
         peg$currPos = s1;
         s1 = peg$FAILED;
       }
     } else {
       peg$currPos = s1;
       s1 = peg$FAILED;
     }
     if (s1 !== peg$FAILED) {
       peg$savedPos = s0;
       s1 = peg$c6(s1);
     }
     s0 = s1;
     peg$silentFails--;
     if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) { peg$fail(peg$c1); }
     }

     return s0;
   }

   function peg$parseDecimal() {
     var s0, s1, s2, s3, s4;

     peg$silentFails++;
     s0 = peg$currPos;
     s1 = [];
     if (peg$c8.test(input.charAt(peg$currPos))) {
       s2 = input.charAt(peg$currPos);
       peg$currPos++;
     } else {
       s2 = peg$FAILED;
       if (peg$silentFails === 0) { peg$fail(peg$c9); }
     }
     if (s2 !== peg$FAILED) {
       while (s2 !== peg$FAILED) {
         s1.push(s2);
         if (peg$c8.test(input.charAt(peg$currPos))) {
           s2 = input.charAt(peg$currPos);
           peg$currPos++;
         } else {
           s2 = peg$FAILED;
           if (peg$silentFails === 0) { peg$fail(peg$c9); }
         }
       }
     } else {
       s1 = peg$FAILED;
     }
     if (s1 !== peg$FAILED) {
       if (input.charCodeAt(peg$currPos) === 46) {
         s2 = peg$c10;
         peg$currPos++;
       } else {
         s2 = peg$FAILED;
         if (peg$silentFails === 0) { peg$fail(peg$c11); }
       }
       if (s2 !== peg$FAILED) {
         s3 = [];
         if (peg$c8.test(input.charAt(peg$currPos))) {
           s4 = input.charAt(peg$currPos);
           peg$currPos++;
         } else {
           s4 = peg$FAILED;
           if (peg$silentFails === 0) { peg$fail(peg$c9); }
         }
         if (s4 !== peg$FAILED) {
           while (s4 !== peg$FAILED) {
             s3.push(s4);
             if (peg$c8.test(input.charAt(peg$currPos))) {
               s4 = input.charAt(peg$currPos);
               peg$currPos++;
             } else {
               s4 = peg$FAILED;
               if (peg$silentFails === 0) { peg$fail(peg$c9); }
             }
           }
         } else {
           s3 = peg$FAILED;
         }
         if (s3 !== peg$FAILED) {
           peg$savedPos = s0;
           s1 = peg$c12(s1, s3);
           s0 = s1;
         } else {
           peg$currPos = s0;
           s0 = peg$FAILED;
         }
       } else {
         peg$currPos = s0;
         s0 = peg$FAILED;
       }
     } else {
       peg$currPos = s0;
       s0 = peg$FAILED;
     }
     peg$silentFails--;
     if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) { peg$fail(peg$c7); }
     }

     return s0;
   }

   function peg$parseGenerator() {
     var s0, s1, s2, s3, s4;

     s0 = peg$currPos;
     s1 = peg$parseName();
     if (s1 !== peg$FAILED) {
       if (input.charCodeAt(peg$currPos) === 126) {
         s2 = peg$c13;
         peg$currPos++;
       } else {
         s2 = peg$FAILED;
         if (peg$silentFails === 0) { peg$fail(peg$c14); }
       }
       if (s2 !== peg$FAILED) {
         s3 = peg$parseDistribution();
         if (s3 !== peg$FAILED) {
           s4 = peg$parse_();
           if (s4 !== peg$FAILED) {
             peg$savedPos = s0;
             s1 = peg$c15(s1, s3);
             s0 = s1;
           } else {
             peg$currPos = s0;
             s0 = peg$FAILED;
           }
         } else {
           peg$currPos = s0;
           s0 = peg$FAILED;
         }
       } else {
         peg$currPos = s0;
         s0 = peg$FAILED;
       }
     } else {
       peg$currPos = s0;
       s0 = peg$FAILED;
     }

     return s0;
   }

   function peg$parseDistribution() {
     var s0, s1, s2, s3, s4;

     s0 = peg$currPos;
     s1 = peg$parseName();
     if (s1 !== peg$FAILED) {
       if (input.charCodeAt(peg$currPos) === 40) {
         s2 = peg$c16;
         peg$currPos++;
       } else {
         s2 = peg$FAILED;
         if (peg$silentFails === 0) { peg$fail(peg$c17); }
       }
       if (s2 !== peg$FAILED) {
         s3 = peg$parseParamBindings();
         if (s3 !== peg$FAILED) {
           if (input.charCodeAt(peg$currPos) === 41) {
             s4 = peg$c18;
             peg$currPos++;
           } else {
             s4 = peg$FAILED;
             if (peg$silentFails === 0) { peg$fail(peg$c19); }
           }
           if (s4 !== peg$FAILED) {
             peg$savedPos = s0;
             s1 = peg$c20(s1, s3);
             s0 = s1;
           } else {
             peg$currPos = s0;
             s0 = peg$FAILED;
           }
         } else {
           peg$currPos = s0;
           s0 = peg$FAILED;
         }
       } else {
         peg$currPos = s0;
         s0 = peg$FAILED;
       }
     } else {
       peg$currPos = s0;
       s0 = peg$FAILED;
     }

     return s0;
   }

   function peg$parseParamBindings() {
     var s0, s1, s2, s3, s4, s5, s6;

     s0 = peg$currPos;
     s1 = peg$parseParamBinding();
     if (s1 !== peg$FAILED) {
       s2 = [];
       s3 = peg$currPos;
       if (input.charCodeAt(peg$currPos) === 44) {
         s4 = peg$c21;
         peg$currPos++;
       } else {
         s4 = peg$FAILED;
         if (peg$silentFails === 0) { peg$fail(peg$c22); }
       }
       if (s4 !== peg$FAILED) {
         s5 = peg$parse_();
         if (s5 !== peg$FAILED) {
           s6 = peg$parseParamBinding();
           if (s6 !== peg$FAILED) {
             s4 = [s4, s5, s6];
             s3 = s4;
           } else {
             peg$currPos = s3;
             s3 = peg$FAILED;
           }
         } else {
           peg$currPos = s3;
           s3 = peg$FAILED;
         }
       } else {
         peg$currPos = s3;
         s3 = peg$FAILED;
       }
       while (s3 !== peg$FAILED) {
         s2.push(s3);
         s3 = peg$currPos;
         if (input.charCodeAt(peg$currPos) === 44) {
           s4 = peg$c21;
           peg$currPos++;
         } else {
           s4 = peg$FAILED;
           if (peg$silentFails === 0) { peg$fail(peg$c22); }
         }
         if (s4 !== peg$FAILED) {
           s5 = peg$parse_();
           if (s5 !== peg$FAILED) {
             s6 = peg$parseParamBinding();
             if (s6 !== peg$FAILED) {
               s4 = [s4, s5, s6];
               s3 = s4;
             } else {
               peg$currPos = s3;
               s3 = peg$FAILED;
             }
           } else {
             peg$currPos = s3;
             s3 = peg$FAILED;
           }
         } else {
           peg$currPos = s3;
           s3 = peg$FAILED;
         }
       }
       if (s2 !== peg$FAILED) {
         peg$savedPos = s0;
         s1 = peg$c23(s1, s2);
         s0 = s1;
       } else {
         peg$currPos = s0;
         s0 = peg$FAILED;
       }
     } else {
       peg$currPos = s0;
       s0 = peg$FAILED;
     }

     return s0;
   }

   function peg$parseParamBinding() {
     var s0, s1, s2, s3;

     s0 = peg$currPos;
     s1 = peg$parseName();
     if (s1 !== peg$FAILED) {
       if (input.charCodeAt(peg$currPos) === 61) {
         s2 = peg$c24;
         peg$currPos++;
       } else {
         s2 = peg$FAILED;
         if (peg$silentFails === 0) { peg$fail(peg$c25); }
       }
       if (s2 !== peg$FAILED) {
         s3 = peg$parseDecimal();
         if (s3 !== peg$FAILED) {
           peg$savedPos = s0;
           s1 = peg$c26(s1, s3);
           s0 = s1;
         } else {
           peg$currPos = s0;
           s0 = peg$FAILED;
         }
       } else {
         peg$currPos = s0;
         s0 = peg$FAILED;
       }
     } else {
       peg$currPos = s0;
       s0 = peg$FAILED;
     }

     return s0;
   }

   function peg$parse_() {
     var s0, s1;

     peg$silentFails++;
     s0 = [];
     if (peg$c28.test(input.charAt(peg$currPos))) {
       s1 = input.charAt(peg$currPos);
       peg$currPos++;
     } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) { peg$fail(peg$c29); }
     }
     while (s1 !== peg$FAILED) {
       s0.push(s1);
       if (peg$c28.test(input.charAt(peg$currPos))) {
         s1 = input.charAt(peg$currPos);
         peg$currPos++;
       } else {
         s1 = peg$FAILED;
         if (peg$silentFails === 0) { peg$fail(peg$c29); }
       }
     }
     peg$silentFails--;
     if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) { peg$fail(peg$c27); }
     }

     return s0;
   }


     function makeName(result) {
       const chars = [result[0]].concat(result[1]);
       return chars.join("");
     }
     
     function makeFloat(x, y) {
       const chars = x.concat(".").concat(y);
       return parseFloat(chars.join(""));
     }


   peg$result = peg$startRuleFunction();

   if (peg$result !== peg$FAILED && peg$currPos === input.length) {
     return peg$result;
   } else {
     if (peg$result !== peg$FAILED && peg$currPos < input.length) {
       peg$fail(peg$endExpectation());
     }

     throw peg$buildStructuredError(
       peg$maxFailExpected,
       peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
       peg$maxFailPos < input.length
         ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
         : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
     );
   }
 }

 return {
   SyntaxError: peg$SyntaxError,
   parse:       peg$parse
 };
})();