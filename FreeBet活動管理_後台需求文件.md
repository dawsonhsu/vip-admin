# FreeBet 活動管理 — 後台需求文件

> 路徑：`/admin/freebet-campaign`
> 最後更新：2026-04-11

---

## 一、頁面概述

本頁面為 FreeBet 活動的發放記錄管理介面，供運營與客服人員查看活動期間的 FreeBet 發放狀態、同步 BTi 側資訊、管理獎勵配置，以及處理異常記錄。

**適用活動範例**：世界杯冠軍 FreeBet（活動期間 2026/05 ~ 2026/06/10，Bonus ID: 9776）

---

## 二、頁面佈局結構

由上至下依序為：

| 區塊 | 說明 |
|---|---|
| 標題區 | 活動名稱、活動期間、Bonus ID |
| 篩選區 | 查詢條件輸入，支援多條件組合 |
| 統計卡片 | 6 張數據卡片，依篩選結果即時計算 |
| 操作按鈕列 | 「獎勵配置」、「導出」按鈕，靠右對齊 |
| 資料列表 | 發放記錄表格，支援勾選批量操作 |

---

## 三、篩選區

### 3.1 篩選欄位

| 欄位名稱 | 類型 | 說明 |
|---|---|---|
| UID | 文字輸入 | 模糊搜尋，不區分大小寫 |
| 會員帳號 | 文字輸入 | 模糊搜尋，不區分大小寫 |
| 手機號 | 文字輸入 | 模糊搜尋 |
| Assignee ID | 文字輸入 | 模糊搜尋 |
| VIP 等級 | 下拉選單 | VIP1 ~ VIP30，支援清除 |
| 發放狀態 | 下拉選單 | 成功 / 警告 / 失敗 |
| BTi 狀態 | 下拉選單 | 0~7 全部狀態碼，支援清除 |
| 發放時間 | 日期範圍 | 起始日 ~ 結束日 |

### 3.2 操作按鈕

- **查詢**：依據篩選條件過濾列表與統計卡片
- **重置**：清除所有篩選條件，恢復全量資料

---

## 四、統計卡片

共 6 張，依據篩選後的資料即時計算：

| 卡片 | 計算邏輯 |
|---|---|
| 總記錄 | 篩選結果總筆數 |
| 發放成功 | `grantStatus = success` 的筆數 |
| 待處理 | `grantStatus = failed` 或 `grantStatus = warning` 或 `btiStatusCode = 7` 的筆數。若有失敗記錄，額外顯示 Badge「N 失敗」 |
| 已使用 | `btiStatusCode = 2` 的筆數 |
| 使用率 | `已使用 / 發放成功 * 100`，取整數，單位 % |
| 總發放金額 | `grantStatus = success` 的記錄之 `rewardAmount` 加總，幣別 ₱ |

---

## 五、操作按鈕列

靠右對齊，包含：

| 按鈕 | 功能 |
|---|---|
| 獎勵配置 | 開啟 VIP 等級獎勵配置彈窗（詳見第八節） |
| 導出 | 將當前篩選結果匯出為 CSV 檔案 |

---

## 六、發放記錄列表

### 6.1 欄位定義

| 欄位 | 欄位名 (dataIndex) | 寬度 | 固定 | 排序 | 篩選 | 說明 |
|---|---|---|---|---|---|---|
| UID | `uid` | 100 | 左 | — | — | 點擊跳轉會員詳情頁 |
| 會員帳號 | `playerAccount` | 140 | 左 | — | — | 點擊跳轉會員詳情頁 |
| 手機號 | `phone` | 140 | — | — | — | 點擊跳轉會員詳情頁 |
| VIP | `vipLevelAtSettlement` | 80 | — | — | — | 顯示為 Tag `V{n}` |
| 應發金額 | `rewardAmount` | 110 | — | 可排序 | — | 格式 `₱{amount}` |
| 發放狀態 | `grantStatus` | 100 | — | — | 表頭篩選 | 見 6.2 |
| BTi 狀態 | `btiStatusCode` | 140 | — | — | 表頭篩選 | 見 6.3，Hover icon 提示「狀態未即時同步，需手動同步狀態」 |
| 觸發注單號 | `triggerBetId` | 150 | — | — | — | 等寬字體顯示 |
| Assignee ID | `assigneeId` | 110 | — | — | — | 等寬字體顯示 |
| 發放時間 | `grantedAt` | 170 | — | 可排序 | — | 無值顯示 `—` |
| 使用時間 | `usedAt` | 170 | — | — | — | 無值顯示 `—` |
| 到期時間 | `activeTill` | 170 | — | — | — | 無值顯示 `—` |
| 操作人 | `operator` | 180 | — | — | — | |
| 操作 | — | 160 | 右 | — | — | 見 6.4 |

### 6.2 發放狀態

| 值 | 顯示 | Tag 顏色 |
|---|---|---|
| `success` | 成功 | green |
| `warning` | 警告 | orange |
| `failed` | 失敗 | red |

