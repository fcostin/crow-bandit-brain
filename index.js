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
    },
    computed: {
        is_editing_disabled: function() {
            return this.ui_mode != "edit"
        },
    }
});