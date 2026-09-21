<!-- src/js/pages/admin.vue -->
<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Offline Overlay -->
    <div
      v-if="showOfflineOverlay"
      class="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="bg-white rounded-2xl shadow-2xl p-10 max-w-lg text-center">
        <div class="mb-6">
          <i class="fas fa-wifi text-red-600 text-7xl"></i>
        </div>
        <h1 class="text-3xl font-bold text-red-600 mb-4">لا يوجد اتصال بالإنترنت</h1>
        <p class="text-slate-600 text-lg mb-6">
          تعذر الاتصال بالشبكة. يرجى التحقق من الاتصال ثم إعادة المحاولة.
        </p>
        <div class="inline-flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-lg">
          <span class="animate-pulse">●</span>
          انتظار عودة الاتصال...
        </div>
      </div>
    </div>

    <!-- ===== القائمة الجانبية ===== -->
    <aside class="sidebar w-72 text-slate-300 flex flex-col shrink-0 select-none h-screen">
      <!-- الشعار -->
      <div class="logo px-5 py-6 flex items-center gap-3 border-b border-slate-800/60">
        <!-- الشعار (صورة أو أيقونة احتياطية) -->
        <div class="shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden">
          <img
            v-if="pharmacyLogo && !logoFailed"
            :src="pharmacyLogo"
            @error="logoFailed = true"
            alt="شعار الصيدلية"
            class="w-full h-full object-contain"
          />
          <i v-else class="fas fa-heartbeat text-emerald-400 text-2xl"></i>
        </div>

        <!-- الاسم والعنوان -->
        <div class="flex-1 min-w-0">
          <h1 class="text-white text-lg font-extrabold tracking-wide truncate leading-tight">
            {{ pharmacyName || 'صيدليتي' }}
          </h1>
          <p
            v-if="pharmacyAddress"
            class="text-[11px] text-slate-400 truncate mt-1 flex items-center gap-1"
            :title="pharmacyAddress">
            <i class="fas fa-map-marker-alt text-[9px] text-emerald-400/70"></i>
            {{ pharmacyAddress }}
          </p>
          <p
            v-else
            class="text-[11px] text-slate-500 truncate mt-1">
            نظام إدارة الصيدلية
          </p>
        </div>
      </div>
      <!-- القائمة -->
      <ul class="flex-1 px-4 py-6 space-y-1 overflow-y-auto" style="direction: rtl; overflow-y: auto;">
        <!-- قسم: الرئيسية -->
        <!-- <li class="pt-4 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          الرئيسية
        </li> -->
        <li
          v-for="tab in mainTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <!-- قسم: إدارة المخزون -->
        <!-- <li class="pt-6 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          إدارة المخزون
        </li> -->
        <li
          v-for="tab in inventoryTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <!-- قسم: المالية -->
        <!-- <li class="pt-6 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          المالية
        </li> -->
        <li
          v-for="tab in financeTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <!-- قسم: الإدارة العامة -->
        <!-- <li class="pt-6 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          الإدارة العامة
        </li> -->
        <li
          v-for="tab in generalTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
        >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>

        <!-- قسم: التحليلات والدعم -->
        <!-- <li class="pt-6 pb-2 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          التحليلات والدعم
        </li> -->
        <li
          v-for="tab in supportTabs"
          :key="tab.id"
          @click="navigate(tab)"
          :class="['flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium cursor-pointer',
            activeTab === tab.id ? 'active' : '']"
          >
          <i :class="[tab.icon, 'w-5 text-center']"></i>
          <span>{{ tab.name }}</span>
        </li>
        
        
      </ul>

      <!-- تسجيل الخروج -->
      <div class="logout px-6 py-4 flex items-center gap-3 cursor-pointer" @click="logout">
        <i class="fas fa-sign-out-alt w-5 text-center"></i>
        <span>تسجيل الخروج</span>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50">
      <div class="p-4 flex-1">
        <div class="bg-transparent p-0 min-h-[500px]">
          <keep-alive>
            <component :is="currentComponent" :key="activeTab"></component>
          </keep-alive>
        </div>
      </div>

      <!-- زر الجولة العائم (Floating Action Button) -->
      <div class="tour-floating-btn fixed bottom-8 left-8 z-50">
        <button
          @click="startAdminTour"
          class="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-14 h-14 shadow-xl shadow-blue-600/30 transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center justify-center border-2 border-white/20"
          title="جولة إرشادية"
        >
          <i class="fas fa-compass text-2xl"></i>
        </button>
        <span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">جديد</span>
      </div>
    </main>

    <!-- Global Loader -->
    <div
      v-if="globalLoading"
      class="fixed inset-0 z-[9999] bg-white/70 flex items-center justify-center backdrop-blur-sm"
    >
      <div class="flex flex-col items-center">
        <i class="fas fa-spinner fa-spin text-5xl text-sky-600"></i>
        <p class="mt-4 font-bold text-slate-700">جاري المعالجة...</p>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div v-if="toast.show" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300"
    :class="{
      'bg-emerald-50 border border-emerald-200 text-emerald-800': toast.type === 'success',
      'bg-red-50 border border-red-200 text-red-800': toast.type === 'error',
      'bg-amber-50 border border-amber-200 text-amber-800': toast.type === 'warning',
      'bg-blue-50 border border-blue-200 text-blue-800': toast.type === 'info'
    }">
    <div class="flex items-center gap-3">
      <i :class="{
        'fas fa-check-circle text-emerald-500': toast.type === 'success',
        'fas fa-exclamation-circle text-red-500': toast.type === 'error',
        'fas fa-exclamation-triangle text-amber-500': toast.type === 'warning',
        'fas fa-info-circle text-blue-500': toast.type === 'info'
      }"></i>
      <span class="font-medium">{{ toast.message }}</span>
      <button @click="toast.show = false" class="mr-4 text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed,watch, onMounted, onUnmounted } from 'vue';