> 注意：發放狀態**不包含**「已取消」。

### 6.3 BTi 狀態

BTi 側回傳的原始狀態碼 0~7，全部以中文顯示：

| 狀態碼 | 顯示 | Tag 顏色 |
|---|---|---|
| 0 | 未激活 | default (灰) |
| 1 | 可使用 | processing (藍) |
| 2 | 已使用 | success (綠) |
| 3 | 已過期 | error (紅) |
| 4 | 已過期(未使用) | error (紅) |
| 5 | 失敗 | error (紅) |
| 6 | 已取消 | default (灰) |
| 7 | 待激活 | warning (橙) |

> 欄位標題旁有 info icon，hover 顯示：「狀態未即時同步，需手動同步狀態」

### 6.4 操作欄邏輯

根據記錄狀態動態顯示可用操作：

| 條件 | 顯示操作 | 互動行為 |
|---|---|---|
| `grantStatus = failed` | 重試發放 | 確認彈窗 → 提示成功 |
| `btiStatusCode ∈ {0, 1, 7}` | 取消 | 確認彈窗（紅色按鈕） → 提示成功 |
| `btiStatusCode ≠ null` | 同步狀態 | **無確認彈窗**，直接提示觸發成功 |
| 以上皆不符 | `—` | 無操作 |

**確認彈窗內容**：

- **取消**：「確定取消會員 {帳號} 的 FreeBet（{金額}）？此操作將向 BTi 發起取消請求。」
- **重試發放**：「確定對會員 {帳號} 重新發放 FreeBet（{金額}）？」

### 6.5 會員跳轉

點擊 UID、會員帳號、手機號任一欄位，均跳轉至**會員詳情頁**（路由待後續文件定義）。

### 6.6 分頁

- 預設每頁 20 筆
- 顯示「共 N 筆」
- 支援切換每頁筆數

---

## 七、批量操作

勾選列表記錄後，表格標題列顯示批量操作區：

| 操作 | 說明 |
|---|---|
| 已選 N 筆 | 顯示當前勾選數量 |
| 批次同步狀態 | 對所有已選記錄發起 BTi 狀態同步，直接提示成功 |
| 取消選擇 | 清除所有勾選 |

> 注意：批量操作**不包含**批次重試。

---

## 八、獎勵配置彈窗

點擊「獎勵配置」按鈕開啟 Modal。

### 8.1 表格欄位

| 欄位 | 說明 | 可編輯 |
|---|---|---|
| VIP 等級 | VIP1 ~ VIP30，Tag 顯示 | 否 |
| Bonus ID | BTi 模板 ID | 是（數字輸入） |
| FreeBet 金額 | 發放金額，格式 `₱{amount}` | 是（數字輸入，帶 ₱ 前綴） |
| 最後更新人 | 操作者帳號 | 否（自動記錄） |
| 最後更新時間 | 操作時間 | 否（自動記錄） |
| 操作 | 編輯 / 取消+保存 | — |

### 8.2 編輯流程

1. 點擊「編輯」→ Bonus ID 與 FreeBet 金額變為可編輯輸入框
2. 操作欄顯示「取消」（左）與「保存」（右）
3. 點擊「保存」→ 更新配置，自動記錄當前操作人與時間，提示「配置已更新」
4. 點擊「取消」→ 放棄修改，恢復唯讀狀態

### 8.3 分頁

- 每頁 10 筆
- 顯示「共 N 筆」

---

## 九、發放詳情側欄 (Drawer)

點擊列表中的會員帳號（表格行內連結）開啟右側 Drawer。

### 9.1 基本資訊

| 欄位 | 說明 |
|---|---|
| 發放單號 | 系統產生的唯一識別碼 |
| UID | 會員 UID |
| 會員帳號 | |
| 手機號 | |
| 結算時 VIP | Tag 顯示 |
| 應發金額 | 格式 `₱{amount}` |
| Bonus ID | |
| Assignee ID | |
| BTi 狀態碼 | `{code}: {中文標籤}` |
| 發放狀態 | Tag 顯示 |
| 觸發注單號 | |
| 觸發結算時間 | |
| 發放時間 | |
| 使用時間 | |
| 到期時間 | |
| 最後同步時間 | |
| 操作人 | |
| 備註 | |

### 9.2 操作日誌 (Timeline)

按時間順序顯示：

| 事件 | 顏色 | 條件 |
|---|---|---|
| 注單結算觸發資格判定 | 綠 | 固定顯示 |
| 發起 BTi Assign Bonus | 綠/紅 | `grantedAt` 存在時顯示，失敗為紅色 |
| BTi 返回錯誤，發放失敗 | 紅 | `grantStatus = failed` |
| BTi 返回 warning，等待 active | 橙 | `grantStatus = warning` |
| 用戶使用 FreeBet 投注 | 藍 | `usedAt` 存在時顯示 |
| 最後同步 BTi 狀態 | 灰 | `lastSyncAt` 存在時顯示 |

