const { getBroadcastAdresses } = require('../utils/getBroaddcastAdresses');

const DISCOVERY_PORT = 48899;
const PASSWORD = 'HF-A11ASSISTHREAD';

/**
 * @description On listening event.
 * @example
 * magicDevices.listening();
 */
function listening() {

  //const adresses = getBroadcastAdresses();
  const keyByte = new Buffer(PASSWORD, "ascii");

  const payload = keyByte;

  //this.socket.setBroadcast(true);
  this.socket.send(payload, 0, payload.length); //, DISCOVERY_PORT, '192.168.1.27');
}

module.exports = {
  listening,
};



// public final void c()
// {
//   System.out.println("smartlinkfind");
//   this.d = new DatagramPacket("smartlinkfind".getBytes(), "smartlinkfind".getBytes().length, this.b, 48899);
//   try
//   {
//     this.c.send(this.d);
//     return;
//   }
//   catch (IOException localIOException)
//   {
//     localIOException.printStackTrace();
//   }
// }

// public final void d()
// {
//   System.out.println("smartlinkfind");
//   this.d = new DatagramPacket("HF-A11ASSISTHREAD".getBytes(), "HF-A11ASSISTHREAD".getBytes().length, this.b, 48899);
//   try
//   {
//     this.c.send(this.d);
//     return;
//   }
//   catch (IOException localIOException)
//   {
//     localIOException.printStackTrace();
//   }
// }



// package com.Zengge.LEDWifiMagicHome.COMM;

// import android.util.Log;
// import com.Zengge.LEDWifiMagicHome.Model.a;
// import java.util.HashMap;

// final class d
//   implements y
// {
//   d(c paramc) {}
  
//   public final void a(byte[] paramArrayOfByte)
//   {
//     int i = 0;
//     paramArrayOfByte = new String(paramArrayOfByte, 0, paramArrayOfByte.length);
//     Log.d("Zengge", "discover ReceiveData :" + paramArrayOfByte);
//     if (paramArrayOfByte.equals("HF-A11ASSISTHREAD")) {}
//     String str;
//     do
//     {
//       do
//       {
//         do
//         {
//           return;
//           paramArrayOfByte = a.a(paramArrayOfByte);
//         } while (paramArrayOfByte == null);
//         str = paramArrayOfByte.a();
//         if ((str.startsWith("HF-LPB100-ZJ")) || (str.startsWith("HF-LPB100-ZJ002")) || (str.startsWith("HF-LPB100-ZJ001")) || (str.startsWith("HF-LPB100-ZJ011")) || (str.startsWith("HF-A11-ZJ00")) || (str.startsWith("HF-A11-ZJ")) || (str.startsWith("ZJ-Voice001")) || (str.isEmpty()) || (str.startsWith("AK001-ZJ100"))) {
//           i = 1;
//         }
//       } while (i == 0);
//       str = paramArrayOfByte.b();
//     } while (c.a(this.a).containsKey(str));
//     c.a(this.a).put(str, paramArrayOfByte);
//   }
// }


// There are three ports: TCP 80, TCP 5577 and UDP 48899. 80 serves a broken page. 5577 controls the ligthbulb. 48899 controls the router.

