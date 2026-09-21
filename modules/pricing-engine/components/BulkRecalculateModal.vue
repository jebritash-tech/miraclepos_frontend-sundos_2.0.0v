<!-- modules/pricing-engine/components/BulkRecalculateModal.vue -->
<template>
  <div v-if="show" class="bulk-modal-overlay" @click.self="close">
    <div class="bulk-modal">
      <!-- Header -->
      <div class="bm-header">
        <div class="bm-icon"><i class="fas fa-sync-alt"></i></div>
        <div class="bm-header-text">
          <h2>إعادة حساب الأسعار</h2>
          <p>تحديث أسعار البيع بناءً على القواعد الحالية</p>
        </div>
        <button class="bm-close" @click="close"><i class="fas fa-times"></i></button>
      </div>

      <!-- Info -->
      <div class="bm-notice">
        <i class="fas fa-info-circle"></i>
        <p>
          استخدم هذه الميزة بعد تعديل قاعدة الربح (مثلاً عند تغيّر سعر الدولار) لتطبيق القاعدة على كل الأسعار.
          <strong>الأسعار المقفلة يدوياً لن تُلمس.</strong>
        </p>
      </div>

      <!-- ✅ Presets -->
      <div class="bm-section">
        <h3><i class="fas fa-bolt"></i> اختر نوع العملية</h3>

        <div class="bm-presets">
          <button
            @click="applyPreset('quick')"
            :class="['bm-preset', { active: activePreset === 'quick' }]">
            <i class="fas fa-bolt"></i>
            <div>
              <strong>تحديث سريع</strong>
              <small>الدفعات التي بها مخزون فقط</small>
            </div>
          </button>

          <button
            @click="applyPreset('imported')"
            :class="['bm-preset', { active: activePreset === 'imported' }]">
            <i class="fas fa-plane-import"></i>
            <div>
              <strong>المستورد فقط</strong>
              <small>لتغيّر سعر الدولار</small>
            </div>
          </button>

          <button
            @click="applyPreset('full')"
            :class="['bm-preset', { active: activePreset === 'full' }]">
            <i class="fas fa-globe"></i>
            <div>
              <strong>تحديث كامل</strong>
              <small>كل الدفعات، بدون قيود</small>
            </div>
          </button>
        </div>
      </div>

      <!-- Advanced filters -->
      <div class="bm-section">
        <h3><i class="fas fa-filter"></i> فلاتر متقدمة</h3>

        <label class="bm-check">
          <input type="checkbox" v-model="filters.only_imported">
          <div>
            <span>الأدوية المستوردة فقط</span>
            <small>تجاهل الأدوية المحلية (لا تتأثر بسعر الدولار)</small>
          </div>
        </label>

        <label class="bm-check">
          <input type="checkbox" v-model="filters.only_with_stock">
          <div>
            <span>الدفعات التي بها مخزون فقط</span>
            <small>تجاهل الدفعات الفارغة</small>
          </div>
        </label>

        <label class="bm-check">
          <input type="checkbox" v-model="filters.skip_locked">
          <div>
            <span>تجاهل الأسعار المقفلة يدوياً</span>
            <small>احتفظ بالقرارات اليدوية للمدير</small>
          </div>
        </label>
      </div>

      <!-- Preview -->
      <div class="bm-preview">
        <h3><i class="fas fa-chart-simple"></i> معاينة النتائج</h3>

        <div v-if="previewLoading" class="bm-preview-loading">
          <i class="fas fa-spinner fa-spin"></i>
          جاري الحساب...
        </div>

        <div v-else class="bm-preview-grid">
          <div class="bm-stat primary">
            <span class="bm-stat-label">ستُعالَج</span>
            <strong class="bm-stat-value">{{ preview.batches_will_process || 0 }}</strong>
            <small>دفعة</small>
          </div>
          <div class="bm-stat warning">
            <span class="bm-stat-label">ستُتجاوز</span>
            <strong class="bm-stat-value">{{ preview.batches_skipped || 0 }}</strong>
            <small>دفعة (مقفلة)</small>
          </div>
          <div class="bm-stat success">
            <span class="bm-stat-label">سيُحدَّث</span>
            <strong class="bm-stat-value">{{ preview.prices || 0 }}</strong>
            <small>سعر</small>
          </div>
          <div class="bm-stat muted">
            <span class="bm-stat-label">مقفلة</span>
            <strong class="bm-stat-value">{{ preview.locked || 0 }}</strong>
            <small>سعر</small>
          </div>
        </div>
      </div>

      <!-- Reason -->
      <div class="bm-section">
        <h3><i class="fas fa-edit"></i> سبب الإعادة <span class="required">إلزامي</span></h3>
        <textarea
          v-model="filters.reason"
          rows="2"
          placeholder="مثال: ارتفاع سعر الدولار في السوق، تغيير القاعدة العامة، تعديل هامش الربح..."></textarea>
      </div>

      <!-- Result -->
      <div v-if="applyStats" class="bm-result" :class="'result-' + (applyStats.failed > 0 ? 'warning' : 'success')">
        <i :class="applyStats.failed > 0 ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle'"></i>
        <div>
          <strong>تمت العملية</strong>
          <p>
            معالجة {{ applyStats.batches_processed }} دفعة،
            تجاوز {{ applyStats.batches_skipped || 0 }}،
            تحديث {{ applyStats.prices_updated }} سعر،
            تجاهل {{ applyStats.prices_skipped }} مقفل
            <span v-if="applyStats.failed > 0" class="failed">
              — فشل {{ applyStats.failed }}
            </span>
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="bm-actions">
        <button class="bm-cancel" @click="close" :disabled="applying">إلغاء</button>
        <button
          class="bm-apply"
          @click="apply"
          :disabled="!canApply || applying">
          <i :class="applying ? 'fas fa-spinner fa-spin' : 'fas fa-bolt'"></i>
          {{ applying ? 'جاري التنفيذ...' : 'إعادة الحساب الآن' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import axios from 'axios';
import { API_BASE } from '../../../src/js/config.js';

const props = defineProps({
  show: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'completed']);

/* ============================================================
   Presets
   ============================================================ */
const PRESETS = {
  quick:    { only_imported: false, only_with_stock: true,  skip_locked: true  },
  imported: { only_imported: true,  only_with_stock: true,  skip_locked: true  },
  full:     { only_imported: false, only_with_stock: false, skip_locked: true  },
};

const activePreset = ref('quick');

const filters = reactive({
  ...PRESETS.quick,
  reason: '',
});

const applyPreset = (name) => {
  activePreset.value = name;
  Object.assign(filters, PRESETS[name]);
};

// إذا عدّل المستخدم الفلاتر يدوياً → ألغِ الـ preset النشط
watch(
  () => [filters.only_imported, filters.only_with_stock, filters.skip_locked],
  () => {
    const current = {
      only_imported:   filters.only_imported,
      only_with_stock: filters.only_with_stock,
      skip_locked:     filters.skip_locked,
    };
    const match = Object.entries(PRESETS).find(
      ([, preset]) => JSON.stringify(preset) === JSON.stringify(current)
    );
    activePreset.value = match ? match[0] : null;
  },
  { deep: true }
);

/* ============================================================
   State
   ============================================================ */
const preview = ref({
  batches: 0,
  batches_skipped: 0,
  batches_will_process: 0,
  prices: 0,
  locked: 0,
});
const previewLoading = ref(false);
const applying = ref(false);
const applyStats = ref(null);

const canApply = computed(() => {
  return filters.reason.trim().length >= 3
      && !applying.value
      && (preview.value.prices > 0 || preview.value.batches_will_process > 0);
});

let previewTimer = null;

/* ============================================================
   Preview
   ============================================================ */
const fetchPreview = async () => {
  previewLoading.value = true;
  try {
    const res = await axios.post(
      `${API_BASE}/pricing/bulk-recalculate/preview`,
      {
        only_imported:   filters.only_imported,
        only_with_stock: filters.only_with_stock,
        skip_locked:     filters.skip_locked,
      }
    );
    preview.value = res.data.preview || preview.value;
  } catch (e) {
    console.error('Preview failed:', e);
  } finally {
    previewLoading.value = false;
  }
};

const debouncedPreview = () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(fetchPreview, 350);
};

watch(
  () => [filters.only_imported, filters.only_with_stock, filters.skip_locked],
  debouncedPreview
);

watch(() => props.show, (visible) => {
  if (visible) {
    applyStats.value = null;
    fetchPreview();
  }
});

/* ============================================================
   Apply
   ============================================================ */
const apply = async () => {
  if (!canApply.value) return;

  const skippedMsg = preview.value.batches_skipped > 0
    ? `\n${preview.value.batches_skipped} دفعة مقفلة ستُتجاوز.`
    : '';

  if (!confirm(
    `⚠️ تأكيد نهائي\n\n` +
    `ستُعالَج ${preview.value.batches_will_process} دفعة.\n` +
    `سيُحدَّث ${preview.value.prices} سعر.${skippedMsg}\n\n` +
    `السبب: ${filters.reason}\n\n` +
    `هل أنت متأكد؟`
  )) return;

  applying.value = true;
  applyStats.value = null;

  try {
    const res = await axios.post(
      `${API_BASE}/pricing/bulk-recalculate/apply`,
      {
        only_imported:   filters.only_imported,
        only_with_stock: filters.only_with_stock,
        skip_locked:     filters.skip_locked,
        reason:          filters.reason.trim(),
      }
    );

    applyStats.value = res.data.stats;
    emit('completed', res.data.stats);

    await fetchPreview();
  } catch (e) {
    console.error('Apply failed:', e);
    alert(e.response?.data?.message || 'تعذر تنفيذ العملية');
  } finally {
    applying.value = false;
  }
};

const close = () => {
  if (applying.value) return;
  emit('close');
};

onMounted(() => { if (props.show) fetchPreview(); });
</script>

<style scoped>
.bulk-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(11, 26, 46, 0.7);
  backdrop-filter: blur(6px);
  z-index: 10000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: bulkFadeIn 0.2s;
}
@keyframes bulkFadeIn { from { opacity: 0; } to { opacity: 1; } }

