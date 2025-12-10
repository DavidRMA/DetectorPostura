#pragma once
#include <Arduino.h>
#include "config/DeviceConfig.h"
#include "posture/PostureEvaluator.h"

class ApiClient {
public:
  bool fetchConfig(const char* deviceId, DeviceRuntimeConfig& cfg);
  bool sendTelemetry(const char* deviceId, const PostureStatus& status,
                     float rawX, float rawY);
  void pullUpdatesIfNeeded(const char* deviceId, PostureEvaluator& eval);

private:
  unsigned long _lastConfigCheck = 0;
  const unsigned long CONFIG_INTERVAL_MS = 60000; // 1 min
  
  // Función privada para calcular score
  float calculateScore(float tilt, float threshold, bool isBadPosture);
};