// The router port allows you to do anything. You can flash the firmware, use it as a proxy, read the WiFi password, make it join a different network, etc. This port is normally exposed only to the internal network. The commands are of the form AT+ followed by the name of the command and optional arguments.
// String str = localf.a("AT+WSSSID=" + paramString2 + "\r", 8000);
// paramString.a("AT+WSSSID\r");
// localObject2 = paramString.a("AT+WAP\r");
// localObject2 = paramString.a("AT+WAKEY\r");
// String str = localf.a("AT+WSLQ\r");
// paramString2 = localf.a("AT+WSKEY=" + paramString3 + "," + paramString4 + "," + paramString5 + "\r", 8000);
// paramString2 = localf.a("AT+WMODE=STA\r", 8000);
// paramString2 = localf.a("AT+Z\r", 8000);
// paramString1.a("AT+WAP=11BGN,LEDnet" + paramString2 + ",Auto\r", 5000);
// paramString1.a("AT+WAKEY=WPA2PSK,AES," + paramString3 + "\r", 5000);
// paramString1.a("AT+WAKEY=OPEN,NONE\r", 5000);
// paramString.b("AT+HIDESSID=on\r");
// paramString.b("AT+HIDESSID=off\r");
// paramString.b("AT+Z\r");
// paramj.a("AT+Q\r");
// paramString.a("AT+WMODE\r").equalsIgnoreCase("+ok=STA")) {
// localObject2 = paramString.a("AT+WSLK\r");
// if (((String)localObject2).equalsIgnoreCase("RF Off"))
// if (!paramString.a("AT+WMODE\r").equalsIgnoreCase("+ok=STA")) 
// String str = paramString.a("AT+SOCKB\r");
// if (!localc.d.equalsIgnoreCase("TCP,8805,wifi.magichue.net"))
// str = paramString.a("AT+TCPLKB\r");
// str = paramString.a("AT+MACID\r");
// str = paramString.a("AT+TCPLKB\r");
// if (!paramString.a("AT+TCPB\r").startsWith("+ok=on"))
// if (!paramString.a("AT+TCPLKB\r").startsWith("+ok=on"))
// if (!paramString.a("AT+TCPB\r").startsWith("+ok=on")
// paramString.a("AT+MACID\r")
// if (!paramString.a("AT+TCPLKB\r").startsWith("+ok=on")
// paramString.a("AT+WMODE=AP\r");
// paramString.b("AT+Z\r");
// paramString.b("AT+RELD\r");
// if (!paramString.a("AT+SOCKB=TCP,8805,wifi.magichue.net\r", 8000).startsWith("+ok"))
// if (!paramString.a("AT+SOCKB=NONE\r", 8000).startsWith("+ok"))
// if (!localf.a("AT+TCPPTB=" + paramString + "\r", 8000).startsWith("+ok"))
// if (!localf.a("AT+TCPADDB=" + (String)localObject + "\r", 8000).startsWith("+ok"))
// paramString = localf.a("AT+TCPB=on\r", 8000);
// localObject = localf.a("AT+Z\r", 8000);
// paramString = localf.a("AT+TCPB=off\r", 8000);
// paramString.a("AT+WSCAN\r", false);

// localWifiInfo.a(-90);
//           continue;
//           localWifiInfo.a("TKIP");
//           continue;
//           if (((String)localObject3).indexOf("WPAPSK") >= 0)
//           {
//             localWifiInfo.b("WPAPSK");
//             if (((String)localObject3).indexOf("AES") >= 0)
//             {
//               localWifiInfo.a("AES");
//               continue;
//             }
//             localWifiInfo.a("TKIP");
//             continue;
//           }
//           if (((String)localObject3).indexOf("WEP") >= 0)
//           {
//             localWifiInfo.b("OPEN");
//             localWifiInfo.a("WEP");
//             continue;
//           }
//           localWifiInfo.b("OPEN");
//           localWifiInfo.a("NONE");
//         }


// this.f = 49999
// this.c = new DatagramSocket(this.f);
// this.c.setBroadcast(true);


// package com.example.smartlinklib;

// import android.util.Log;
// import java.io.IOException;
// import java.io.PrintStream;
// import java.net.DatagramPacket;
// import java.net.DatagramSocket;
// import java.net.InetAddress;
// import java.net.SocketException;
// import java.net.UnknownHostException;

// final class k
// {
//   private InetAddress b;
//   private DatagramSocket c;
//   private DatagramPacket d;
//   private DatagramPacket e;
//   private int f = 49999;
//   private byte[] g = new byte['?'];
  
//   private k(h paramh)
//   {
//     try
//     {
//       this.b = InetAddress.getByName(h.d(paramh));
//       return;
//     }
//     catch (UnknownHostException paramh)
//     {
//       paramh.printStackTrace();
//     }
//   }
  
//   public final void a()
//   {
//     try
//     {
//       this.c = new DatagramSocket(this.f);
//       this.c.setBroadcast(true);
//       return;
//     }
//     catch (SocketException localSocketException)
//     {
//       localSocketException.printStackTrace();
//     }
//   }
  
//   public final void a(byte[] paramArrayOfByte)
//   {
//     this.d = new DatagramPacket(paramArrayOfByte, paramArrayOfByte.length, this.b, this.f);
//     try
//     {
//       this.c.send(this.d);
//       return;
//     }
//     catch (IOException paramArrayOfByte)
//     {
//       paramArrayOfByte.printStackTrace();
//     }
//   }
  
//   public final void b()
//   {
//     if (this.c != null) {
//       this.c.close();
//     }
//   }
  
//   public final void c()
//   {
//     System.out.println("smartlinkfind");
//     this.d = new DatagramPacket("smartlinkfind".getBytes(), "smartlinkfind".getBytes().length, this.b, 48899);
//     try
//     {
//       this.c.send(this.d);
//       return;
//     }
//     catch (IOException localIOException)
//     {
//       localIOException.printStackTrace();
//     }
//   }
  
//   public final void d()
//   {
//     System.out.println("smartlinkfind");
//     this.d = new DatagramPacket("HF-A11ASSISTHREAD".getBytes(), "HF-A11ASSISTHREAD".getBytes().length, this.b, 48899);
//     try
//     {
//       this.c.send(this.d);
//       return;
//     }
//     catch (IOException localIOException)
//     {
//       localIOException.printStackTrace();
//     }
//   }
  
