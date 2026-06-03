---
name: modbus-communication
description: Modbus RTU/TCP 通訊設定
triggers:
  - Modbus
  - 通訊
  - RS485
  - 串列通訊
  - communication
  - slave
  - master
---

## 基本 Modbus 初始化
```c
void PLC_Init() {
    Modbus_Init(1, 9600);  // Slave address 1, 9600 baud
}
```

## 元件清單
- plc-cpu-f405 ×1
- 通訊對象設備（VFD / 溫控器 / HMI）

## 注意事項
- RS485 需要終端電阻（120Ω）
- 確認 baud rate 和 parity 與 slave 設備一致
- Slave address 不可重複
