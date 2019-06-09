const state = {
    input: [

    ],
    output: [

    ]
}

// getters
const getters = {
    get_command_length(state){
        return state.input.length
    }
}

// actions
const actions = {

}

// mutations
const mutations = {
    resetCommand(state) {
        state.input = []
        state.output = []
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}