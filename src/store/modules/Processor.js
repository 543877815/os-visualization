const state = {
    ready_list: [],
    block_list: [],
    running_list: [],

}

// getters
const getters = {
    get_ready_list(state) {
        let list = []
        if (state.ready_list.length == 0) {
            return list
        } else {
            state.ready_list.forEach(element => {
                list.push(`${element.pid}   ${element.priority}`)
            })
            return list
        }
    },
    get_running_list(state) {
        let list = []
        if (state.running_list.length == 0) {
            return list
        } else {
            state.running_list.forEach(element => {
                list.push(`${element.pid}   ${element.priority}`)
            })
            return list
        }

    },
    get_block_list(state) {

        let list = []
        if (state.block_list.length == 0) {
            return list
        } else {
            state.block_list.forEach(element => {
                list.push(`${element.pid}   ${element.priority}`)
            })
            return list
        }
    },
    deepCopy: () => (obj) => {
        let newObj = Array.isArray(obj) ? [] : {}
        if (obj && typeof obj === "object") {
            for (let arr in obj) {
                if (obj.hasOwnProperty(arr)) {
                    if (
                        obj[arr] &&
                        typeof obj[arr] === "object" &&
                        arr != "parent" &&
                        arr != "resources"
                    ) {
                        newObj[arr] = this.commit("deepCopy", obj[arr])
                    } else {
                        if (arr == "children" && obj[arr].length != 0) {
                            newObj["children"] = obj[arr]
                        } else if (arr == "pid") {
                            newObj["name"] = obj[arr]
                        } else if (arr == "priority") {
                            newObj["value"] = obj[arr]
                        }
                    }
                }
            }
        }
        return newObj
    },
}

// actions
const actions = {

}