import pinia from '../stores/index.js';
import axios from 'axios';
import { API_BASE } from '../config.js';
import { clearCachedUser, getCachedUser } from '../auth.js';
import '../pwa.js';

// استيراد المكونات
import Overview from '../../../modules/overview/overview.vue';
import Branches from '../../../modules/branches/branches.vue';
import Categories from '../../../modules/categories/categories.vue';
import Medicine from '../../../modules/medicines/catalog.vue';
import Purchases from '../../../modules/medicines/purchase.vue';
import Suppliers from '../../../modules/suppliers/suppliers.vue';
import Users from '../../../modules/users/users.vue';
import Shifts from '../../../modules/shifts/shifts.vue';
import Debts from '../../../modules/debts/debts.vue';
import Expenses from '../../../modules/expenses/expenses.vue';
import Salaries from '../../../modules/salaries/salaries.vue';
import Pricing from '../../../modules/pricing-engine/pricing.vue';
import Analytics from '../../../modules/analytics/analytics.vue';
import Inventory from '../../../modules/inventory/inventory.vue';
import About from '../../../modules/about/about.vue';
import UserGuide from '../../../modules/about/UserGuide.vue';
import TourManager from '../services/tourManager.js';
import { getPharmacyInfo, savePharmacyInfo } from '../utils/thermalPrinter.js';
import PrintSettings from '../../../modules/settings/PrintSettings.vue';
import BackupSettings from '../../../modules/settings/BackupSettings.vue';
import Settings from '../../../modules/settings/Settings.vue';
import AuditLog from '../../../modules/audit/AuditLog.vue';
import FinancialReports from '../../../modules/reports/FinancialReports.vue';
import {
  settings as pharmacySettings,
  loadSettings,
  refreshSettings,
  pharmacyName,
  pharmacyLogo,
  pharmacyAddress,
} from '../settings.js';
// أمثلة
const info = getPharmacyInfo();
console.log(info); // { name, phone, address, taxNumber }

savePharmacyInfo({
  name: 'صيدلية التلال',
  phone: '0912345678',
  address: 'الخرطوم - التلال',
  taxNumber: '123456789',
});
const logoFailed = ref(false);

// إذا تغيّر رابط الشعار لاحقاً، أعد تعيين الفلاغ
watch(pharmacyLogo, () => { logoFailed.value = false; });
// ===== State =====
const activeTab = ref('overview');
const globalLoading = ref(false);
const adminUser = ref(null);
const showOfflineOverlay = ref(!navigator.onLine);


// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' });

