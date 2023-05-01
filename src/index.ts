import express from "express";
import {createServer} from "http";
import {Server} from "socket.io";

const dotenv = require('dotenv');
dotenv.config()

const {Atem} = require('atem-connection');
const myAtem = new Atem();

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
    }
}

io.on("connection", (socket) => {
    socket.emit("state", atemState);

    socket.on("message", (message) => {
        console.log(message);
    });

    socket.on("help", (message) => {
        console.log(message);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});


myAtem.on('connected', () => {
    console.log('connected');
    atemState.video.program = myAtem.state.video.mixEffects[0].programInput;
    atemState.video.preview = myAtem.state.video.mixEffects[0].previewInput;
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
}