// mutations
const mutations = {
    resetProcessor(state) {
        state.ready_list = []
        state.block_list = []
        state.running_list = []
    },
    create_process(state, payload) {
        // 判断进程是否存在
        if (state.running_list.length != 0) {
            if (state.running_list.filter(element => element != undefined && element.pid == payload.pid).length != 0 ||
                state.ready_list.filter(element => element != undefined && element.pid == payload.pid).length != 0 ||
                state.block_list.filter(element => element != undefined && element.pid == payload.pid).length != 0) {
                console.log(`create failed, process ${payload.pid} existed!`)
                return
            }
        }
        // 修改PCB
        this.commit("init", payload)
        // 新创建的进程插入到RL队列的末尾
        let new_pcb = this.getters.getNewCreateProcess
        state.ready_list.push(new_pcb)
        // 如果创建的不是init进程
        if (state.running_list.length != 0) {
            this.commit("set_parent_child", { parent: state.running_list[0], child: new_pcb })
        }
        this.commit("schedule")
    },
    delete_process(state, payload) {
        let list = state.running_list.concat(state.ready_list).concat(state.block_list)
        let processes = list.filter(el => el.pid == payload.pid)
        if (processes == undefined || processes.length == 0) {
            return
        }
        let process = processes[0]

        // 删除父子节点关系
        process.parent.children.splice(process.parent.children.findIndex((element) => { return element.pid == payload.pid }), 1)
        let children_length = process.children.length
        // 级联删除
        for (let i = 0; i < children_length; i++) {
            this.commit("delete_process", { pid: process.children[0].pid, time: 1 })
        }
        // 将自己拥有的资源进行释放
        let resource_length = process.resources.length
        for (let i = 0; i < resource_length; i++) {
            this.commit("release_resource", {
                process: process,
                rid: process.resources[i].rid,
                release_status: process.resources[i].status
            })
        }

        // 将资源等待队列记录清除
        this.commit("delete_waiting", { pid: payload.pid })

        // PCB 修改
        this.commit("delete", { pid: payload.pid })
        // console.log(payload.pid, process, process.status, payload.time)
        // 根据状态查找对应的队列进行删除
        let process_status = process.status
        if (process_status == "running") {
            state.running_list.splice(state.running_list.findIndex((element) => { return element.pid == payload.pid }), 1)
        } else if (process_status == "blocked") {
            state.block_list.splice(state.block_list.findIndex((element) => { return element.pid == payload.pid }), 1)
        } else if (process_status == "ready") {
            state.ready_list.splice(state.ready_list.findIndex((element) => { return element.pid == payload.pid }), 1)
        }

        if (payload.time == 0) {
            this.commit("schedule")
        }
    },
    request_resource(state, payload) {
        let process = state.running_list[0]
        let request_status = parseInt(payload.request_status)
        this.commit("request", {
            process: process,
            rid: payload.rid,
            request_status: request_status
        })
        // 若资源请求成功，修改进程状态
        if (this.getters.get_request_code == 0) {
            let process_resource = process.resources.filter(element => { element != undefined && element.rid == payload.rid })
            // 若资源不存在则分配
            if (process_resource == undefined) {
                process.resources.push({
                    "rid": payload.rid,
                    "status": payload.request_status
                })
                // 若资源存在则进行叠加
            } else {
                process_resource.status += payload.request_status
            }
            // 修改PCB
            this.commit("set_resource", {
                pid: state.running_list[0].pid,
                rid: payload.rid,
                status: payload.request_status
            })
            // 若资源不足，则修改当前进程为阻塞态, 添加到阻塞队列，移除运行队列，进行调度
        } else if (this.getters.get_request_code == 1) {
            // 修改PCB
            this.commit("set_status", {
                pid: state.running_list[0].pid,
                status: payload.request_status
            })
            // 修改队列
            state.block_list.push(state.running_list[0])
            state.running_list[0].status = "blocked"
            state.running_list.pop()
            this.commit("schedule")
        }
    },
    release_resource(state, payload) {
        // 获取当前已分配的资源
        let release_status = parseInt(payload.release_status)
        let list = state.running_list.concat(state.ready_list).concat(state.block_list)
        let processes = list.filter(el => payload.process != undefined && el.pid == payload.process.pid)
        let process = payload.process != undefined ? processes[0] : state.running_list[0]
        let resources = process.resources.filter(element => element.rid == payload.rid)
        if (resources == undefined || resources.length == 0) { return }
        let resource = resources[0]
        let status_allocated = parseInt(resource.status)
        // 如果已分配资源大于等于要求释放资源，则释放资源，并修改进程状态
        if (status_allocated >= payload.release_status) {
            this.commit("release", {
                process: process,
                rid: payload.rid,
                release_status: release_status
            })

            if (this.getters.get_release_code == 0) {
                // 修改PCB
                this.commit("set_resource", {
                    pid: process.pid,
                    rid: payload.rid,
                    status: status_allocated - payload.release_status
                })
                // process.resources.push({
                //     "rid": payload.rid,
                //     "status": status_allocated - payload.release_status
                // })
                // 标志位用于判断是否遇见阻塞队列
                let flag = false
                for (let i in state.block_list) {
                    // 查看资源的等待队列
                    let waiting_list = this.getters.get_waiting_list(payload.rid)
                    for (let j in waiting_list) {
                        // 查看是否能唤醒并分配资源
                        if (state.block_list[i].pid == waiting_list[j].pid) {
                            // 标志位为真则证明有先到的进程被阻塞，且不满足唤醒条件，故而后续的队列不进行唤醒询问
                            if (flag) return
                            let resource_status = this.getters.get_status((payload.rid))
                            let request_status = waiting_list[j].status
                            if (resource_status >= request_status) {
                                state.block_list[i].status = "ready"
                                this.commit("set_resource", {
                                    pid: state.block_list[i].pid,
                                    rid: payload.rid,
                                    status: request_status
                                })
                                state.ready_list.push(state.block_list[i])
                                this.commit("delete_waiting", { pid: state.block_list[i].pid, rid: payload.rid })
                                this.commit("request", {
                                    process: state.block_list[i],
                                    rid: payload.rid,
                                    request_status: request_status
                                })
                                state.block_list.splice(state.block_list.findIndex(element => element.pid == state.block_list[i].pid), 1)
                                this.commit("schedule")
                            } else {
                                flag = true
                            }
                        }
                    }
                }
            }
        } else {
            console.log(`error, the process "${process.pid}" only request ${resource.status}
            resource(s), your input has exceeded it`)
        }
    },
    schedule(state) {
        // 选取优先级最高而且到达时间最早的进程
        let system = state.ready_list.filter(el => el != undefined && el.priority == 2)
        let user = state.ready_list.filter(el => el != undefined && el.priority == 1)
        let tasks
        if (system.length != 0) {
            tasks = system
        } else if (user.length != 0) {
            tasks = user
        } else {
            tasks = state.ready_list.filter(el => el != undefined && el.priority == 0)
        }
        // 如果运行队列为空
        if (state.running_list.length == 0) {
            state.running_list.push(tasks[0])
            tasks[0].status = "running"
            this.commit("set_status", { pid: tasks[0].pid, status: tasks[0].status })
            state.ready_list.splice(state.ready_list.findIndex(element => element.pid == tasks[0].pid), 1)
            return
        }

        // 如果优先级大于正在运行的进程则进行抢占
        if (tasks[0].priority > state.running_list[0].priority) {
            // 取出正在运行的队列
            state.running_list[0].status = "ready"
            state.ready_list.push(state.running_list[0])
            state.running_list.pop()

            // 运行被选中的进程
            tasks[0].status = "running"
            this.commit("set_status", { pid: tasks[0].pid, status: tasks[0].status })
            state.ready_list.splice(state.ready_list.indexOf(tasks[0]), 1)
            state.running_list.push(tasks[0])
        }
    },
    time_out(state) {
        state.running_list[0].status = "ready"
        state.ready_list.push(state.running_list[0])
        state.running_list.splice(0, 1)
        this.commit("schedule")
    },
    get_process_list(state) {
        return state.running_list.concat(state.ready_list).concat(state.block_list)
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}