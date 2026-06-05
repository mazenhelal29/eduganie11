# 📡 Data Persistence & Sync System

هذا دليل شامل لنظام التخزين الدائم والمزامنة الجديد في Edugenie.

## المشكلة التي تم حلها

```
❌ المشكلة القديمة:
- البيانات تُحفظ في cache مؤقت فقط
- عند تسجيل الخروج → فقد البيانات
- عند فتح من جهاز آخر → فقد البيانات
- بدون معالجة أخطاء في التزامن
- بدون نظام إعادة محاولة

✅ الحل الجديد:
- تخزين دائم مع checksum للتحقق
- مزامنة آلية مع Supabase
- نظام queue مع retry logic
- معالجة أخطاء وحالات التعطل
- دعم offline mode
- تتبع حالة التزامن
```

---

## المكونات الرئيسية

### 1. **PersistentStore** (`lib/storage/persistent-store.ts`)

نظام تخزين قوي مع:
- ✅ Versioning (للتوافق مع نسخ التطبيق المختلفة)
- ✅ Checksum (للكشف عن تلف البيانات)
- ✅ Quota Management (عند امتلاء التخزين)
- ✅ Fallback (بيانات افتراضية عند الفشل)

**الاستخدام:**
```typescript
// الحفظ
PersistentStore.save("center-info", {
  name: "Education Center",
  students: 100,
});

// التحميل
const data = PersistentStore.load("center-info");

// الحذف
PersistentStore.remove("center-info");

// إحصائيات
const usage = PersistentStore.getUsage();
// { used: 2500000, available: 5242880, percentage: 47.6 }
```

### 2. **SyncQueue** (`lib/storage/sync-queue.ts`)

نظام queue يتتبع العمليات المعلقة:
- ✅ تخزين العمليات الفاشلة
- ✅ Retry مع exponential backoff
- ✅ التمييز بين pending و failed
- ✅ إحصائيات مفصلة

**الاستخدام:**
```typescript
// إضافة عملية للـ queue
const id = SyncQueue.add("student", "create", {
  name: "New Student",
  email: "student@example.com",
});

// الحصول على الإحصائيات
const stats = SyncQueue.getStats();
// { total: 5, pending: 2, failed: 3, isProcessing: false }

// الحصول على العمليات القابلة للإعادة
const retryable = SyncQueue.getRetryable();

// حذف عملية بعد نجاح
SyncQueue.remove(id);
```

### 3. **useSyncedData Hook** (`hooks/useSyncedData.ts`)

Hook يربط كل شيء معاً:
- ✅ تحميل من storage
- ✅ حفظ تلقائي عند التحديث
- ✅ tracking حالة المزامنة
- ✅ عمليات online/offline

**الاستخدام:**
```typescript
function StudentList() {
  const {
    data: students,
    setData: setStudents,
    queueSync,
    syncStatus,
  } = useSyncedData("students", [], {
    persistKey: "edugenie:students",
  });

  const addStudent = (name: string) => {
    const newStudent = { id: uuid(), name };
    
    // 1. Update UI immediately
    setStudents([...students, newStudent]);
    
    // 2. Queue for sync
    queueSync("student", "create", newStudent);
  };

  return (
    <div>
      {syncStatus.pendingCount > 0 && (
        <p>📡 {syncStatus.pendingCount} changes pending</p>
      )}
      {/* ... */}
    </div>
  );
}
```

### 4. **SupabaseSyncService** (`services/supabase-sync-service.ts`)

خدمة المزامنة الفعلية مع Supabase:
- ✅ معالجة جميع أنواع الكيانات
- ✅ دعم Create, Update, Delete
- ✅ معالجة الأخطاء والإعادة
- ✅ تحديثات في الوقت الفعلي

**التهيئة:**
```typescript
// في root layout أو app initializer
import { supabaseSyncService } from "@/services/supabase-sync-service";

useEffect(() => {
  supabaseSyncService.initializeSyncListener();
}, []);
```

---

## دورة حياة المزامنة

### سيناريو: إضافة طالب جديد

```
1️⃣ المستخدم يضيف طالب
   └─ Input: { name: "أحمد", email: "ahmed@..." }

2️⃣ التطبيق يحدث الحالة المحلية
   └─ UI updates immediately (optimistic)
   └─ Save to localStorage

3️⃣ إضافة للـ sync queue
   └─ Queue: { entity: "student", op: "create", data: {...} }

4️⃣ محاولة المزامنة مع Supabase
   ├─ ✅ نجح → حذف من queue
   ├─ ❌ فشل (offline) → remain in queue
   └─ ⚠️ خطأ → mark as failed, retry later

5️⃣ عند العودة للاتصال
   └─ تلقائياً تُعاد محاولة العمليات
   └─ مع exponential backoff:
      - 1st retry: بعد 1 ثانية
      - 2nd retry: بعد 3 ثواني
      - 3rd retry: بعد 10 ثواني
      - 4th retry: بعد 30 ثانية
      - 5th retry: بعد 60 ثانية
```

---

## الأحداث (Events) المهمة

التطبيق يطلق events للتتبع:

