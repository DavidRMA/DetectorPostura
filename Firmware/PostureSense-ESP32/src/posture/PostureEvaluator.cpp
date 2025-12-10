#include "posture/PostureEvaluator.h"
#include <math.h>

PostureEvaluator::PostureEvaluator()
  : _offsetX(0.0f),
    _offsetY(0.0f),
    _thresholdDeg(DEFAULT_THRESHOLD_DEG),
    _age(DEFAULT_AGE)
{
}

// ---- Calibración: offsets de postura correcta ----
void PostureEvaluator::setOffsets(float ox, float oy)
{
  _offsetX = ox;
  _offsetY = oy;
}

// ---- Umbral directo (si viene del backend) ----
void PostureEvaluator::setThreshold(float deg)
{
  _thresholdDeg = deg;
}

// ---- Edad: recalcula umbral automáticamente ----
void PostureEvaluator::setAge(int age)
{
  _age = age;
  _thresholdDeg = computeThresholdForAge(age);
}

int PostureEvaluator::getAge() const
{
  return _age;
}

float PostureEvaluator::getThreshold() const
{
  return _thresholdDeg;
}

// Recibe ángulos CRUDOS del MPU (en grados)
PostureStatus PostureEvaluator::evaluate(float rawX, float rawY)
{
    PostureStatus s;
    
    // 1. Aplicar offsets
    s.angleX = rawX - _offsetX;
    s.angleY = rawY - _offsetY;
    
    // 2. Calcular tilt CORRECTAMENTE para espalda
    // Normalizar ángulos a -180..180
    s.angleX = fmod(s.angleX + 180.0, 360.0) - 180.0;
    s.angleY = fmod(s.angleY + 180.0, 360.0) - 180.0;
    
    // 3. Usar solo el valor absoluto de la inclinación hacia adelante (eje Y)
    // y un poco de la inclinación lateral (eje X)
    float forwardTilt = abs(s.angleY);  // Inclinación hacia adelante/atrás
    float sideTilt = abs(s.angleX) * 0.5;  // Inclinación lateral (menos peso)
    
    // 4. Tilt combinado (ponderado)
    s.maxAngle = forwardTilt + sideTilt;
    
    // 5. Umbral dinámico
    s.threshold = _thresholdDeg;
    
    // 6. Determinar mala postura
    s.isBadPosture = (s.maxAngle > _thresholdDeg);
    
    return s;
}

float PostureEvaluator::computeThresholdForAge(int age)
{
    // Para DISPOSITIVO EN ESPALDA:
    // La inclinación normal al estar sentado es ~20-30°
    if (age <= 12)      return 25.0f;   // Niños
    else if (age <= 17) return 28.0f;   // Adolescentes  
    else if (age <= 40) return 30.0f;   // Adultos jóvenes
    else if (age <= 60) return 35.0f;   // Adultos
    else                return 40.0f;   // Adultos mayores
}
