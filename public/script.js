const cameras = document.getElementsByClassName('cameras');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
let dpi = window.devicePixelRatio;
const context = canvas.getContext('2d');

// Fix for blurry canvas
let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
canvas.setAttribute('height', style_height * dpi);
canvas.setAttribute('width', style_width * dpi);

const x = canvas.width / 2 - 50;
const y = canvas.height / 2 + 50;


/**
 * Manage connection to server
 * @class Connection
 */
class Connection {
    /**
     * Singleton instance
     * @type {Connection}
     */
    static instance = null;

    /**
     * Last received state
     * @type {Object}
     */
    lastState = null;

    /**
     * Socket.IO instance
     * @type {Object}
     */
    socket = null;

    options = {
        url: '/',
        cameraID: 1
    }

    /**
     * Create a new Connection
     * @param {string | null} url
     */
    constructor(url = null) {
        if (Connection.instance) {
            return Connection.instance;
        }
        Connection.instance = this;


        this.loadOptions(); // Load options from local storage


        if (url) { // If url is provided, use it, otherwise use default
            this.options.url = url;
        }

        this.socket = io(this.options.url); // Connect to server

        video.srcObject = canvas.captureStream();

        // Add event listeners
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
        Connection.instance.displayData();

    }

    /**
     * Display data on screen
     */
    displayData() {
        // display data on the video stream
        if (Connection.instance.lastState.video.program === Connection.instance.options.cameraID) {
            context.fillStyle = 'red';
        } else if (Connection.instance.lastState.video.preview === Connection.instance.options.cameraID) {
            context.fillStyle = 'green';
        } else {
            context.fillStyle = 'white';
        }

        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black';
        context.font = '225px Arial';
        context.fillText(Connection.instance.options.cameraID, x, y);
        video.srcObject = canvas.captureStream();

        // display data on the small camera divs
        for (let i = 0; i < cameras.length; i++) {
            if (i + 1 === Connection.instance.lastState.video.program) {
                cameras[i].style.backgroundColor = 'red';
            } else if (i + 1 === Connection.instance.lastState.video.preview) {
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

    /**
     * When ATEM is not connected
     */
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
     * Request to change Camera
     */
    sendCameraChange() {
        const msg = {
            camera: Connection.instance.options.cameraID,
            type: 'cameraChange'
        }
        this.socket.emit('help', msg);
    }

    /**
     * Request for Attention
     */
    sendAttention() {
        const msg = {
            camera: Connection.instance.options.cameraID,
            type: 'attention'
        }
        this.socket.emit('help', msg);
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

new Connection();


/**
 * Open settings page
 */
function openSettings() {
    document.getElementById('settingsPage').style.display = 'block';
    document.getElementById('settingsCameraID').value = Connection.instance.options.cameraID;
}

/**
 * Close settings page
 */
function closeSettings() {
    document.getElementById('settingsPage').style.display = 'none';
}

/**
 * Save settings to local storage
 */
function saveSettings() {
    Connection.instance.options.cameraID = Number(document.getElementById('settingsCameraID').value);
    Connection.instance.saveOptions();
    Connection.instance.displayData();
    closeSettings();
}

/**
 * Display error messages
 */
class ErrorAlert {
    static ele = document.getElementById('errorAlert');

    /**
     * Display a error message
     * @param message {string}
     */
    static display(message) {
        ErrorAlert.ele.innerText = message;
        ErrorAlert.ele.style.display = 'block';
    }

    /**
     * Hide the error message
     */
    static hide() {
        ErrorAlert.ele.style.display = 'none';
    }
}

/**
 * Starts the video, if it is not already playing
 */
function playVideo() {
    video.play();
}

/**
 * Change camera
 * @param id {number}
 */
function changeCamera(id) {
    Connection.instance.options.cameraID = id;
    Connection.instance.saveOptions();
    Connection.instance.displayData();
}

/**
 * Add an event listener to all cameras to change between them
 */
function setEventListener() {
    const cameras = document.getElementsByClassName('cameras');
    for (let i = 0; i < cameras.length; i++) {
        cameras[i].addEventListener('contextmenu', function (event) {
            changeCamera(i + 1);
            event.preventDefault();
        });
        console.log(cameras[i]);
    }
}

// setEventListener();

