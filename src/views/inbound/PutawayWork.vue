<template>
  <div class="app-container">
    <el-page-header @back="$router.back()" content="上架确认" style="margin-bottom: 20px;" />

    <el-card class="box-card" style="max-width: 600px; margin: 0 auto;">
      <el-form :model="form" label-width="100px" size="large">
        <el-form-item label="托盘/箱码">
          <el-input v-model="form.palletNo" placeholder="扫描或输入托盘条码" readonly>
            <template #prefix><el-icon><Box /></el-icon></template>
          </el-input>
        </el-form-item>
        
        <el-alert title="请将物料移动至：" type="info" :closable="false" style="margin-bottom: 20px;">
          <h2 style="margin: 10px 0; color: #409EFF;">{{ targetBin }}</h2>
        </el-alert>

        <el-form-item label="实际库位">
          <el-input v-model="form.scanBin" placeholder="扫描目标库位条码以确认" ref="binInput">
             <template #prefix><el-icon><Location /></el-icon></template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitPutaway" style="width: 100%;">确认上架</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Box, Location } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const form = reactive({
  palletNo: route.query.palletNo || '',
  scanBin: ''
});

const targetBin = ref('A-01-02-01'); // 模拟从上一页带来的推荐库位

const submitPutaway = () => {
  if (form.scanBin !== targetBin.value) {
    ElMessage.error('扫描库位与推荐库位不一致，请核对！(允许强行上架需授权)');
    return;
  }
  ElMessage.success('上架成功！库存已更新');
  router.push({ name: 'PutawayTask' });
};
</script>