//   public final void e()
//   {
//     this.e = new DatagramPacket(this.g, this.g.length);
//     new l(this).start();
//   }
  
//   public final void f()
//   {
//     Log.e(h.f(this.a), "stopReceive");
//     this.a.a = false;
//   }
// }


// https://github.com/vikstrous/zengge-lightcontrol/blob/master/README.md


// The TCP port is used to control the lightbulb and the UDP port is used to control the WiFi router on it. I will be referring to the former as the bulb port and the latter as the router port. 


// First of all, if you want to authenticate with the HTTP server, the username/password are admin/nimda. All I see is 404 errors when I try to open it in Firefox, so not very interesting. Chrome doesn't even think it's HTTP and curl hangs, so it's not the nicest web server.


// package com.Zengge.LEDWifiMagicHome.Model;

// import android.net.wifi.ScanResult;
// import java.io.Serializable;
// import java.util.ArrayList;
// import java.util.Iterator;
// import java.util.List;
// import java.util.regex.Pattern;

// public class WifiInfo
//   implements Serializable
// {
//   private String a;
//   private String b;
//   private int c = 0;
//   private String d;
  
//   public static ArrayList<WifiInfo> a(List<ScanResult> paramList)
//   {
//     ArrayList localArrayList = new ArrayList();
//     paramList = paramList.iterator();
//     if (!paramList.hasNext()) {
//       return localArrayList;
//     }
//     Object localObject1 = (ScanResult)paramList.next();
//     Object localObject2 = ((ScanResult)localObject1).SSID.replace("\"", "").replace("\"", "");
//     int i;
//     if (!((String)localObject2).startsWith("LEDnetACCF23"))
//     {
//       i = 0;
//       label68:
//       if (i != 0) {
//         break label186;
//       }
//       localObject2 = new WifiInfo();
//       ((WifiInfo)localObject2).c = ((ScanResult)localObject1).level;
//       ((WifiInfo)localObject2).d = ((ScanResult)localObject1).SSID;
//       localObject1 = ((ScanResult)localObject1).capabilities;
//       if (((String)localObject1).indexOf("WPA2-PSK") < 0) {
//         break label198;
//       }
//       ((WifiInfo)localObject2).b = "WPA2PSK";
//       if (((String)localObject1).indexOf("TKIP") < 0) {
//         break label188;
//       }
//       ((WifiInfo)localObject2).a = "TKIP";
//     }
//     for (;;)
//     {
//       localArrayList.add(localObject2);
//       break;
//       if (((String)localObject2).length() != 18)
//       {
//         i = 0;
//         break label68;
//       }
//       if (!Pattern.matches("[a-f0-9A-F]{12}", ((String)localObject2).substring(6, 18)))
//       {
//         i = 0;
//         break label68;
//       }
//       i = 1;
//       break label68;
//       label186:
//       break;
//       label188:
//       ((WifiInfo)localObject2).a = "AES";
//       continue;
//       label198:
//       if (((String)localObject1).indexOf("WPA-PSK") >= 0)
//       {
//         ((WifiInfo)localObject2).b = "WPAPSK";
//         if (((String)localObject1).indexOf("TKIP") >= 0) {
//           ((WifiInfo)localObject2).a = "TKIP";
//         } else {
//           ((WifiInfo)localObject2).a = "AES";
//         }
//       }
//       else if (((String)localObject1).indexOf("WEP") >= 0)
//       {
//         ((WifiInfo)localObject2).b = "OPEN";
//         ((WifiInfo)localObject2).a = "WEP";
//       }
//       else
//       {
//         ((WifiInfo)localObject2).b = "OPEN";
//         ((WifiInfo)localObject2).a = "NONE";
//       }
//     }
//   }
  
//   public final String a()
//   {
//     return this.a;
//   }
  
//   public final void a(int paramInt)
//   {
//     this.c = paramInt;
//   }
  
//   public final void a(String paramString)
//   {
//     this.a = paramString;
//   }
  
//   public final String b()
//   {
//     return this.b;
//   }
  
//   public final void b(String paramString)
//   {
//     this.b = paramString;
//   }
  
//   public final int c()
//   {
//     return this.c;
//   }
  
//   public final void c(String paramString)
//   {
//     this.d = paramString;
//   }
  
//   public final String d()
//   {
//     return this.d;
//   }
// }




// ADRESSES FOUND

// 192.168.43.1

// PHILIPS HUE IP - Illuminate control box
// 10.10.123.3
// 10.10.123.2
// 10.10.123.

// LEDnet