<h1 align="center">
  <br>
  <img src="https://gladysassistant.com/en/img/external/github-gladys-logo.png" width="200" alt="Gladys Assistant Logo" />
  <br>
  Gladys Assistant
</h1>

<h4 align="center">Your privacy-first, open-source smart home assistant</h4>

<p align="center">
  <a href="#-try-gladys-assistant">Try It</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-contribute-to-gladys">Contribute</a> •
  <a href="#-contributors">Contributors</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="https://gladysassistant.com/en/img/external/github-gladys-4-mockups-devices.jpg" alt="Gladys on multiple devices" />
</p>

---

## 🚀 Try Gladys Assistant

Spin up a local Gladys Assistant instance in seconds using Docker:

```bash
sudo docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --cgroupns=host \
  --restart=always \
  --privileged \
  --network=host \
  --name gladys \
  -e NODE_ENV=production \
  -e SERVER_PORT=80 \
  -e TZ=Europe/Paris \
  -e SQLITE_FILE_PATH=/var/lib/gladysassistant/gladys-production.db \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/gladysassistant:/var/lib/gladysassistant \
  -v /dev:/dev \
  -v /run/udev:/run/udev:ro \
  gladysassistant/gladys:v4
```

Prefer using Docker Compose? Check out our [Docker Compose installation guide](https://gladysassistant.com/docs/installation/docker-compose/).

## 📚 Getting Started

To install Gladys Assistant on your smart home setup, head over to our [official website](https://gladysassistant.com) for a step-by-step guide.

Whether you're installing on a mini-PC, a NAS or a Raspberry Pi, we've got you covered with clear instructions tailored to your setup.

---

## 🤝 Contribute to Gladys

We welcome contributions of all kinds — code, documentation, translations, or feature ideas.

Gladys is built by an open-source community, and **you can be a part of it!**

### 1. Set up your development environment

Follow the guide that matches your system to get started:

- [MacOS / Linux Setup Guide](https://gladysassistant.com/docs/dev/setup-development-environment-mac-linux/)
- [Windows Setup Guide](https://gladysassistant.com/docs/dev/setup-development-environment-windows/)

### 2. Start developing

Once your environment is ready, dive into our [contributing guide](https://gladysassistant.com/docs/dev/developing-a-service/) to understand the project structure, how to build features, and how to open a pull request.

---

## 🧑‍💻 Contributors

A huge thank you to all our amazing contributors! 💜  
Gladys wouldn't be where it is today without your help.

Thanks goes to these wonderful people 👏

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://pierregillesleymarie.com"><img src="https://avatars0.githubusercontent.com/u/7365207?v=4?s=100" width="100px;" alt="Pierre-Gilles Leymarie"/><br /><sub><b>Pierre-Gilles Leymarie</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=Pierre-Gilles" title="Code">💻</a> <a href="#business-Pierre-Gilles" title="Business development">💼</a> <a href="https://github.com/GladysAssistant/Gladys/commits?author=Pierre-Gilles" title="Documentation">📖</a> <a href="#ideas-Pierre-Gilles" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/VonOx"><img src="https://avatars2.githubusercontent.com/u/1528694?v=4?s=100" width="100px;" alt="Vincent KULAK"/><br /><sub><b>Vincent KULAK</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=VonOx" title="Code">💻</a> <a href="#infra-VonOx" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/GladysAssistant/Gladys/commits?author=VonOx" title="Documentation">📖</a> <a href="#ideas-VonOx" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.trovato.fr"><img src="https://avatars2.githubusercontent.com/u/1839717?v=4?s=100" width="100px;" alt="Alexandre Trovato"/><br /><sub><b>Alexandre Trovato</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=atrovato" title="Code">💻</a> <a href="https://github.com/GladysAssistant/Gladys/commits?author=atrovato" title="Documentation">📖</a> <a href="#ideas-atrovato" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bertrandda"><img src="https://avatars1.githubusercontent.com/u/18148265?v=4?s=100" width="100px;" alt="Bertrand d'Aure"/><br /><sub><b>Bertrand d'Aure</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=bertrandda" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Terdious"><img src="https://avatars0.githubusercontent.com/u/35010958?v=4?s=100" width="100px;" alt="Terdious"/><br /><sub><b>Terdious</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=Terdious" title="Code">💻</a> <a href="#ideas-Terdious" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sescandell"><img src="https://avatars0.githubusercontent.com/u/1559970?v=4?s=100" width="100px;" alt="Stéphane"/><br /><sub><b>Stéphane</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=sescandell" title="Code">💻</a> <a href="#infra-sescandell" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#ideas-sescandell" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://fischerdesign.co"><img src="https://avatars1.githubusercontent.com/u/8835133?v=4?s=100" width="100px;" alt="Scott Fischer"/><br /><sub><b>Scott Fischer</b></sub></a><br /><a href="#translation-Scott-Fischer" title="Translation">🌍</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thib-rdr"><img src="https://avatars2.githubusercontent.com/u/6746308?v=4?s=100" width="100px;" alt="thib_rdr"/><br /><sub><b>thib_rdr</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=thib-rdr" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.callum-macdonald.com/"><img src="https://avatars0.githubusercontent.com/u/690997?v=4?s=100" width="100px;" alt="Callum Macdonald"/><br /><sub><b>Callum Macdonald</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=chmac" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Redshark30"><img src="https://avatars1.githubusercontent.com/u/38568609?v=4?s=100" width="100px;" alt="Redshark30"/><br /><sub><b>Redshark30</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=Redshark30" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/guillaumeLamanda"><img src="https://avatars0.githubusercontent.com/u/10440081?v=4?s=100" width="100px;" alt="Lamanda "/><br /><sub><b>Lamanda </b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=guillaumeLamanda" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/link39"><img src="https://avatars0.githubusercontent.com/u/2229692?v=4?s=100" width="100px;" alt="Thibaut Courvoisier"/><br /><sub><b>Thibaut Courvoisier</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=link39" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://lebarzic.fr"><img src="https://avatars2.githubusercontent.com/u/1555884?v=4?s=100" width="100px;" alt="Frédéric Le Barzic"/><br /><sub><b>Frédéric Le Barzic</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=hotfix31" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/NickDub"><img src="https://avatars1.githubusercontent.com/u/32032645?v=4?s=100" width="100px;" alt="NickDub"/><br /><sub><b>NickDub</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=NickDub" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.fotozik.fr"><img src="https://avatars3.githubusercontent.com/u/1773153?v=4?s=100" width="100px;" alt="Cyril Beslay"/><br /><sub><b>Cyril Beslay</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=cicoub13" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/callemand"><img src="https://avatars2.githubusercontent.com/u/11317212?v=4?s=100" width="100px;" alt="callemand"/><br /><sub><b>callemand</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=callemand" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thebradleysanders"><img src="https://avatars2.githubusercontent.com/u/10698631?v=4?s=100" width="100px;" alt="Brad Sanders"/><br /><sub><b>Brad Sanders</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=thebradleysanders" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://robmccann.co.uk"><img src="https://avatars.githubusercontent.com/u/412744?v=4?s=100" width="100px;" alt="Rob McCann"/><br /><sub><b>Rob McCann</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=rob-mccann" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://bandism.net/"><img src="https://avatars.githubusercontent.com/u/22633385?v=4?s=100" width="100px;" alt="Ikko Ashimine"/><br /><sub><b>Ikko Ashimine</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=eltociear" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ehtesham.dev"><img src="https://avatars.githubusercontent.com/u/38346914?v=4?s=100" width="100px;" alt="Ehtesham Siddiqui"/><br /><sub><b>Ehtesham Siddiqui</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=siddiquiehtesham" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rpochet"><img src="https://avatars.githubusercontent.com/u/5940493?v=4?s=100" width="100px;" alt="Pochet Romuald"/><br /><sub><b>Pochet Romuald</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=rpochet" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://magarcia.io"><img src="https://avatars.githubusercontent.com/u/651610?v=4?s=100" width="100px;" alt="Martin Garcia"/><br /><sub><b>Martin Garcia</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=magarcia" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/euguuu"><img src="https://avatars.githubusercontent.com/u/9742965?v=4?s=100" width="100px;" alt="euguuu"/><br /><sub><b>euguuu</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=euguuu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jbrisavoine"><img src="https://avatars.githubusercontent.com/u/138247436?v=4?s=100" width="100px;" alt="Jonathan Brisavoine"/><br /><sub><b>Jonathan Brisavoine</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=jbrisavoine" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/GziAzman"><img src="https://avatars.githubusercontent.com/u/14886739?v=4?s=100" width="100px;" alt="Alex"/><br /><sub><b>Alex</b></sub></a><br /><a href="https://github.com/GladysAssistant/Gladys/commits?author=GziAzman" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

Read [Contributing.md](https://github.com/gladysassistant/Gladys/blob/master/.github/CONTRIBUTING.md) if you want to help us on Gladys Assistant.

## Articles

- [EN: Interview in Console #107](https://console.substack.com/p/console-104)
- [EN: Hackster.io - Gladys Assistant Is a Privacy-First Smart Home Platform — and Now Installable in Raspberry Pi Imager](https://www.hackster.io/news/gladys-assistant-is-a-privacy-first-smart-home-platform-and-now-installable-in-raspberry-pi-imager-4a84d5559c63)
- [FR: Framboise 314 - Plus de 500 installations pour l’assistant domotique Gladys !](https://www.framboise314.fr/plus-de-500-installation-pour-lassistant-domotique-gladys/)

## 📄 License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

© 2014–present Gladys Assistant.
