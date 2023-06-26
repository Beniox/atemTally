import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import path from "path";
import {initializeAtem} from "./atemController";
const notifier = require('node-notifier');
const dotenv = require('dotenv');

dotenv.config()

let myAtem = initializeAtem();

// init express
const app = express();
app.use(express.json())
app.use(express.static('public'));
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/public/home.html'));
});
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */});



/**
 * Stores the state of the ATEM
 */
const atemState: AtemState = {
    video: {
        program: 0,
        preview: 0
    },
    connected: false
}

io.on("connection", (socket) => {
    socket.emit("state", atemState);

    socket.on("message", (message) => {
        console.log(message);
    });

    socket.on("help", (message) => {
        console.log(message);
        let msg = ""
        if (message.type === "attention") {
            msg = `Camera ${message.camera} needs attention`
        }
        if (message.type === "cameraChange") {
            msg = `Camera ${message.camera} wants to be changed`
        }

        notifier.notify({
            title: message.type,
            message: msg,
        });
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});


myAtem.on('connected', () => {
    console.log('connected');
    atemState.video.program = myAtem.state.video.mixEffects[0].programInput;
    atemState.video.preview = myAtem.state.video.mixEffects[0].previewInput;
    atemState.connected = true;
    io.emit("state", atemState);
});

myAtem.on('disconnected', () => {
    console.log('disconnected');
    atemState.connected = false;
    io.emit("state", atemState);
});

myAtem.on('stateChanged', (state: any, pathToChange: any) => {
    atemState.video.program = state.video.mixEffects[0].programInput;
    atemState.video.preview = state.video.mixEffects[0].previewInput;

    io.emit("state", atemState);
});

/**
 * api endpoint to change camera if mock is enabled
 */

if (process.env.MOCK === 'true') {
    app.post("/mock/random", (req, res) => {
        atemState.video.program = Math.floor(Math.random() * 4) + 1;
        atemState.video.preview = Math.floor(Math.random() * 4) + 1;
        atemState.connected = true;
        io.emit("state", atemState);
        res.sendStatus(200);
    });

    // @ts-ignore
    app.post('/mock/:camera', (req, res) => {
        const camera = parseInt(req.params.camera);
        atemState.video.program = camera;
        atemState.video.preview = camera + 1;
        atemState.connected = true;
        io.emit("state", atemState);
        console.log(`Camera ${camera} selected`);
        res.sendStatus(200);
    });
}

/**
 * api endpoint to change the Ip of the ATEM

 */
app.get('/atem', (req, res) => {
    const atem = {
        connected: atemState.connected,
        ip: process.env.ATEM_IP
    }
    res.send(atem);
});

app.post('/atem/ip', (req, res) => {
        process.env.ATEM_IP = req.body.ip;
        res.sendStatus(200);
        myAtem = initializeAtem();
        console.warn("ATEM IP changed to " + process.env.ATEM_IP);
    }
);


httpServer.listen(3000);


type AtemState = {
    video: {
        program: number;
        preview: number;
    }
    connected: boolean;
}

/**
 * Get the local IP address
 */

// @ts-ignore
const {networkInterfaces} = require('os');
const nets = networkInterfaces();
const results = [] // Or just '{}', an empty object
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            // @ts-ignore
            results.push(net.address);
        }
    }
}


notifier.notify({
    title: "ATEM TAlly is running",
    message: `Open http://${results[0]}:3000/home in your browser`,
    open: `http://${results[0]}:3000/home`,
});

console.log(`Open http://${results[0]}:3000/home in your browser`);