### 9.3 Drawer 操作

- **標題列右側**：「同步 BTi」按鈕（直接提示成功）
- **底部操作區**：依據記錄狀態顯示可用操作（邏輯同 6.4）

---

## 十、資料模型

### 10.1 FreeBetRewardConfig（獎勵配置）

```typescript
interface FreeBetRewardConfig {
  key: number;
  vipLevel: number;          // VIP 等級 1~30
  bonusId: number;           // BTi Bonus 模板 ID
  rewardAmount: number;      // 發放金額（₱）
  lastUpdatedBy: string;     // 最後更新人
  lastUpdatedAt: string;     // 最後更新時間 (YYYY-MM-DD HH:mm:ss)
}
```

### 10.2 FreeBetGrantRecord（發放記錄）

```typescript
interface FreeBetGrantRecord {
  id: string;                // 發放單號
  uid: string;               // 會員 UID
  playerAccount: string;     // 會員帳號
  phone: string;             // 手機號
  vipLevelAtSettlement: number; // 結算時 VIP 等級
  triggerBetId: string;      // 觸發注單號
  triggerSettledAt: string;  // 觸發結算時間
  rewardAmount: number;      // 應發金額（₱）
  bonusId: number;           // Bonus ID
  assigneeId: number;        // BTi Assignee ID
  btiStatusCode: number | null; // BTi 狀態碼 0~7，null 表示尚未取得
  grantStatus: 'success' | 'warning' | 'failed'; // 發放狀態
  grantedAt: string | null;  // 發放時間
  usedAt: string | null;     // 使用時間
  activeTill: string | null; // 到期時間
  lastSyncAt: string | null; // 最後同步時間
  operator: string;          // 操作人
  remark: string;            // 備註
}
```

---

## 十一、API 需求（後端）

### 11.1 發放記錄查詢

```
GET /api/freebet-campaign/grants
```

**查詢參數**：

| 參數 | 類型 | 說明 |
|---|---|---|
| `uid` | string | UID 模糊搜尋 |
| `playerAccount` | string | 帳號模糊搜尋 |
| `phone` | string | 手機號模糊搜尋 |
| `assigneeId` | string | Assignee ID 模糊搜尋 |
| `vipLevel` | number | VIP 等級精確匹配 |
| `grantStatus` | string | 發放狀態精確匹配 |
| `btiStatusCode` | number | BTi 狀態碼精確匹配 |
| `startDate` | string | 發放時間起始 |
| `endDate` | string | 發放時間結束 |
| `page` | number | 頁碼 |
| `pageSize` | number | 每頁筆數 |

**回傳**：`{ data: FreeBetGrantRecord[], total: number }`

### 11.2 統計數據

```
GET /api/freebet-campaign/stats
```

回傳篩選結果的統計值（總記錄、發放成功、待處理、已使用、使用率、總發放金額）。

> 或由前端根據列表資料自行計算（適用小數據量）。

### 11.3 獎勵配置

```
GET  /api/freebet-campaign/reward-configs
PUT  /api/freebet-campaign/reward-configs/:vipLevel
```

PUT 請求 body：

```json
{
  "bonusId": 9776,
  "rewardAmount": 277
}
```

回傳更新後的完整配置，含 `lastUpdatedBy`、`lastUpdatedAt`。

### 11.4 單筆操作

```
POST /api/freebet-campaign/grants/:id/sync       // 同步 BTi 狀態
POST /api/freebet-campaign/grants/:id/cancel      // 取消 FreeBet
POST /api/freebet-campaign/grants/:id/retry       // 重試發放
```

### 11.5 批量同步

```
POST /api/freebet-campaign/grants/batch-sync
```

請求 body：

```json
{
  "ids": ["CFG-20260610-0001", "CFG-20260610-0003"]
}
```

### 11.6 導出

```
GET /api/freebet-campaign/grants/export?{同 11.1 查詢參數}
```

回傳 CSV 檔案流。

---

## 十二、前端技術規格

| 項目 | 說明 |
|---|---|
| 框架 | Next.js 14 (App Router) |
| UI 元件庫 | Ant Design 5 |
| 語言 | TypeScript |
| 頁面路由 | `/admin/freebet-campaign` |
| 原始碼位置 | `src/app/admin/freebet-campaign/page.tsx` |
| 資料定義 | `src/data/freeBetActivityData.ts` |

---

## 十三、待後續定義項目

| 項目 | 說明 |
|---|---|
| 會員詳情頁路由 | 點擊 UID / 帳號 / 手機號的跳轉目標 |
| 導出欄位與格式 | CSV 包含哪些欄位、檔名規則 |
| 權限控制 | 哪些角色可查看 / 編輯配置 / 執行取消操作 |
| 操作日誌 API | 後端操作日誌的儲存與查詢介面 |
| 活動配置模組 | 活動基本設定、資格規則、風控等完整配置功能 |
