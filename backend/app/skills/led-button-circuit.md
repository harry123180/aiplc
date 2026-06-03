---
name: led-button-circuit
description: LED 按鈕控制迴路
triggers:
  - LED
  - 按鈕
  - button
  - 指示燈
  - blink
---

## 元件清單
- plc-cpu-f405 ×1
- button-no ×1（啟動按鈕）
- resistor ×1（1kΩ 限流電阻）
- indicator-light ×1（LED 指示燈）
- power-24v ×1（24VDC 電源）
- ground ×1

## 接線
- power-24v V+ → button-no COM
- button-no NO → plc-cpu DI0
- plc-cpu DO0 → resistor 1
- resistor 2 → indicator-light A
- indicator-light K → ground GND
- power-24v V- → ground GND

## 程式碼範例
```c
void PLC_Scan() {
    bool btn = DI_Read(0);
    DO_Write(0, btn);
}
```
