// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue"
import App from "./App"
import router from "./router"
import ElementUI from "element-ui"
import Vuex from "vuex"
import "element-ui/lib/theme-chalk/index.css"

import PCB from "./store/modules/PCB"
import Processor from "./store/modules/Processor"
import Resource from "./store/modules/Resource"
import Command from "./store/modules/Command"

Vue.use(Vuex)
Vue.config.productionTip = false
Vue.use(ElementUI)

const store = new Vuex.Store({
  modules: {
    PCB,
    Processor,
    Resource,
    Command
  },
})
/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  store,
  components: { App },
  template: "<App/>"
})

