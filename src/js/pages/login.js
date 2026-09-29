import '@fortawesome/fontawesome-free/css/all.min.css';
import '../../css/app.css';

import {
    createApp,
    ref,
    onMounted,
    onUnmounted
} from 'vue';

import axios from 'axios';

import { API_BASE } from '../config.js';

import '../pwa.js';

// ✅ المصدر 1: localStorage (auth.js)
import {
    cacheUser as cacheUserAuth,
    getCachedUser as getCachedUserAuth,
} from '../auth.js';

// ✅ المصدر 2: IndexedDB (offline-db.js)
import {
    cacheUser as cacheUserIDB,
    getCachedUser as getCachedUserIDB,
} from '../offline-db.js';


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/
const EULA_VERSION = '1.0.0';
const EULA_KEY = 'miraclepos_eula_acceptance';


/*
|--------------------------------------------------------------------------
| Helper: حفظ المستخدم في كلا المصدرين
|--------------------------------------------------------------------------
*/
async function cacheUserEverywhere(user) {
    if (!user) return false;

    let ok1 = false, ok2 = false;

    try {
        await cacheUserAuth(user);
        ok1 = true;
    } catch (e) {
        console.warn('❌ cacheUserAuth failed:', e);
    }

    try {
        await cacheUserIDB(user);
        ok2 = true;
    } catch (e) {
        console.warn('❌ cacheUserIDB failed:', e);
    }

    console.log('💾 cacheUserEverywhere:', { localStorage: ok1, indexedDB: ok2 });
    return ok1 && ok2;
}

/*
|--------------------------------------------------------------------------
| Helper: قراءة المستخدم من أي مصدر متاح
|--------------------------------------------------------------------------
*/
async function readCachedUser() {
    try {
        const u = await getCachedUserAuth();
        if (u?.id) return u;
    } catch (e) {}

    try {
        const u = await getCachedUserIDB();
        if (u?.id) return u;
    } catch (e) {}

    return null;
}


/*
|--------------------------------------------------------------------------
| Helper: هل يحتاج المستخدم لرؤية EULA؟
|--------------------------------------------------------------------------
| نرجع true في الحالات التالية:
|   - لم يوافق أبداً
|   - وافق على إصدار قديم
|   - وافق بدون تفعيل "لا تعرض مجدداً"
|--------------------------------------------------------------------------
*/
function needsEulaAcceptance() {
    try {
        const raw = localStorage.getItem(EULA_KEY);
        if (!raw) return true;

        const acceptance = JSON.parse(raw);
        if (!acceptance?.accepted) return true;
        if (acceptance.version !== EULA_VERSION) return true;
        if (acceptance.dont_show_again !== true) return true;

        return false;
    } catch (e) {
        console.warn('Failed to read EULA acceptance:', e);
        return true;
    }
}


/*
|--------------------------------------------------------------------------
| Helper: المسار حسب الدور
|--------------------------------------------------------------------------
*/
function destinationFor(role) {
    if (role === 'admin') return 'admin.html';
    if (role === 'cashier') return 'shift.html';
    return 'login.html';
}


/*
|--------------------------------------------------------------------------
| Password Hash
|--------------------------------------------------------------------------
*/
async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}


