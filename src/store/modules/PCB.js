const state = {
  PCBs: [
    // {
    //   pid: "init",
    //   priority: 0,
    //   status: "ready",
    //   parent: null,
    //   children: [],
    //   resources: [],
    // }
  ]
}
// getters
const getters = {
  get_PCBs: (state) => (index) => {
    let R = []
    R.push(`status: ${state.list[index].status}`)
    R.push(`waiting list: ${JSON.stringify(state.list[index].waiting_list)}`)
    R.push(`allocated list: ${JSON.stringify(state.list[index].allocated_list)}`)
    return R
  },
  getNewCreateProcess(state) {
    return state.PCBs[state.PCBs.length - 1]
  },
  getTree(state) {
    let root
    state.PCBs.forEach(element => {
      if (element.pid == "init") {
        root = element
      }
    })
    return root
  },
}

// actions
const actions = {
}

// mutations
const mutations = {
  resetPCBs(state) {
    state.PCBs = []
  },
  init(state, payload) {
    let PCB = {
      pid: payload.pid,
      priority: payload.priority,
      status: "ready",
      parent: null,
      children: [],
      resources: [],
    }
    state.PCBs.push(PCB)
    return PCB
  },
  delete(state, payload) {
    state.PCBs.splice(state.PCBs.findIndex(element => element.pid == payload.pid), 1)
  },
  delete_parent(state, payload) {
    state.PCBs.forEach(element => {
      if (element.pid == payload.child.pid) {
        element.parent = null
      }
    })
  },
  delete_child(state, payload) {
    state.PCBs.forEach(element => {
      if (element.pid == payload.parent.pid) {
        element.children.splice(element.children.findIndex(elem => elem.pid == payload.child.pid), 1)
      }
    })
  },
  set_parent_child(state, payload) {
    state.PCBs.forEach(element => {
      if (element.pid == payload.child.pid) {
        element.parent = payload.parent
      }
      if (element.pid == payload.parent.pid) {
        element.children.push(payload.child)
      }
    })
  },
  set_status(state, payload) {
    state.PCBs.forEach(element => {
      if (element.pid == payload.pid) {
        element.status = payload.status
      }
    })
  },
  set_resource(state, payload) {
    let processes = state.PCBs.filter(element => element.pid == payload.pid)
    let resources = processes[0].resources.filter(element => element.rid == payload.rid)
    if (resources.length == 0) {
      processes[0].resources.push({
        rid: payload.rid,
        status: payload.status
      })
    } else {
      if (resources[0].status == 0) {
        processes[0].resources.splice(processes[0].resources.findIndex(element => { return element.rid == payload.rid }), 1)
      } else {
        resources[0].status = payload.status
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