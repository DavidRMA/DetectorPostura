#include "posture/Calibration.h"
#include <EEPROM.h>

/// Tamaño de la EEPROM emulada (ESP32)
#define EEPROM_SIZE 64

/// Dirección base donde guardaremos la calibración
#define CALIB_EEPROM_ADDR 0

/// Magic number para saber si hay datos válidos
#define CALIB_MAGIC 0xDEADBEEF

struct CalibData {
    uint32_t magic;
    float offsetX;
    float offsetY;
};

Calibration::Calibration(MPU6050Sensor &mpu, PostureEvaluator &eval)
    : _mpu(mpu), _eval(eval)
{
}

bool Calibration::loadOffsetsFromEEPROM()
{
    if (!EEPROM.begin(EEPROM_SIZE)) {
        Serial.println("[CALIB] ❌ Error inicializando EEPROM");
        return false;
    }

    CalibData data;
    EEPROM.get(CALIB_EEPROM_ADDR, data);

    if (data.magic != CALIB_MAGIC) {
        Serial.println("[CALIB] ⚠ No hay calibración válida en EEPROM");
        return false;
    }

    _offsetX = data.offsetX;
    _offsetY = data.offsetY;
    _eval.setOffsets(_offsetX, _offsetY);

    Serial.println("[CALIB] ✅ Calibración cargada desde EEPROM");
    Serial.print("       offsetX = ");
    Serial.print(_offsetX);
    Serial.print("°, offsetY = ");
    Serial.print(_offsetY);
    Serial.println("°");

    return true;
}

void Calibration::saveOffsetsToEEPROM()
{
    CalibData data;
    data.magic   = CALIB_MAGIC;
    data.offsetX = _offsetX;
    data.offsetY = _offsetY;

    EEPROM.put(CALIB_EEPROM_ADDR, data);
    EEPROM.commit();

    Serial.println("[CALIB] 💾 Offsets guardados en EEPROM");
    Serial.print("       offsetX = ");
    Serial.print(_offsetX);
    Serial.print("°, offsetY = ");
    Serial.print(_offsetY);
    Serial.println("°");
}

void Calibration::runCalibration()
{
    Serial.println("\n===== 🔧 CALIBRACIÓN DE POSTURA =====");
    Serial.println("1. Ponte de pie con ESPALDA RECTA");
    Serial.println("2. Mira al frente");
    Serial.println("3. Mantén hombros relajados");
    Serial.println("4. Espera 5 segundos...\n");
    
    delay(5000);
    
    float sumX = 0, sumY = 0;
    const int samples = 100;
    
    Serial.println("Midiendo postura correcta...");
    
    for (int i = 0; i < samples; i++)
    {
        float x, y;
        if (_mpu.readAngles(x, y))
        {
            sumX += x;
            sumY += y;
            Serial.print(".");
        }
        delay(50);
    }
    
    _offsetX = sumX / samples;
    _offsetY = sumY / samples;
    _eval.setOffsets(_offsetX, _offsetY);
    
    Serial.println("\n✅ CALIBRACIÓN COMPLETADA!");
    Serial.print("   Offset X: "); Serial.print(_offsetX); Serial.println("°");
    Serial.print("   Offset Y: "); Serial.print(_offsetY); Serial.println("°");
    Serial.println("   Ahora esta posición = 0° de inclinación");
}
