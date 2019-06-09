<template>
  <el-menu
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
  >
    <el-menu-item index="1">os可视化</el-menu-item>
  </el-menu>
</template>

<style>
</style>

<script>
export default {
  data() {
    return {
      activeIndex: "1",
    };
  },
  methods: {

  }
};
</script>