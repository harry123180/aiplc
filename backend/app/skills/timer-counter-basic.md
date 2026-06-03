---
name: timer-counter-basic
description: 計時器與計數器基本應用
triggers:
  - 計時器
  - timer
  - 延遲
  - delay
  - 計數器
  - counter
  - 閃爍
  - blink
  - 定時
---

## 計時器範例（延遲啟動）
```c
void PLC_Scan() {
    if (DI_Read(0)) Timer_Start(0, 3000);  // 按下後延遲 3 秒
    DO_Write(0, Timer_Done(0));             // 3 秒後輸出
}
```

## 計數器範例（計數 10 次後動作）
```c
void PLC_Scan() {
    static bool prev = false;
    bool btn = DI_Read(0);
    if (btn && !prev) Counter_Up(0);  // 上升沿計數
    prev = btn;
    
    DO_Write(0, Counter_Done(0, 10));  // 到 10 次輸出
    if (DI_Read(1)) Counter_Reset(0);  // 重置
}
```

## 閃爍燈（Toggle Timer）
```c
void PLC_Scan() {
    static bool state = false;
    if (!Timer_Done(0)) Timer_Start(0, 500);
    else { state = !state; Timer_Reset(0); Timer_Start(0, 500); }
    DO_Write(0, state);
}
```
