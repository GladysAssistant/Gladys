#include <ArduinoJson.h>
#include <RCSwitch.h>
#include <IRremote.h>
#include <dht.h>
#include <Servo.h>

unsigned long previousMillis = 0;
const long interval = 20000;

dht DHT;

IRsend ir_send;                                                  // Crée une instance pour controler les led (pin 3 par défaut)
RCSwitch mySwitch = RCSwitch();                                  // Crée une instance pour la réception 433 MHz (pin 2)

decode_results results;                                          // Variable contenant le résultat des réceptions IR

bool recv433 = true;
bool recvIR = false;
bool dhtEnabled = false;

int dht_pin;

Servo myServo;  // SERVO

const unsigned int THIGH = 220, TSHORT = 350, TLONG = 1400;       // Temps des états (nécessaire à l'envoi de signaux Chacon)

// Serial buffer
String command = "";

// End of command marker
char endMarker = '%';

/*
   Functions that will be called by Gladys
*/

void emit_ir(unsigned long code, int bit_length, int data_pin) {    // Fonction à appeler pour envoyer un code IR au ruban LED
  ir_send.changePin(data_pin);
  ir_send.sendNEC(code, bit_length);
}

void emit_433(long code, int bit_length, int data_pin) {            // Fonction à appeler pour envoyer un code en 433 MHz
  mySwitch.enableTransmit(data_pin);
  mySwitch.send(code, bit_length);
  mySwitch.disableTransmit();
}

void emit_433_chacon(unsigned long code, int data_pin) {            // Fonction à appeler pour envoyer un code Chacon
  for (int i = 0; i < 5; i++) {                                     // Emission du code 5 fois
    emit(code, data_pin);
  }
}

void set_servo(int angle, int data_pin) {
  // set the servo position
  myServo.attach(data_pin); // attaches the servo on pin 9 to the servo object
  myServo.write(angle);
}

void recv_433(bool isEnabled, int data_pin) {
  mySwitch.enableReceive(data_pin);
  recv433 = isEnabled;
}

void recv_dht(bool enabled, int data_pin) {
  dhtEnabled = enabled;
  dht_pin = data_pin;
}

/*
   Fonction permettant d'envoyer un signal radio Chacon
*/

void emit(unsigned long code, int data_pin) {
  digitalWrite(data_pin, HIGH);
  delayMicroseconds(THIGH);
  digitalWrite(data_pin, LOW);
  delayMicroseconds(2675);
  for (int i = 0; i < 32; i++) {
    if (code & 0x80000000L) {
      digitalWrite(data_pin, HIGH);
      delayMicroseconds(THIGH);
      digitalWrite(data_pin, LOW);
      delayMicroseconds(TLONG);
      digitalWrite(data_pin, HIGH);
      delayMicroseconds(THIGH);
      digitalWrite(data_pin, LOW);
      delayMicroseconds(TSHORT);
    } else {
      digitalWrite(data_pin, HIGH);
      delayMicroseconds(THIGH);
      digitalWrite(data_pin, LOW);
      delayMicroseconds(TSHORT);
      digitalWrite(data_pin, HIGH);
      delayMicroseconds(THIGH);
      digitalWrite(data_pin, LOW);
      delayMicroseconds(TLONG);
    }
    code <<= 1;
  }
  digitalWrite(data_pin, HIGH);
  delayMicroseconds(THIGH);
  digitalWrite(data_pin, LOW);
  delayMicroseconds(10600);
  digitalWrite(data_pin, HIGH);
  delayMicroseconds(THIGH);

  //Remise à 0 pour ne pas interférer avec les télécommandes
  digitalWrite(data_pin, LOW);
}

/*
   Execute the right function
*/

void executeFunction(String json_data) {
  StaticJsonDocument<400> jsonBuffer;
  DeserializationError error = deserializeJson(jsonBuffer, json_data);
  if (error) {
    Serial.println(error.c_str());
    return;
  }
  JsonObject v = jsonBuffer.as<JsonObject>();

  //on décompose la chaine de caractère
  if ( v["function_name"] == String("emit_433") ) {
    emit_433(v["parameters"]["code"], v["parameters"]["bit_length"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("emit_433_chacon") ) {
    emit_433_chacon(v["parameters"]["code"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("emit_ir") ) {
    emit_ir(v["parameters"]["code"], v["parameters"]["bit_length"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("set_servo") ) {
    set_servo(v["parameters"]["angle"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("recv_433") ) {
    recv_433(v["parameters"]["enable"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("recv_dht") ) {
    recv_dht(v["parameters"]["enable"], v["parameters"]["data_pin"]);
  }
}

/**
   This function is automatically called when data is received on serial port
*/
void serialEvent() {
  //lit toutes les données (vide le buffer de réception)
  char last_readed_char = Serial.read();
  if ( last_readed_char == endMarker ) {
    executeFunction(command);
    command = "";
  } else {
    command += last_readed_char;
  }
}

void setup() {

  // Open serial communications and wait for port to open:
  Serial.begin(9600);

  recv_433(true, 0);
  recv_dht(true, 8);

}

void loop() {
  unsigned long currentMillis = millis();

  if (dhtEnabled) {                                                // Partie réception température/humidité via DHT11
    if (currentMillis - previousMillis >= interval) {
      previousMillis = currentMillis;
      int chk = DHT.read11(dht_pin);
      
      Serial.print("{\"function_name\":\"dht_temperature\",\"parameters\":{\"value\":");
      Serial.print(DHT.temperature);
      Serial.println("}}");
      
      Serial.print("{\"function_name\":\"dht_humidity\",\"parameters\":{\"value\":");
      Serial.print(DHT.humidity);
      Serial.println("}}");
    }
  }

  if (recv433) {                                                   // Partie réception 433 MHz
    if (mySwitch.available()) {
      int value = mySwitch.getReceivedValue();
      if (value == 0) {
        Serial.print("Unknown encoding");
      } else {
        Serial.print("{\"function_name\":\"recv_433\",\"parameters\":{\"value\":");
        Serial.print( mySwitch.getReceivedValue() );
        Serial.println("}}");
      }
      delay(200);
      mySwitch.resetAvailable();
    }
  }
}