const handleToast = (event) => {
  const { message, type } = event.detail;
  toast.message = message;
  toast.type = type || 'success';
  toast.show = true;
  setTimeout(() => { toast.show = false; }, 4000);
};
// ===== 2. الآن نمرر دالة تبديل التبويب إلى TourManager =====
TourManager.setTabSwitcher((tabId) => {
  activeTab.value = tabId;
});

const startAdminTour = () => {
  let tourName = '';
  switch (activeTab.value) {
    case 'overview': tourName = 'main'; break;
    case 'medicine': tourName = 'medicine'; break;
    case 'purchases': tourName = 'purchases'; break;
    case 'stocktaking': tourName = 'inventory'; break;
    case 'analytics': tourName = 'analytics'; break;
    case 'branches': tourName = 'branches'; break;
    case 'categories': tourName = 'categories'; break;
    case 'debts': tourName = 'debts'; break;
    case 'expenses': tourName = 'expenses'; break;
    case 'salaries': tourName = 'salaries'; break;
    case 'shifts': tourName = 'shifts'; break;
    case 'suppliers': tourName = 'suppliers'; break;
    case 'users': tourName = 'users'; break;
    case 'pricing': tourName = 'pricing'; break;
    default: tourName = 'main';
  }
  TourManager.startTourByName(tourName);
};

// ===== 4. تشغيل الجولة الرئيسية تلقائياً (اختياري) =====
// يمكنك استدعاؤها بعد تحميل الصفحة لأول مرة
// على سبيل المثال في onMounted:
// onMounted(() => {
//   // نبدأ الجولة الرئيسية إذا لم يشاهدها المستخدم من قبل
//   const mainSteps = TourManager.createMainTour();
//   TourManager.startTour('main', mainSteps);
// });


// ===== بدء جولة الصفحة الحالية =====
const startPageTour = () => {
  let steps = [];
  let tourName = '';

  switch (activeTab.value) {
    case 'medicine':
      steps = TourManager.createMedicineTour();
      tourName = 'medicine';
      break;
    case 'purchases':
      steps = TourManager.createPurchaseTour();
      tourName = 'purchases';
      break;
    case 'stocktaking':
      steps = TourManager.createInventoryTour();
      tourName = 'inventory';
      break;
    // ... باقي الصفحات
    default:
      startMainTour();
      return;
  }

  TourManager.startTour(tourName, steps);
};

// ===== عند تغيير التبويب =====
watch(activeTab, (newTab) => {
  // يمكن تشغيل الجولة التفصيلية تلقائياً عند أول دخول للصفحة
  // أو تركها للمستخدم بالضغط على الزر
});

// ===== إعدادات Axios =====
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// ===== Global Loading Interceptors =====
const globalLoadingEvent = 'miraclepos:global-loading';
let activeRequests = 0;

axios.interceptors.request.use(
  (config) => {
    activeRequests++;
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return config;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    window.dispatchEvent(new CustomEvent(globalLoadingEvent, { detail: { loading: activeRequests > 0 } }));
    return Promise.reject(error);
  }
);


// ===== Tabs مقسمة حسب الفئات =====
const mainTabs = [
  { id: 'overview', name: 'الرئيسية', icon: 'fas fa-th-large' }
];

const inventoryTabs = [
  { id: 'medicine', name: 'إدارة الأدوية', icon: 'fas fa-pills' },
  { id: 'purchases', name: 'المشتريات', icon: 'fas fa-shopping-cart' },
  { id: 'stocktaking', name: 'الجرد', icon: 'fas fa-clipboard-list' }
];

const financeTabs = [
  { id: 'shifts', name: 'الورديات', icon: 'fas fa-user-clock' },
  { id: 'debts', name: 'الديون', icon: 'fas fa-file-invoice-dollar' },
  { id: 'expenses', name: 'المصروفات', icon: 'fas fa-wallet' },
  { id: 'salaries', name: 'الرواتب', icon: 'fas fa-hand-holding-usd' },
  { id: 'pricing', name: 'محرك الأسعار', icon: 'fas fa-dollar-sign' },
  { id: 'financial_reports', name: 'التقارير المالية', icon: 'fas fa-chart-line' },
];

const generalTabs = [
  { id: 'branches', name: 'الفروع', icon: 'fas fa-code-branch' },
  { id: 'categories', name: 'التصنيفات', icon: 'fas fa-tags' },
  { id: 'suppliers', name: 'الموردين', icon: 'fas fa-truck' },
  { id: 'users', name: 'المستخدمين', icon: 'fas fa-users' },

];

