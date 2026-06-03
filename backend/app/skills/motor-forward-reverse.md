---
name: motor-forward-reverse
description: 三相馬達正反轉控制迴路
triggers:
  - 馬達
  - motor
  - 正轉
  - 反轉
  - forward
  - reverse
  - KM1
  - KM2
  - 接觸器
---

## 元件清單
- plc-cpu-f405 ×1
- button-no ×2（正轉啟動、反轉啟動）
- button-nc ×1（停止按鈕）
- emergency-stop ×1（急停）
- contactor-3phase ×2（KM1 正轉、KM2 反轉）
- thermal-overload ×1（過載保護）
- motor-3phase ×1
- indicator-light ×3（正轉綠燈、反轉黃燈、故障紅燈）
- power-24v ×1
- ground ×1

## 接線
- KM1 和 KM2 需要電氣互鎖
- 過載保護 NC 接到 PLC DI
- 急停按鈕使用 NC 接點（斷線安全）

## 安全注意事項
- 正反轉切換必須先停止再延遲 2 秒
- KM1 和 KM2 不可同時導通
- 建議加機械互鎖

## 程式碼範例
```c
void PLC_Scan() {
    bool fwd_btn = DI_Read(0);
    bool rev_btn = DI_Read(1);
    bool stop_btn = !DI_Read(2);  // NC button
    bool overload = !DI_Read(3);  // NC contact
    
    static bool fwd = false, rev = false;
    
    if (stop_btn || overload) { fwd = false; rev = false; }
    if (fwd_btn && !rev) fwd = true;
    if (rev_btn && !fwd) rev = true;
    
    DO_Write(0, fwd);   // KM1
    DO_Write(1, rev);   // KM2
    DO_Write(2, fwd);   // 正轉燈
    DO_Write(3, rev);   // 反轉燈
    DO_Write(4, overload); // 故障燈
}
```
