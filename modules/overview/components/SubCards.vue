<!-- modules/overview/components/SubCards.vue -->
<template>
  <div class="sub-cards">
    <!-- 1. قيمة المخزون -->
    <div class="sub-card">
      <div class="sub-icon"><i class="fas fa-boxes"></i></div>
      <div class="sub-info">
        <h4>قيمة المخزون</h4>
        <h3>{{ formatCurrency(inventory?.value || 0) }}</h3>
        <div class="progress-mini">
          <div class="fill" style="--p:75%;"></div>
        </div>
        <span style="font-size: 11px; color: #7f8c8d;">
          {{ inventory?.total_items || 0 }} صنف
        </span>
      </div>
    </div>

    <!-- 2. أرباح اليوم -->
    <div class="sub-card">
      <div class="sub-icon"><i class="fas fa-hand-holding-usd"></i></div>
      <div class="sub-info">
        <h4>أرباح اليوم</h4>
        <h3>{{ formatCurrency(profit?.today || 0) }}</h3>
        <div class="progress-mini">
          <div class="fill" style="--p:60%; background:linear-gradient(90deg,#f39c12,#e67e22);"></div>
        </div>
      </div>
    </div>

    <!-- 3. مشتريات اليوم -->
    <div class="sub-card">
      <div class="sub-icon"><i class="fas fa-shopping-cart"></i></div>
      <div class="sub-info">
        <h4>مشتريات اليوم</h4>
        <h3>{{ formatCurrency(purchases?.today || 0) }}</h3>
        <div class="progress-mini">
          <div class="fill" style="--p:40%; background:linear-gradient(90deg,#1abc9c,#16a085);"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['inventory', 'profit', 'purchases']);
const formatCurrency = (v) => Number(v || 0).toLocaleString();
</script>
