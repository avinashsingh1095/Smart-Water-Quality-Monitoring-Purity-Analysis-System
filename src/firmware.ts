export const FIRMWARE = `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C

Adafruit_SSD1306 display(
  SCREEN_WIDTH, SCREEN_HEIGHT,
  &Wire, OLED_RESET
);

const int PH_PIN = 34;
const int TDS_PIN = 35;
const int TURBIDITY_PIN = 32;

const bool PH_DIVIDER_CONNECTED = true;
const bool TURBIDITY_DIVIDER_CONNECTED = true;

const float DIVIDER_RATIO = 2.0;
const float ADC_REFERENCE_ESTIMATE = 3.3;
const int ADC_MAX = 4095;
const int SAMPLES = 20;

float phAdcVoltage = 0;
float phOutputVoltage = 0;
float tdsAdcVoltage = 0;
float turbidityAdcVoltage = 0;
float turbidityOutputVoltage = 0;

int phRaw = 0;
int tdsRaw = 0;
int turbidityRaw = 0;

int readAverage(int pin) {
  uint32_t total = 0;

  for (int i = 0; i < SAMPLES; i++) {
    total += analogRead(pin);
    delay(5);
  }

  return total / SAMPLES;
}

float rawToVoltage(int raw) {
  return (raw * ADC_REFERENCE_ESTIMATE) / ADC_MAX;
}

void showReadings() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.println("WATER QUALITY MONITOR");
  display.println("---------------------");

  display.print("pH ADC: ");
  display.print(phRaw);
  display.print("  V:");
  display.println(phOutputVoltage, 2);

  display.print("TDS ADC: ");
  display.print(tdsRaw);
  display.print(" V:");
  display.println(tdsAdcVoltage, 2);

  display.print("Turb ADC: ");
  display.print(turbidityRaw);
  display.print(" V:");
  display.println(turbidityOutputVoltage, 2);

  display.println("---------------------");
  display.println("Raw / voltage only");

  display.display();
}

void printReadings() {
  Serial.println("===== WATER QUALITY =====");

  Serial.print("pH raw ADC: ");
  Serial.println(phRaw);

  Serial.print("pH ADC voltage: ");
  Serial.print(phAdcVoltage, 3);
  Serial.println(" V");

  Serial.print("pH output voltage (estimated): ");
  Serial.print(phOutputVoltage, 3);
  Serial.println(" V");

  Serial.print("TDS raw ADC: ");
  Serial.println(tdsRaw);

  Serial.print("TDS ADC voltage: ");
  Serial.print(tdsAdcVoltage, 3);
  Serial.println(" V");

  Serial.print("Turbidity raw ADC: ");
  Serial.println(turbidityRaw);

  Serial.print("Turbidity ADC voltage: ");
  Serial.print(turbidityAdcVoltage, 3);
  Serial.println(" V");

  Serial.print("Turbidity output voltage (estimated): ");
  Serial.print(turbidityOutputVoltage, 3);
  Serial.println(" V");

  Serial.println("Calibrate sensors before reporting pH, ppm or NTU.");
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(500);

  analogReadResolution(12);

  analogSetPinAttenuation(PH_PIN, ADC_11db);
  analogSetPinAttenuation(TDS_PIN, ADC_11db);
  analogSetPinAttenuation(TURBIDITY_PIN, ADC_11db);

  Wire.begin(21, 22);

  if (!display.begin(
        SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("OLED not detected. Check wiring/address.");
    while (true) {
      delay(100);
    }
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("WATER MONITOR");
  display.println("Initializing...");
  display.display();

  Serial.println("ESP32 Water Quality Monitor");
  Serial.println("OLED initialized.");
  Serial.println("Readings are uncalibrated.");
  delay(1000);
}

void loop() {
  phRaw = readAverage(PH_PIN);
  tdsRaw = readAverage(TDS_PIN);
  turbidityRaw = readAverage(TURBIDITY_PIN);

  phAdcVoltage = rawToVoltage(phRaw);
  tdsAdcVoltage = rawToVoltage(tdsRaw);
  turbidityAdcVoltage = rawToVoltage(turbidityRaw);

  phOutputVoltage = phAdcVoltage *
    (PH_DIVIDER_CONNECTED ? DIVIDER_RATIO : 1.0);

  turbidityOutputVoltage = turbidityAdcVoltage *
    (TURBIDITY_DIVIDER_CONNECTED ? DIVIDER_RATIO : 1.0);

  showReadings();
  printReadings();

  delay(1500);
}
`;
