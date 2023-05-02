import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";

const dotenv = require('dotenv');
dotenv.config()

const {Atem} = require('atem-connection');
const myAtem = new Atem();

const notifier = require('node-notifier');

myAtem.on('info', console.log);
myAtem.on('error', console.error);
myAtem.connect(process.env.ATEM_IP);

const app = express();
app.use(express.static('public'));
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */});

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
        if(message.type === "attention") {
            msg = `Camera ${message.camera} needs attention`
        }
        if(message.type === "cameraChange") {
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

httpServer.listen(3000);


type AtemState = {
    video: {
        program: number;
        preview: number;
    }
    connected: boolean;
}

