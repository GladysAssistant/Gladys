#include <ArduinoJson.h>
#include <RCSwitch.h>
#include <IRremote.h>

bool recv433 = false;
bool recvIR = false;

const unsigned int THIGH = 220, TSHORT = 350, TLONG = 1400;       // Temps des états (nécessaire à l'envoi de signaux Chacon)

// Serial buffer
String command = "";

// End of command marker
char endMarker = '%';


//IRrecv irrecv_led(DATA_RECV_PIN_IR_LED);
//IRrecv irrecv_tv(DATA_RECV_PIN_IR_TV);

IRsend ir_send;                                                  // Crée une instance pour controler les led (pin 3 par défaut)
RCSwitch mySwitch = RCSwitch();                                  // Crée une instance pour la réception 433 MHz (pin 2)

decode_results results;                                         // Variable contenant le résultat des réceptions IR


/*
   Functions that will be called by Gladys
*/

void emit_ir(unsigned long code, int bit_length, int data_pin) {    // Fonction à appeler pour envoyer un code IR au ruban LED
  ir_send.changePin(data_pin);
  ir_send.sendNEC(code, bit_length);                                // code télécommande et nombre de bits
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

void enable_433(bool isEnabled, int data_pin){
  mySwitch.enableReceive(data_pin);
  recv433 = isEnabled;
}





/*
  void detectIR_LED(){                                              // Fonction à appeler dans void loop() pour permettre la détection de signaux IR du ruban LED
    if (irrecv_led.decode(&results)) {
      Serial.print("{\"action\":\"received\",\"value\":");
      Serial.print(results.value, HEX);
      Serial.println("}");
      irrecv_led.resume(); // Receive the next value
    }
    delay(100);
  }

  void detectChacon(int data_pin){                                  // Fonction à appeler dans void loop() pour permettre la détection de signaux Chacon
    unsigned long sender = listenSignalDIO(data_pin);

    if(sender != 0){
      Serial.print("{\"action\":\"received\",\"value\":");
      Serial.print(sender);
      Serial.println("}");
      delay(200);
    }
  }

  void detectRadio(){                                               // Fonction à appeler dans void loop() pour permettre la détection de signaux Radio
    if (mySwitch.available()) {
      int value = mySwitch.getReceivedValue();
      if (value == 0) {
        Serial.print("Unknown encoding");
      } else {
        Serial.print("{\"action\":\"received\",\"value\":");
        Serial.print( mySwitch.getReceivedValue() );
        Serial.println("}");
      }
      delay(200);
      mySwitch.resetAvailable();
    }
  }
*/


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
  StaticJsonBuffer<400> jsonBuffer;
  JsonObject& v = jsonBuffer.parseObject(json_data);
  //on décompose la chaine de cartère
  if ( v["function_name"] == String("emit_433") ) {
    emit_433(v["parameters"]["code"], v["parameters"]["bit_length"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("emit_433_chacon") ) {
    emit_433_chacon(v["parameters"]["code"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("emit_ir") ) {
    emit_ir(v["parameters"]["code"], v["parameters"]["bit_length"], v["parameters"]["data_pin"]);
  }
  else if ( v["function_name"] == String("enable_433") ) {
    enable_433(v["parameters"]["enable"], v["parameters"]["data_pin"]);
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

/*
  This function is used to detect 433 MHz signals from Chacon outlets
*/
/*
  unsigned long listenSignalDIO(int data_pin){
        int i = 0;                          //Variable du compteur boucle
        unsigned long t = 0;                //Variable de temps entre 2 front descendant
        byte prevBit = 0;                   //avant dernière "bit" 433 reçue
        byte bit = 0;                       //dernière "bit" 433 reçue
        unsigned long sender = 0;           //code DIO au format unsigned long - ne gère pas le bit on-off, donne 2 codes différents
        t = pulseIn(data_pin, LOW, 1000000);//réception des bits
        if(t > 2550 && t < 2800) {           //on lance le déchiffrage quand on reçoit un bit correspondant au deuxieme cadenas du signal DIO
          while(i < 64)
              {
              t = pulseIn(data_pin, LOW, 1000000);  //reception des bits
              if(t > 280 && t < 340)                //si environ 310 + ou - 30 c'est un bit à 0
                  {   bit = 0;
                  }
                  else if(t > 1300 && t < 1400) //si environ 1350 + ou moins 50 c'est un bit à 1
                        {   bit = 1;
                        }
                        else    //sinon la série est érronnée, on sort de la fonction
                        break;
             if(i % 2 == 1) // on ne traite que les deuxièmes bits (codage manchester)
                  {
                  if((prevBit ^ bit) == 0) //si faux = codage manchester KO, on sort
                       break;
                  sender <<= 1;       //on stock chaque bit dans l'unsigned long
                  sender |= prevBit;
                  }
             prevBit = bit;  //on enregistre le bit précédent
              ++i;
            }
        }
        if(i == 64){     // si on a 64 bit (i=64) on a un code DIO détecté
         return sender;
        }
     return 0; //sinon pas de code DIO
  }
*/
void setup() {

  // Open serial communications and wait for port to open:
  Serial.begin(9600);

  /*// Optional set pulse length.
    mySwitch.setPulseLength(310);

  // Start the IR receivers
  //irrecv_led.enableIRIn();
  //irrecv_tv.enableIRIn();

  //delay(1000);*/
}

void loop() {
  //detectChacon();
  //detectRadio();
  //detectIR_LED();

  if(recv433){                                                     // Partie réception 433 MHz
    if (mySwitch.available()) {
      int value = mySwitch.getReceivedValue();
      if (value == 0) {
        Serial.print("Unknown encoding");
      } else {
        Serial.print("{\"action\":\"received\",\"value\":");
        Serial.print( mySwitch.getReceivedValue() );
        Serial.println("}");
      }
      delay(200);
      mySwitch.resetAvailable();
    }
  }
  
  unsigned long sender = 0;

  if (sender != 0) {
    Serial.print("{\"action\":\"received\",\"value\":");
    Serial.print(sender);
    Serial.println("}");
    delay(200);
  }

  /*                                                             // Fonction à appeler dans void loop() pour permettre la détection de signaux IR de la TV
    if (irrecv_tv.decode(&results)) {
      Serial.print("{\"action\":\"received\",\"value\":");
      Serial.print(results.value, HEX);
      Serial.println("}");
      irrecv_tv.resume(); // Receive the next value
      delay(100);
    }*/
}
