<template>
  <div>
    <el-table
      ref="singleTable"
      :data="tableData"
      highlight-current-row
      @current-change="handleCurrentChange"
      style="width: 100%"
      class="debug"
      height="700"
    >
      <el-table-column label="index" type="index" width="100"></el-table-column>
      <el-table-column property="input" label="input" width="200"></el-table-column>
      <el-table-column property="output" label="output" width="200"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from "vuex";

export default {
  data() {
    return {
      tableData: [],
      currentRow: null
    };
  },
  mounted() {
    this.$store.commit("create_process", { pid: "init", priority: 0 });
  },
  methods: {
    setCurrent(row) {
      this.$refs.singleTable.setCurrentRow(row);
    },
    handleCurrentChange(val) {
      this.currentRow = val;
    },
    analysis(input) {
      // 去除输入两边空格
      input = input.replace(/(^\s*)|(\s*$)/g, "");
      // 去除输入中多个空格
      input = input.replace(/^\s+/g, "").replace(/\s+$/g, "");
      // 解析用户输入
      let xs = input.split(" ");
      if (xs.length == 3) {
        // create process
        if (xs[0] == "cr") {
          let pid = xs[1];
          let priority = xs[2];
          // 只能创建优先级为1或者2的进程，init进程的优先级为0
          if (parseInt(priority) != 1 && parseInt(priority) != 2) {
            console.log("invalid syntax:" + priority + ", type [1,2]");
            return 0;
          }
          this.$store.commit("create_process", {
            pid: pid,
            priority: parseInt(priority)
          });
          // request resource
        } else if (xs[0] == "req") {
          let rid = xs[1];
          let r = /^\+?[1-9][0-9]*$/;
          let num = parseFloat(xs[2]);
          if (r.test(num) && Math.abs(num) == num) {
            this.$store.commit("request_resource", {
              rid: rid,
              request_status: parseInt(num)
            });
          } else {
            console.log("error, the request number must be positive integer!");
            return 0;
          }
          // release resource
        } else if (xs[0] == "rel") {
          let rid = xs[1];
          let r = /^\+?[1-9][0-9]*$/;
          let num = parseFloat(xs[2]);
          if (r.test(num) && Math.abs(num) == num) {
            this.$store.commit("release_resource", {
              rid: rid,
              release_status: parseInt(num)
            });
          } else {
            console.log("error, the release number must be positive integer!");
            return 0;
          }
        } else {
          console.log("invalid syntax" + xs[0]);
          return 0;
        }
      } else if (xs.length == 2) {
        // delete process
        if (xs[0] == "de") {
          // 不能删除 init 进程
          let pid = xs[1];
          if (pid == "init") {
            print("error, can not delete process init!");
            return 0;
          }
          this.$store.commit("delete_process", {pid: pid, time: 0});
        } else {
          console.log("some syntax error occur");
          return 0;
        }
      } else {
        // time out
        if (input == "to") {
          this.$store.commit("time_out");
        } else {
          console.log("some syntax error occur");
          return 0;
        }
      }
      this.$store.state.Command.output.push(this.running_list);
      return this.running_list[0].split(" ")[0];
    },
    runShell(length) {
      this.tableData = [];
      let input
      if (length == undefined) {
        input = this.$store.state.Command.input
      }else{
        input = this.$store.state.Command.input.slice(0, length)
      }
      input.forEach(element => {
        let output = this.analysis(element);
        let data = {
          input: element,
          output: output
        };
        this.tableData.push(data);
      });
      this.$emit("drawLine");
    },
    cleanDebugger() {
      this.tableData = [];
      this.$store.commit("resetPCBs");
      this.$store.commit("resetProcessor");
      this.$store.commit("resetResource");
      this.$store.commit("resetCommand");
      this.$store.commit("create_process", { pid: "init", priority: 0 });
      this.$emit("drawLine");
    }
  },
  computed: {
    ...mapGetters({
      running_list: "get_running_list"
    })
  }
};
</script>
<style scoped>

</style>