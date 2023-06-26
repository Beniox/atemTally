const { Atem } = require('atem-connection');
const {mockAtem} = require('./mockAtem');
const dotenv = require('dotenv');
dotenv.config()

/**
 * Initializes the ATEM
 */
export function initializeAtem() {
  // check for mock ATEM
  if(process.env.MOCK === 'true') {
    console.log('Mocking ATEM');

    const myAtem = mockAtem();

    return myAtem;
  }

  const myAtem = new Atem();

  myAtem.on('info', console.log);
  myAtem.on('error', console.error);

  myAtem.connect(process.env.ATEM_IP);

  return myAtem;
}
