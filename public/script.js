const cameras = document.getElementsByClassName('cameras');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

/**
 * Manage connection to server
 * @class
 */
class Connection {
    /**
     * @type {Connection}
     */
    static instance = null;

    /**
     * @type {Object}
     */
    lastState = null;

    /**
     * @type {Object}
     */
    socket = null;

    options = {
        url: '/',
        cameraID: 1
    }

    /**
     * @param {string | null} url
     */
    constructor(url = null) {
        if (Connection.instance) {
            return Connection.instance;
        }
        Connection.instance = this;

        this.loadOptions();
        if (url) {
            this.options.url = url;
        }
        this.socket = io(this.options.url);

        video.srcObject = canvas.captureStream();

        this.socket.on('connect', this.connected);
        this.socket.on('disconnect', this.disconnected);
        this.socket.on('state', this.onState);
        this.socket.on('error', this.onError);

        this.connected = this.connected.bind(this);
        this.disconnected = this.disconnected.bind(this);
        this.onState = this.onState.bind(this);

    }

    /**
     * When data is received from server
     * @param data {Object}
     */
    onState(data) {
        Connection.instance.lastState = data;
        if (!data.connected) {
            Connection.instance.showError();
            return;
        }
        ErrorAlert.hide();
        if (data.video.program === Connection.instance.options.cameraID) {
            context.fillStyle = 'red';
        } else if (data.video.preview === Connection.instance.options.cameraID) {
            context.fillStyle = 'green';
        } else {
            context.fillStyle = 'white';
        }
        context.fillRect(0, 0, canvas.width, canvas.height);
        video.srcObject = canvas.captureStream();

        for (let i = 0; i < cameras.length; i++) {
            if (i + 1 === data.video.program) {
                cameras[i].style.backgroundColor = 'red';
            } else if (i + 1 === data.video.preview) {
                cameras[i].style.backgroundColor = 'green';
            } else {
                cameras[i].style.backgroundColor = 'white';
            }
        }

    }


    /**
     * When Socket.IO throws an error
     * @param error
     */
    onError(error) {
        console.log(error);
    }

    /**
     * When Socket.IO connects to the server
     */
    connected() {
        console.log('connected');
        Connection.instance.saveOptions();
    }

    /**
     * When Socket.IO disconnects from the server
     */
    disconnected() {
        console.log('disconnected');
        ErrorAlert.display('Disconnected from server');
        Connection.instance.showError();
    }

    showError() {
        ErrorAlert.display('ATEM not connected');
        context.fillStyle = 'yellow';
        context.fillRect(0, 0, canvas.width, canvas.height);
        video.srcObject = canvas.captureStream();

        for (const element of cameras) {
            element.style.backgroundColor = 'yellow';
        }
    }

    /**
     * Send data to server
     * @param data
     */
    send(data) {
        this.socket.emit('state', data);
    }

    /**
     * Save options to local storage
     */
    saveOptions() {
        localStorage.setItem('options', JSON.stringify(this.options));
    }

    /**
     * Load options from local storage
     */
    loadOptions() {
        const options = localStorage.getItem('options');
        if (options) {
            this.options = JSON.parse(options);
        }
    }

}

new

Connection();


function openSettings() {
    document.getElementById('settingsPage').style.display = 'block';
    document.getElementById('settingsUrl').value = Connection.instance.options.url;
    document.getElementById('settingsCameraID').value = Connection.instance.options.cameraID;
}

function closeSettings() {
    document.getElementById('settingsPage').style.display = 'none';
}

function saveSettings() {
    const url = document.getElementById('settingsUrl').value;
    const cameraID = Number(document.getElementById('settingsCameraID').value);
    Connection.instance.options.url = url;
    Connection.instance.options.cameraID = cameraID;
    Connection.instance.saveOptions();
    closeSettings();
}

class ErrorAlert {
    static ele = document.getElementById('errorAlert');

    static display(message) {
        ErrorAlert.ele.innerText = message;
        ErrorAlert.ele.style.display = 'block';
    }

    static hide() {
        ErrorAlert.ele.style.display = 'none';
    }
}