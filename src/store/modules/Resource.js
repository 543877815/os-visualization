const state = {
    list: [
        {
            rid: "R1",
            max: 1,
            status: 1,
            waiting_list: [],
            allocated_list: [],
        },
        {
            rid: "R2",
            max: 2,
            status: 2,
            waiting_list: [],
            allocated_list: [],
        },
        {
            rid: "R3",
            max: 3,
            status: 3,
            waiting_list: [],
            allocated_list: [],
        },
        {
            rid: "R4",
            max: 4,
            status: 4,
            waiting_list: [],
            allocated_list: [],
        }
    ],
    request_code: -1,
    release_code: -1
}

// getters
const getters = {
    get_resource: (state) => (index) => {
        let R = []
        R.push(`max: ${state.list[index].max}`)
        R.push(`status: ${state.list[index].status}`)
        R.push(`waiting list: ${JSON.stringify(state.list[index].waiting_list)}`)
        R.push(`allocated list: ${JSON.stringify(state.list[index].allocated_list)}`)
        return R
    },
    get_waiting_list: (state) => (rid) => {
        let R = []
        state.list.forEach(element => {
            if (element.rid == rid) R.push(element)
        })
        return R[0].waiting_list
    },
    get_status: (state) => (rid) => {
        let R = []
        state.list.forEach(element => {
            if (element.rid == rid) R.push(element)
        })
        return R[0].status
    },
    get_request_code(state) {
        return state.request_code
    },
    get_release_code(state) {
        return state.release_code
    }
}

// actions
const actions = {

}

// mutations
const mutations = {
    resetResource(state) {
        state.list = [
            {
                rid: "R1",
                max: 1,
                status: 1,
                waiting_list: [],
                allocated_list: [],
            },
            {
                rid: "R2",
                max: 2,
                status: 2,
                waiting_list: [],
                allocated_list: [],
            },
            {
                rid: "R3",
                max: 3,
                status: 3,
                waiting_list: [],
                allocated_list: [],
            },
            {
                rid: "R4",
                max: 4,
                status: 4,
                waiting_list: [],
                allocated_list: [],
            }
        ],
            state.request_code = -1,
            state.release_code = -1
    },
    request(state, payload) {
        let resources = state.list.filter(element => element.rid == payload.rid)
        if (resources.length != 0) {
            let resource = resources[0]
            // 如果剩余资源大于等于请求资源，则请求资源成功
            if (resource.status >= payload.request_status) {
                // 维护剩余资源状态
                resource.status = resource.status - payload.request_status
                // 维护已分配资源状态
                let allocated_status = resource.allocated_list.filter(element => { element.pid == payload.process.pid })
                if (allocated_status.length == 0) {
                    resource.allocated_list.push({
                        "pid": payload.process.pid,
                        "priority": payload.process.priority,
                        "status": payload.request_status
                    })
                } else {
                    resource.allocated_list.status = allocated_status + payload.request_status
                }
                state.request_code = 0
                // 否则阻塞
            } else {
                resource.waiting_list.push({
                    "pid": payload.process.pid,
                    "priority": payload.process.priority,
                    "status": payload.request_status
                })
                state.request_code = 1
            }
        } else {
            console.log(`resource ${payload.rid} not exist!`)
            state.request_code = -1
        }
    },
    release(state, payload) {
        let resources = state.list.filter(element => element.rid == payload.rid)
        if (resources.length != 0) {
            let resource = resources[0]
            let allocated_process = resource.allocated_list.filter(element => element.pid == payload.process.pid)
            if (allocated_process.length == 0) return
            let allocated_status = allocated_process[0].status
            // 如果释放资源大于该进程已分配资源
            if (payload.release_status > allocated_status) {
                console.log("release failed, the release number exceeds the number of the resource this process requested!")
                // 如果该进程已分配资源大于等于释放资源，则释放资源成功
            } else {
                // 维护资源状态
                resource.status += payload.release_status
                if (allocated_status - payload.release_status == 0) {
                    let index = resource.allocated_list.findIndex(element => { return element.pid == payload.process.pid })
                    if (index == -1) return
                    resource.allocated_list.splice(index, 1)
                } else {
                    let index = resource.allocated_list.findIndex(element => { return element.pid == payload.process.pid })
                    if (index == -1) return
                    resource.allocated_list[index].status = allocated_status - payload.release_status
                }
                state.release_code = 0
            }
        } else {
            console.log(`Resource ${payload.rid} not exist!`)
            state.release_code = -1
        }
    },
    delete_waiting(state, payload) {
        if (payload.rid == undefined) {
            state.list.forEach(element => {
                let index = element.waiting_list.findIndex(element1 => { return element1.pid == payload.pid })
                if (index == -1) return
                element.waiting_list.splice(index, 1)
            })
        } else {
            let resources = state.list.filter(element => element.rid == payload.rid)
            if (resources.length != 0) {
                let resource = resources[0]
                let index = resource.waiting_list.findIndex(element => { return element.pid == payload.pid })
                if (index == -1) return
                resource.waiting_list.splice(index, 1)
            } else {
                console.log(`resource ${payload.rid} not exist!`)
            }
        }
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}