const supportTabs = [
  { id: 'analytics', name: 'التحليلات', icon: 'fas fa-chart-bar' },
  { id: 'audit_log', name: 'سجل التدقيق', icon: 'fas fa-clipboard-list' },
  { id: 'backup_settings',name: 'النسخ الاحتياطي',  icon: 'fas fa-database' },  // ✅ جديد
  { id: 'settings',  name: 'الإعدادات',     icon: 'fas fa-cog' },
  { id: 'guide', name: 'دليل الاستخدام', icon: 'fas fa-book' },
  
  { id: 'about', name: 'حول النظام', icon: 'fas fa-info-circle' }
];

// دمج جميع التبويبات (للاستخدام في الملاحة والقائمة الجانبية)
const tabs = [
  ...mainTabs,
  ...inventoryTabs,
  ...financeTabs,
  ...generalTabs,
  ...supportTabs
];

// ===== Navigation =====
const navigate = (tab) => {
  activeTab.value = tab.id;
};

// ===== Current Component =====
const currentComponent = computed(() => {
  const map = {
    overview: Overview,
    branches: Branches,
    categories: Categories,
    purchases: Purchases,
    about: About,
    suppliers: Suppliers,
    medicine: Medicine,
    users: Users,
    shifts: Shifts,
    debts: Debts,
    pricing: Pricing,
    analytics: Analytics,
    stocktaking: Inventory,
    expenses: Expenses,
    salaries: Salaries,
    guide: UserGuide,
    backup_settings: BackupSettings,   // ✅ جديد
    settings: Settings,   // ✅ جديد
    financial_reports: FinancialReports,
    audit_log: AuditLog,
  };
  return map[activeTab.value] || Overview;
});

// ===== Authentication =====
const checkAuth = async () => {
  try {
    const response = await axios.get(`${API_BASE}/current-user`);
    if (response.data.role !== 'admin') {
      window.location.href = 'pos.html';
      return;
    }
    adminUser.value = response.data;
  } catch (error) {
    console.error('Authentication failed:', error);
    const cachedUser = await getCachedUser();
    if (!navigator.onLine && cachedUser && cachedUser.role === 'admin') {
      adminUser.value = cachedUser;
      return;
    }
    clearCachedUser();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
};

const initApp = async () => {
  if (!adminUser.value) {
    try {
      const userRes = await axios.get(`${API_BASE}/current-user`);
      adminUser.value = userRes.data;
    } catch (error) {
      console.error('Could not load admin user:', error);
    }
  }
};

// ===== Logout =====
const logout = () => {
  clearCachedUser();
  localStorage.removeItem('token');
  localStorage.removeItem('offline_mode');
  delete axios.defaults.headers.common['Authorization'];
  window.location.href = 'login.html';
};

// ===== Connection Status =====
const updateConnectionStatus = () => {
  showOfflineOverlay.value = !navigator.onLine;
};

const updateGlobalLoading = (event) => {
  globalLoading.value = !!event.detail?.loading;
};

// ===== Lifecycle =====
onMounted(async () => {
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
  window.addEventListener(globalLoadingEvent, updateGlobalLoading);
  window.addEventListener('miraclepos:toast', handleToast);
  window.addEventListener('miraclepos:navigate', (event) => {
    const { tab, result } = event.detail;
    if (tab) {
      activeTab.value = tab;
      // تخزين النتيجة في متغير عمومي ليتمكن التبويب المستهدف من قراءتها
      window.selectedSearchResult = result;
    }
  });
  // ✅ حمّل إعدادات الصيدلية أولاً (للعرض الفوري)
  await loadSettings();
  updateConnectionStatus();
  await checkAuth();
  await initApp();
});

onUnmounted(() => {
  window.removeEventListener('online', updateConnectionStatus);
  window.removeEventListener('offline', updateConnectionStatus);
  window.removeEventListener(globalLoadingEvent, updateGlobalLoading);
  window.removeEventListener('miraclepos:toast', handleToast);
});
</script>

<style scoped>
/* يمكنك إضافة أي أنماط خاصة بهذا المكون، لكن معظم الأنماط ستأتي من ملف app.css العام */
</style>