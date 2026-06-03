#ifndef AIPLC_H
#define AIPLC_H

#include <stdint.h>
#include <stdbool.h>

// Digital I/O
bool DI_Read(int channel);
void DO_Write(int channel, bool value);
void DO_Toggle(int channel);

// Analog I/O
uint16_t AI_Read(int channel);
float AI_ReadVoltage(int channel);
float AI_ReadCurrent(int channel);
void AO_Write(int channel, uint16_t value);
void AO_WriteVoltage(int channel, float voltage);

// Timers
void Timer_Start(int id, uint32_t ms);
bool Timer_Done(int id);
void Timer_Reset(int id);
uint32_t Timer_Elapsed(int id);

// Counters
void Counter_Reset(int id);
void Counter_Up(int id);
void Counter_Down(int id);
int32_t Counter_Value(int id);
bool Counter_Done(int id, int32_t preset);

// Serial Communication
void Serial_Print(const char* fmt, ...);

// Modbus (placeholder)
void Modbus_Init(uint8_t slaveAddr, long baud);

// User-implemented functions
void PLC_Init(void);
void PLC_Scan(void);

#endif // AIPLC_H
