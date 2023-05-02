# atemTally

atemTally is a simple tally light for the Blackmagic ATEM Mini Pro. It uses a browser to show which camera is currently on air. The tally light is controlled via the ATEM's network API.

![Screenshot of the tally light](docs/img.png)

## Requirements
A Blackmagic ATEM Mini Pro (other ATEMs might work, but are untested) connected to the same network as the computer running atemTally. 
Also, a browser is required to display the tally light, a phone or tablet will do just fine.


## Installation
1. Clone this repository
2. Set the IP address of your ATEM in the `ATEM_IP` environment variable
3. Run `docker compose up -d` to start the server


## Technologies

- [Node.js](https://nodejs.org/en/)
- [TypeScript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [Socket.io](https://socket.io/)
- [atem-connection](https://www.npmjs.com/package/atem-connection)
- [node-notifier](https://www.npmjs.com/package/node-notifier)

## Goals
- [x] Display tally light in browser
- [x] Add communication Channel
- [ ] Live preview