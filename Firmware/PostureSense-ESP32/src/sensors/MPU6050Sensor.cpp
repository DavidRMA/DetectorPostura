
#include "MPU6050Sensor.h"
#include <Wire.h>
#include <math.h>

bool MPU6050Sensor::begin() {
  Wire.begin();
  Wire.beginTransmission(0x68);
  if (Wire.endTransmission() != 0) {
    _initialized = false;
    return false;
  }
  Wire.beginTransmission(0x68);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission();

  _initialized = true;
  return true;
}

bool MPU6050Sensor::readAngles(float& angleX, float& angleY) {
  if (!_initialized) return false;

  Wire.beginTransmission(0x68);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return false;

  if (Wire.requestFrom(0x68, 6) != 6) return false;

  int16_t ax = Wire.read() << 8 | Wire.read();
  int16_t ay = Wire.read() << 8 | Wire.read();
  int16_t az = Wire.read() << 8 | Wire.read();

  // Convertir a gravedades
  const float ACCEL_SCALE = 16384.0; // Para ±2g
  float accX = ax / ACCEL_SCALE;
  float accY = ay / ACCEL_SCALE;
  float accZ = az / ACCEL_SCALE;

  // Calcular ángulos de inclinación (roll y pitch)
  // Para dispositivo en la ESPALDA:
  // - angleX: inclinación lateral (roll)
  // - angleY: inclinación hacia adelante/atrás (pitch)
  
  angleX = atan2(accY, accZ) * 180.0 / PI;
  angleY = atan2(-accX, sqrt(accY*accY + accZ*accZ)) * 180.0 / PI;
  
  return true;
}