/*
|--------------------------------------------------------------------------
| Login Page
|--------------------------------------------------------------------------
*/
createApp({

    template: `

        <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">

            <div class="w-full max-w-md">

                <div class="bg-white rounded-2xl shadow-xl p-8">

                    <!-- Header -->

                    <div class="text-center mb-8">

                        <div class="text-5xl mb-3">
                            💊
                        </div>

                        <h1 class="text-2xl font-bold text-emerald-800">
                            MiraclePOS
                        </h1>

                        <p class="text-sm text-slate-500 mt-1">
                            نظام إدارة الصيدليات
                        </p>

                    </div>


                    <!-- Offline Notice -->

                    <div
                        v-if="showOfflineOverlay"
                        class="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6"
                    >

                        <div class="text-center max-w-md">

                            <div class="text-7xl mb-6">
                                📡
                            </div>

                            <h2 class="text-2xl font-bold text-red-600 mb-4">
                                لا يوجد اتصال بالإنترنت
                            </h2>

                            <p class="text-slate-600 mb-8">
                                يجب تسجيل الدخول مرة واحدة بالإنترنت
                                قبل استخدام النظام دون اتصال.
                            </p>

                            <button
                                type="button"
                                @click="updateConnectionState"
                                class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition"
                            >
                                إعادة المحاولة
                            </button>

                        </div>

                    </div>


                    <!-- Login -->

                    <div v-if="!showReset">

                        <h2 class="text-2xl font-bold text-emerald-800 mb-6 text-center">
                            تسجيل الدخول
                        </h2>

                        <form @submit.prevent="login" class="space-y-4">

                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">
                                    البريد الإلكتروني
                                </label>

                                <input
                                    v-model.trim="form.email"
                                    type="email"
                                    autocomplete="username"
                                    placeholder="البريد الإلكتروني"
                                    required
                                    class="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                            </div>


                            <div>
                                <label class="block text-sm font-semibold text-slate-700 mb-2">
                                    كلمة المرور
                                </label>

                                <input
                                    v-model="form.password"
                                    type="password"
                                    autocomplete="current-password"
                                    placeholder="كلمة المرور"
                                    required
                                    class="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                            </div>


                            <button
                                type="submit"
                                :disabled="loading"
                                class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-3 rounded-lg font-bold transition"
                            >
                                {{ loading ? 'جاري الدخول...' : 'دخول' }}
                            </button>

                        </form>


                        <button
                            type="button"
                            @click="showReset = true"
                            class="mt-4 w-full text-sm text-slate-500 hover:text-emerald-600"
                        >
                            نسيت كلمة المرور؟
                        </button>

                    </div>


                    <!-- Password Reset -->

                    <div v-else>

                        <h2 class="text-xl font-bold text-emerald-800 mb-4">
                            استعادة كلمة المرور
                        </h2>

                        <p class="text-sm text-gray-600 mb-4">
                            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين.
                        </p>


                        <input
                            v-model.trim="resetEmail"
                            type="email"
                            autocomplete="email"
                            placeholder="البريد الإلكتروني"
                            class="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >


                        <button
                            type="button"
                            @click="sendResetLink"
                            :disabled="loading"
                            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg font-bold"
                        >
                            {{ loading ? 'جاري الإرسال...' : 'إرسال الرابط' }}
                        </button>


                        <button
                            type="button"
                            @click="showReset = false"
                            class="mt-4 w-full text-gray-500 text-sm"
                        >
                            عودة لتسجيل الدخول
                        </button>

                    </div>

                </div>

            </div>

        </div>

    `,


    setup() {

        const form = ref({ email: '', password: '' });
        const loading = ref(false);
        const showReset = ref(false);
        const resetEmail = ref('');
        const showOfflineOverlay = ref(false);


        /*
        |--------------------------------------------------------------------------
        | Connection State
        |--------------------------------------------------------------------------
        */

        const updateConnectionState = async () => {
            const cachedUser = await readCachedUser();

            showOfflineOverlay.value =
                !navigator.onLine && !cachedUser;
        };


        /*
        |--------------------------------------------------------------------------
        | Login
        |--------------------------------------------------------------------------
        */

        const login = async () => {

            if (!form.value.email || !form.value.password) {
                alert('أدخل البريد الإلكتروني وكلمة المرور');
                return;
            }

            loading.value = true;

            try {

                /*
                |--------------------------------------------------------------------------
                | Offline Login
                |--------------------------------------------------------------------------
                */

                if (!navigator.onLine) {

                    const cachedUser = await readCachedUser();

                    if (!cachedUser) {
                        throw new Error('يجب تسجيل الدخول مرة واحدة بالإنترنت أولاً');
                    }

                    const cachedEmail = String(cachedUser.email || '').trim().toLowerCase();
                    const enteredEmail = String(form.value.email || '').trim().toLowerCase();

                    if (!cachedEmail || cachedEmail !== enteredEmail) {
                        throw new Error('هذا الحساب غير محفوظ على الجهاز');
                    }

                    const enteredPasswordHash = await hashPassword(form.value.password);
                    const cachedPasswordHash = String(cachedUser.offline_password_hash || '');

                    if (!cachedPasswordHash) {
                        throw new Error('بيانات الدخول المحلية غير مكتملة. يجب تسجيل الدخول بالإنترنت مرة واحدة لتحديث بيانات الحساب.');
                    }

                    if (enteredPasswordHash !== cachedPasswordHash) {
                        throw new Error('كلمة المرور غير صحيحة');
                    }

                    localStorage.setItem('user', JSON.stringify(cachedUser));
                    localStorage.setItem('offline_mode', 'true');

                    // ✅ فحص EULA (نفس المنطق للأونلاين والأوفلاين)
                    if (needsEulaAcceptance()) {
                        const destination = destinationFor(cachedUser.role);
                        window.location.href = `legal/eula.html?redirect=${encodeURIComponent(destination)}`;
                        return;
                    }

                    // ✅ التوجيه للوجهة
                    window.location.href = destinationFor(cachedUser.role);

                    return;
                }


                /*
                |--------------------------------------------------------------------------
                | Online Login
                |--------------------------------------------------------------------------
                */

                const response = await axios.post(
                    `${API_BASE}/login`,
                    {
                        email: form.value.email,
                        password: form.value.password
                    }
                );


                if (!response.data || !response.data.user || !response.data.token) {
                    throw new Error('استجابة تسجيل الدخول من الخادم غير مكتملة');
                }


                const passwordHash = await hashPassword(form.value.password);


                const cachedUser = {
                    ...response.data.user,
                    offline_password_hash: passwordHash,
                    cached_at: new Date().toISOString()
                };


                /*
                |--------------------------------------------------------------------------
                | ✅ الحفظ في كلا المصدرين
                |--------------------------------------------------------------------------
                */

                await cacheUserEverywhere(cachedUser);


                /*
                |--------------------------------------------------------------------------
                | Token + User in localStorage
                |--------------------------------------------------------------------------
                */

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(cachedUser));

                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

                localStorage.removeItem('offline_mode');


                /*
                |--------------------------------------------------------------------------
                | ✅ فحص EULA قبل التوجيه
                |--------------------------------------------------------------------------
                */

                const destination = destinationFor(cachedUser.role);

                if (needsEulaAcceptance()) {
                    window.location.href = `legal/eula.html?redirect=${encodeURIComponent(destination)}`;
                    return;
                }

                // ✅ التوجيه للوجهة حسب الدور
                window.location.href = destination;

            }

            catch (error) {

                console.error('Login Error:', error);

                alert(
                    error?.response?.data?.message
                    || error?.message
                    || 'خطأ في بيانات الدخول'
                );

            }

            finally {
                loading.value = false;
            }

        };


        /*
        |--------------------------------------------------------------------------
        | Password Reset
        |--------------------------------------------------------------------------
        */

        const sendResetLink = async () => {

            if (!resetEmail.value) {
                alert('أدخل البريد الإلكتروني');
                return;
            }

            loading.value = true;

            try {

                await axios.post(
                    `${API_BASE}/forgot-password`,
                    { email: resetEmail.value }
                );

                alert('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');

                showReset.value = false;

            }

            catch (error) {

                console.error('Password reset error:', error);

                alert(
                    error?.response?.data?.message
                    || 'تعذر إرسال الرابط، تأكد من البريد الإلكتروني'
                );

            }

            finally {
                loading.value = false;
            }

        };


        /*
        |--------------------------------------------------------------------------
        | Lifecycle
        |--------------------------------------------------------------------------
        */

        onMounted(async () => {

            await updateConnectionState();

            window.addEventListener('online', updateConnectionState);
            window.addEventListener('offline', updateConnectionState);

        });


        onUnmounted(() => {

            window.removeEventListener('online', updateConnectionState);
            window.removeEventListener('offline', updateConnectionState);

        });


        return {
            form,
            loading,
            showReset,
            resetEmail,
            showOfflineOverlay,
            login,
            sendResetLink,
            updateConnectionState
        };

    }

}).mount('#app');