```typescript
// عند البدء
window.addEventListener("sync:start", () => {
  console.log("Sync started");
});

// عند إتمام عنصر
window.addEventListener("sync:item-success", (e: CustomEvent) => {
  console.log("Synced:", e.detail.id);
});

// عند خطأ
window.addEventListener("sync:error", (e: CustomEvent) => {
  console.error("Sync error:", e.detail.message);
});

// عند إتمام الـ queue كاملة
window.addEventListener("sync:complete", () => {
  console.log("All pending items synced");
});

// عند الاتصال
window.addEventListener("app:online", () => {
  console.log("App online, processing queue");
});
```

---

## الحالات الخاصة

### ✅ عند الانقطاع عن الإنترنت:

```typescript
// التطبيق يعمل بدون مشاكل
1. البيانات تُحفظ في localStorage ✓
2. UI يعرض البيانات من localStorage ✓
3. queue ينتظر الاتصال ✓
4. عند الاتصال → automatic sync ✓
```

### ✅ عند فتح التطبيق من جهاز آخر:

```typescript
1. تحميل من localStorage (محلي) ✓
2. جلب من Supabase (محدث) ✓
3. دمج الاثنين (الأحدث يفوز) ✓
4. مزامنة أي عمليات معلقة ✓
```

### ✅ عند فشل المزامنة:

```typescript
1. العملية تبقى في queue ✓
2. تُوضع في قائمة failed ✓
3. يُعاد المحاولة تلقائياً ✓
4. User يرى indicator للعمليات الفاشلة ✓
5. يمكن trigger الإعادة يدوياً ✓
```

---

## المراقبة والتتبع

### عرض حالة الـ Sync

```typescript
function SyncStatus() {
  const status = useSyncQueueStatus();
  
  return (
    <div>
      <p>Total: {status.total}</p>
      <p>Pending: {status.pending}</p>
      <p>Failed: {status.failed}</p>
      <p>Processing: {status.isProcessing ? "Yes" : "No"}</p>
    </div>
  );
}
```

### تخزين الاستخدام

```typescript
const usage = PersistentStore.getUsage();

if (usage.percentage > 90) {
  console.warn("Storage almost full!");
}
```

---

## أفضل الممارسات

### ✅ افعل:

```typescript
// 1. استخدم useSyncedData للبيانات الرئيسية
const { data, setData, queueSync } = useSyncedData("students", []);

// 2. حدث البيانات المحلية أولاً (optimistic)
setData([...data, newStudent]);

// 3. ثم أضف للـ queue
queueSync("student", "create", newStudent);

// 4. عالج الأخطاء
window.addEventListener("sync:error", handleError);

// 5. اعرض حالة المزامنة للمستخدم
{syncStatus.pendingCount > 0 && "📡 Syncing..."}
```

### ❌ لا تفعل:

```typescript
// ❌ لا تعتمد على server فقط
const data = await supabase.from("students").select();

// ❌ لا تغفل معالجة الأخطاء
await supabase.from("students").insert(data);

// ❌ لا تفترض الاتصال دائماً موجود
if (!navigator.onLine) {
  // تعامل مع offline mode
}

// ❌ لا تؤخر تحديث UI
// استخدم optimistic updates بدلاً من الانتظار
```

---

## التكامل مع صفحات موجودة

### قبل:
```typescript
// ❌ بدون تخزين دائم
function StudentPage() {
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    // جلب من server فقط
    fetchStudents();
  }, []);
}
```

### بعد:
```typescript
// ✅ مع تخزين دائم ومزامنة
function StudentPage() {
  const {
    data: students,
    setData: setStudents,
    queueSync,
    syncStatus,
  } = useSyncedData("students", []);
  
  const addStudent = (data) => {
    setStudents([...students, data]); // UI update
    queueSync("student", "create", data); // Sync
  };
}
```

---

## استكشاف الأخطاء

### المشكلة: البيانات لا تُحفظ

```typescript
// 1. تحقق من localStorage
console.log(localStorage.getItem("edugenie:students"));

// 2. تحقق من الـ checksum
const stats = SyncQueue.getStats();
console.log(stats);

// 3. تحقق من الأخطاء في console
// ابحث عن [PersistentStore] أو [SyncQueue]
```

### المشكلة: المزامنة لا تحدث

```typescript
// 1. تحقق من الاتصال
console.log(navigator.onLine);

// 2. تحقق من الـ queue
console.log(SyncQueue.getStats());

// 3. تحقق من الأخطاء
window.addEventListener("sync:error", (e) => {
  console.error(e.detail);
});
```

---

## الخطوات التالية

1. **استخدم في الصفحات الرئيسية:**
   - Students page
   - Teachers page
   - Attendance page

2. **أضف UI indicators:**
   - Sync status badge
   - Connection indicator
   - Failed items alert

3. **اختبر الحالات:**
   - Offline mode
   - Network interruption
   - Failed sync recovery

4. **راقب الأداء:**
   - Storage usage
   - Sync queue size
   - Error rates

---

## الملخص

| المميز | الفائدة |\n|---------|--------|\n| **PersistentStore** | تخزين آمن مع فحوصات تكامل |\n| **SyncQueue** | تتبع العمليات المعلقة |\n| **useSyncedData** | ربط سهل في المكونات |\n| **SupabaseSyncService** | مزامنة تلقائية مع server |\n| **Events** | تتبع حالة المزامنة في الوقت الفعلي |\n\n**النتيجة:** تطبيق موثوق لا يفقد البيانات! 🚀\n