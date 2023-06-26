/**
 * Mock the ATEM object for testing
 */
export function mockAtem() {
    const myAtem = {
        connect: () => {
            console.log('Mock ATEM Connected');
        },
            // @ts-ignore
        on: (event, callback) => {
            console.log(`Mock ATEM on ${event}`);
            if (event === 'connected') {
                callback();
            }
        },
        state: {
            video: {
                mixEffects: [
                    {
                        programInput: 0,
                        previewInput: 0
                    },
                ]
            }
        }
    };
    return myAtem;
}