.bulk-modal {
  background: #fff;
  width: 100%; max-width: 640px; max-height: 92vh;
  overflow-y: auto; border-radius: 22px; padding: 28px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  animation: bulkSlideUp 0.3s ease;
}
@keyframes bulkSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* Header */
.bm-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.bm-icon {
  width: 52px; height: 52px; border-radius: 14px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.bm-header-text { flex: 1; }
.bm-header-text h2 { font-size: 20px; font-weight: 800; color: #1e293b; margin: 0; }
.bm-header-text p { font-size: 13px; color: #64748b; margin: 3px 0 0; }
.bm-close {
  width: 38px; height: 38px; border-radius: 50%;
  border: none; background: #f1f5f9; color: #64748b;
  cursor: pointer; transition: 0.2s; flex-shrink: 0;
}
.bm-close:hover { background: #e2e8f0; transform: rotate(90deg); }

/* Notice */
.bm-notice {
  display: flex; gap: 10px; padding: 12px 16px;
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 12px; margin-bottom: 20px;
  color: #1e40af; font-size: 12.5px;
}
.bm-notice i { flex-shrink: 0; margin-top: 2px; }
.bm-notice p { margin: 0; line-height: 1.5; }

/* Sections */
.bm-section { margin-bottom: 20px; }
.bm-section h3 {
  font-size: 13.5px; font-weight: 800; color: #1e293b;
  margin: 0 0 12px; display: flex; align-items: center; gap: 8px;
}
.bm-section h3 i { color: #3b82f6; }
.required {
  background: #fee2e2; color: #991b1b;
  padding: 1px 8px; border-radius: 8px;
  font-size: 10.5px; font-weight: 700;
}

/* Presets */
.bm-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.bm-preset {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 12px;
  border: 2px solid #e2e8f0; background: #fff;
  border-radius: 12px; cursor: pointer;
  font-family: inherit; text-align: right;
  transition: 0.2s;
}
.bm-preset:hover { border-color: #93c5fd; background: #f0f9ff; }
.bm-preset.active {
  border-color: #3b82f6; background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.bm-preset i {
  font-size: 18px; color: #64748b;
  width: 24px; text-align: center; flex-shrink: 0;
}
.bm-preset.active i { color: #1d4ed8; }
.bm-preset > div { flex: 1; min-width: 0; }
.bm-preset strong { display: block; font-size: 12.5px; color: #1e293b; font-weight: 800; }
.bm-preset small { display: block; font-size: 10.5px; color: #94a3b8; margin-top: 2px; }
.bm-preset.active strong { color: #1d4ed8; }

/* Checkboxes */
.bm-check {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 10px;
  cursor: pointer; transition: 0.15s;
  border: 1px solid transparent;
}
.bm-check:hover { background: #f8fafc; border-color: #e2e8f0; }
.bm-check input[type="checkbox"] {
  width: 20px; height: 20px;
  accent-color: #3b82f6; cursor: pointer; flex-shrink: 0;
}
.bm-check span { display: block; font-weight: 700; color: #1e293b; font-size: 13.5px; }
.bm-check small { display: block; color: #94a3b8; font-size: 11.5px; margin-top: 2px; }

/* Preview */
.bm-preview {
  padding: 16px; background: #f8fafc;
  border: 1px solid #e2e8f0; border-radius: 14px;
  margin-bottom: 20px;
}
.bm-preview h3 {
  font-size: 13.5px; font-weight: 800; color: #1e293b;
  margin: 0 0 14px; display: flex; align-items: center; gap: 8px;
}
.bm-preview h3 i { color: #3b82f6; }

.bm-preview-loading {
  text-align: center; color: #94a3b8;
  padding: 20px; font-size: 13px;
}
.bm-preview-loading i { margin-left: 6px; }

.bm-preview-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.bm-stat {
  text-align: center; padding: 14px 6px;
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.bm-stat.primary { border-color: #93c5fd; background: #eff6ff; }
.bm-stat.warning { border-color: #fcd34d; background: #fffbeb; }
.bm-stat.success { border-color: #86efac; background: #ecfdf5; }
.bm-stat.muted   { border-color: #e2e8f0; background: #f8fafc; }

.bm-stat-label {
  display: block; font-size: 10.5px;
  color: #64748b; font-weight: 600; margin-bottom: 6px;
}
.bm-stat-value {
  display: block; font-size: 20px;
  font-weight: 900; color: #1e293b;
}
.bm-stat small {
  display: block; font-size: 10px;
  color: #94a3b8; margin-top: 2px;
}
.bm-stat.primary .bm-stat-value { color: #1d4ed8; }
.bm-stat.warning .bm-stat-value { color: #d97706; }
.bm-stat.success .bm-stat-value { color: #059669; }
.bm-stat.muted   .bm-stat-value { color: #64748b; }

/* Textarea */
.bm-section textarea {
  width: 100%; padding: 12px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 12px;
  font-family: inherit; font-size: 13.5px;
  resize: vertical; transition: 0.15s;
}
.bm-section textarea:focus {
  outline: none; border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Result */
.bm-result {
  display: flex; gap: 12px;
  padding: 14px 16px; border-radius: 12px;
  margin-bottom: 16px; font-size: 13px;
}
.bm-result.result-success {
  background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
}
.bm-result.result-warning {
  background: #fffbeb; border: 1px solid #fcd34d; color: #92400e;
}
.bm-result i { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
.bm-result strong { font-size: 14px; display: block; margin-bottom: 3px; }
.bm-result p { margin: 0; line-height: 1.5; }
.bm-result .failed { color: #dc2626; font-weight: 700; }

/* Actions */
.bm-actions {
  display: flex; gap: 10px;
  margin-top: 20px; padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}
.bm-cancel, .bm-apply {
  padding: 12px 24px; border-radius: 12px;
  border: none; font-family: inherit;
  font-weight: 700; font-size: 14px;
  cursor: pointer; transition: 0.2s;
  display: inline-flex; align-items: center; gap: 8px;
}
.bm-cancel { background: #f1f5f9; color: #475569; }
.bm-cancel:hover:not(:disabled) { background: #e2e8f0; }
.bm-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.bm-apply {
  flex: 1;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  color: #fff; justify-content: center;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}
.bm-apply:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(59, 130, 246, 0.4);
}
.bm-apply:disabled {
  opacity: 0.5; cursor: not-allowed; transform: none;
}

@media (max-width: 640px) {
  .bulk-modal { padding: 20px; border-radius: 16px; }
  .bm-presets { grid-template-columns: 1fr; }
  .bm-preview-grid { grid-template-columns: 1fr 1fr; }
}
</style>