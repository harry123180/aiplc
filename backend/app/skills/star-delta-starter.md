---
name: star-delta-starter
description: 星三角啟動迴路
triggers:
  - 星三角
  - star delta
  - Y-Δ
  - 降壓啟動
  - 大馬達啟動
---

## 元件清單
- plc-cpu-f405 ×1
- button-no ×1（啟動）
- button-nc ×1（停止）
- contactor-3phase ×3（KM1 主接觸器、KM2 星形、KM3 三角形）
- thermal-overload ×1
- motor-3phase ×1
- indicator-light ×2（運轉、故障）
- power-24v ×1
- ground ×1

## 啟動順序
1. 按下啟動 → KM1 + KM2 導通（星形接法，降壓）
2. 延遲 5-10 秒 → KM2 斷開 → 延遲 50ms → KM3 導通（三角形接法，全壓）
3. KM2 和 KM3 必須互鎖

## 程式碼範例
```c
void PLC_Scan() {
    bool start = DI_Read(0);
    bool stop = !DI_Read(1);
    
    static bool running = false;
    static bool star_phase = false;
    
    if (stop) { running = false; star_phase = false; Timer_Reset(0); }
    if (start && !running) { running = true; star_phase = true; Timer_Start(0, 7000); }
    
    if (star_phase && Timer_Done(0)) {
        star_phase = false;  // Switch to delta
    }
    
    DO_Write(0, running);                    // KM1 main
    DO_Write(1, running && star_phase);      // KM2 star
    DO_Write(2, running && !star_phase);     // KM3 delta
}
```
