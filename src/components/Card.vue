<template>
  <div>
    <el-card class="box-card card">
      <div slot="header" class="clearfix">
        <span>{{name}}</span>
        <el-button style="float: right; padding: 3px 0" type="text">{{opera}}</el-button>
      </div>
      <div v-for="o in data" :key="o" class="text item">{{o}}</div>
    </el-card>
  </div>
</template>

<style scoped>
.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both;
}

.box-card {
  width: 200px;
  max-height: 250px;
  margin: 10px;
}
</style>

<style>
.card .el-card__body {
  height: 130px;
  overflow-y: auto;
}
</style>

<script>
export default {
  name: "card",
  props: {
    name: {
      type: String,
      required: true
    },
    opera: {
      type: String
    },
    data: {}
  }
};
</script>