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
    "stimulus-blue yes 1",
    "stimulus-blue no 0",
    "no-stimulus-red yes 0",
    "no-stimulus-red no 1",
    "no-stimulus-blue yes 0",
    "no-stimulus-blue no 1",
]

var app = new Vue({
    el: '#app',
    data: {
        param_input_defns: default_param_input_defns.join("\n"),
        param_action_defns: default_param_action_defns.join("\n"),
        param_input_action_reward_defns: default_param_input_action_reward_defns.join("\n"),
        ui_mode: "edit",
        out_debug: "",
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
            this.out_debug = result.out_debug;
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

    return {
        "out_debug": ctx,
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
    let m = line.match(/(?<input>[A-Za-z][A-Za-z0-9-_]*)[\s]+(?<action>[A-Za-z][A-Za-z0-9-_]*)[\s]+(?<value>[+-]?\d+(\.\d+)?)/);
    return {
        "input": m.groups.input,
        "action": m.groups.action,
        "value": parseFloat(m.groups.value),
    }
}

function randomChoice(items) {
    return items[Math.floor(items.length * Math.random())];
}