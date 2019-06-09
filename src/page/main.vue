<template>
  <div>
    <NavMenu/>
    <div class="container">
      <div class="left">
        <div id="myChart"></div>
        <div class="info">
          <div class="pcb_list">
            <Card :name="'running list'" :data="running_list"/>
            <Card :name="'ready list'" :data="ready_list"/>
            <Card :name="'block list'" :data="block_list"/>
            <el-card class="box-card PCB">
              <div slot="header" class="clearfix">
                <span>PCB</span>
                <el-button
                  style="float: right; padding: 3px 0"
                  type="text"
                  @click=" dialogVisible2 = true"
                >选择</el-button>
              </div>
              <div class="text item"></div>
            </el-card>
          </div>
          <div class="resource_list">
            <Card :name="'R1'" :data="get_resource(0)"/>
            <Card :name="'R2'" :data="get_resource(1)"/>
            <Card :name="'R3'" :data="get_resource(2)"/>
            <Card :name="'R4'" :data="get_resource(3)"/>
          </div>
        </div>
      </div>
      <div class="right">
        <el-card class="box-card debugger">
          <div slot="header" class="clearfix">
            <span>Debugger</span>
          </div>
          <div class="text item">
            <Debugger ref="debugger" @drawLine="drawLine"/>
          </div>
        </el-card>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="get_command_length*10"
          @current-change="handleCurrentChange"
          :current-page.sync="currentPage"
        ></el-pagination>
      </div>
    </div>
    <!-- edit -->
    <el-button type="primary" icon="el-icon-edit" circle class="edit" @click="dialogVisible = true"></el-button>
    <el-dialog title="test shell input" :visible.sync="dialogVisible" width="30%">
      <el-input
        type="textarea"
        :rows="2"
        placeholder="请输入内容"
        v-model="textarea"
        :autosize="{ minRows: 20}"
      ></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="afterEdit">确 定</el-button>
      </span>
    </el-dialog>
    <!-- add -->
    <el-button type="primary" class="add" @click="dialogVisible1 = true" circle>+</el-button>
    <el-dialog title="comand input" :visible.sync="dialogVisible1" width="30%">
      <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="input">
          <el-input v-model="form.input"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible1 = false">取 消</el-button>
        <el-button type="primary" @click="afterAdd">确 定</el-button>
      </span>
    </el-dialog>
    <!-- delete -->
    <el-button type="danger" icon="el-icon-delete" @click="deleteAlert" class="delete" circle></el-button>
    <!-- selector -->
    <el-dialog title="PCBS" :visible.sync="dialogVisible2" width="30%">
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible2 = false">取 消</el-button>
        <el-button type="primary" @click="selectPCB">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import NavMenu from "@/components/NavMenu";
import Card from "@/components/Card";
import Debugger from "@/components/Debugger";
import { mapState, mapGetters, mapActions, mapMutations } from "vuex";
// 引入基本模板
let echarts = require("echarts");
export default {
  name: "Main",
  components: {
    NavMenu,
    Card,
    Debugger
  },
  data() {
    return {
      dialogVisible: false,
      dialogVisible1: false,
      dialogVisible2: false,
      currentPage: 1,
      textarea: "",
      form: {
        input: ""
      }
    };
  },
  mounted() {
    this.myChart = echarts.init(document.getElementById("myChart"));
    this.drawLine();
  },
  methods: {
    handleCurrentChange(val) {
      this.$store.commit("resetPCBs");
      this.$store.commit("resetProcessor");
      this.$store.commit("resetResource");
      this.$store.commit("create_process", { pid: "init", priority: 0 });
      this.$refs.debugger.runShell(val);
    },
    selectPCB() {},
    afterEdit() {
      this.$refs.debugger.cleanDebugger();
      this.dialogVisible = false;
      this.$store.state.Command.input = this.textarea.split("\n");
      this.currentPage = this.$store.getters.get_command_length;
      this.$refs.debugger.runShell();
    },
    afterAdd() {
      this.dialogVisible1 = false;
      this.$store.state.Command.input.push(this.form.input);
      this.$store.commit("resetPCBs");
      this.$store.commit("resetProcessor");
      this.$store.commit("resetResource");
      this.$store.commit("create_process", { pid: "init", priority: 0 });
      this.$refs.debugger.runShell();
      this.drawLine();
      this.form.input = "";
    },
    deleteAlert() {
      this.$confirm("此操作将永久删除该记录, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.$refs.debugger.cleanDebugger();
          this.$message({
            type: "success",
            message: "删除成功!"
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除"
          });
        });
    },
    deepCopy(obj) {
      let newObj = Array.isArray(obj) ? [] : {};
      if (obj && typeof obj === "object") {
        for (let arr in obj) {
          if (obj.hasOwnProperty(arr)) {
            if (
              obj[arr] &&
              typeof obj[arr] === "object" &&
              arr != "parent" &&
              arr != "resources"
            ) {
              newObj[arr] = this.deepCopy(obj[arr]);
            } else {
              if (arr == "children" && obj[arr].length != 0) {
                newObj["children"] = obj[arr];
              } else if (arr == "pid") {
                newObj["name"] = obj[arr];
              } else if (arr == "priority") {
                newObj["value"] = obj[arr];
              }
            }
          }
        }
      }
      return newObj;
    },
    drawLine() {
      // 基于准备好的dom，初始化echarts实例
      let data = this.getTree;
      let copyData = this.deepCopy(data);
      // 绘制图表
      this.myChart.setOption({
        title: { text: "树形结构" },
        tooltip: {
          trigger: "item",
          triggerOn: "mousemove"
        },
        series: [
          {
            type: "tree",
            data: [copyData],
            left: "2%",
            right: "2%",
            top: "8%",
            bottom: "20%",
            symbol: "emptyCircle",
            orient: "vertical",
            label: {
              normal: {
                position: "left",
                verticalAlign: "middle",
                align: "right",
                fontSize: 18
              }
            },
            leaves: {
              label: {
                normal: {
                  position: "left",
                  verticalAlign: "middle",
                  align: "right"
                }
              }
            },
            animationDurationUpdate: 750,
            expandAndCollapse: true,
            initialTreeDepth: -1
          }
        ]
      });
    }
  },
  computed: {
    ...mapGetters({
      ready_list: "get_ready_list",
      running_list: "get_running_list",
      block_list: "get_block_list",
      getTree: "getTree",
      get_resource: "get_resource",
      get_command_length: "get_command_length"
    })
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  width: 100%;
  display: flex;
  flex-flow: row;
}
.left,
.right {
  display: flex;
  flex-flow: column;
}
.left {
  width: calc(50% - 2px);
  border-right: 2px solid grey;
}
.right {
  width: calc(50% - 2px);
  border-left: 2px solid grey;
  justify-content: center;
  align-items: center;
}
.pcb_list,
.resource_list {
  display: flex;
  flex-flow: row wrap;
}
.debugger {
  margin: 30px;
}
.edit {
  position: fixed;
  right: 50px;
  bottom: 50px;
  height: 50px;
  width: 50px;
}
.add {
  position: fixed;
  right: 50px;
  bottom: 125px;
  height: 50px;
  width: 50px;
}
.delete {
  position: fixed;
  right: 50px;
  bottom: 200px;
  height: 50px;
  width: 50px;
}
#myChart {
  margin-top: 20px;
  width: 100%;
  height: 380px;
}
.box-card.PCB {
  width: 200px;
  max-height: 250px;
  margin: 10px;
}
</style>
