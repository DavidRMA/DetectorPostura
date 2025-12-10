#include <Arduino.h>
#include "config/DeviceConfig.h"
#include "network/WiFiManager.h"
#include "network/ApiClient.h"
#include "sensors/MPU6050Sensor.h"
#include "posture/PostureEvaluator.h"
#include "actuators/Vibrator.h"
#include "posture/Calibration.h"

WiFiManager wifiManager;
ApiClient apiClient;
MPU6050Sensor mpu;
PostureEvaluator postureEval;
Vibrator vibrator(VIBRATOR_PIN);
Calibration calibrator(mpu, postureEval);

unsigned long lastTelemetry = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 1000; // cada 1s

void setup()
{
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n=== POSTURE CORRECT - FIRMWARE REAL ===");

  pinMode(VIBRATOR_PIN, OUTPUT);
  digitalWrite(VIBRATOR_PIN, LOW);

  // 1. Conectar WiFi
  wifiManager.begin(WIFI_SSID, WIFI_PASS);

  // 2. Inicializar sensor
  if (!mpu.begin())
  {
    Serial.println("ERROR: MPU6050 no detectado");
  }

  // 3. SIEMPRE calibrar (NO cargar de EEPROM)
  Serial.println("\n⚠ CALIBRACIÓN OBLIGATORIA ⚠");
  calibrator.runCalibration();
  calibrator.saveOffsetsToEEPROM();

  // 4. (Opcional) obtener config del backend
  DeviceRuntimeConfig cfg;
  if (apiClient.fetchConfig(DEVICE_ID, cfg))
  {
    postureEval.setAge(cfg.age);
    if (cfg.thresholdDeg > 0)
    {
      postureEval.setThreshold(cfg.thresholdDeg);
    }
  }
  else
  {
    postureEval.setAge(DEFAULT_AGE);
  }

  Serial.println("Setup completo, entrando a loop...");
}
void loop()
{
  float angleX, angleY;
  if (!mpu.readAngles(angleX, angleY))
    return;

  PostureStatus status = postureEval.evaluate(angleX, angleY);

  // DEBUG VISUAL
  Serial.print("RAW: X=");
  Serial.print(angleX, 1);
  Serial.print(" Y=");
  Serial.print(angleY, 1);
  Serial.print(" | REL: X=");
  Serial.print(status.angleX, 1);
  Serial.print(" Y=");
  Serial.print(status.angleY, 1);
  Serial.print(" | TILT=");
  Serial.print(status.maxAngle, 1);
  Serial.print("/");
  Serial.print(status.threshold, 1);
  Serial.print(" | BAD=");
  Serial.print(status.isBadPosture ? "SI" : "NO");

  // Barra visual
  Serial.print(" [");
  int bars = map(constrain(status.maxAngle, 0, 50), 0, 50, 0, 20);
  for (int i = 0; i < 20; i++)
  {
    if (i < bars)
      Serial.print("#");
    else
      Serial.print(".");
  }
  Serial.println("]");

  // 3. Control del vibrador según estado
  static unsigned long badPostureSince = 0;
  if (status.isBadPosture)
  {
    if (badPostureSince == 0)
      badPostureSince = millis();

    if (millis() - badPostureSince > VIBRATION_DELAY_MS)
    {
      vibrator.patternAlert(); // patrón ya definido
    }
  }
  else
  {
    badPostureSince = 0;
    vibrator.off();
  }

  // 4. Enviar telemetría al backend periódicamente
  if (millis() - lastTelemetry > TELEMETRY_INTERVAL_MS)
  {
    apiClient.sendTelemetry(DEVICE_ID, status, angleX, angleY);
    lastTelemetry = millis();
  }

  // 5. (Opcional) consultar al backend si hay nueva config
  apiClient.pullUpdatesIfNeeded(DEVICE_ID, postureEval);

  delay(50); // pequeño descanso
}
