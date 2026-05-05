const { WebsocketProvider } = require('y-websocket');
const Y = require('yjs');

const doc1 = new Y.Doc();
const ws1 = new WebsocketProvider('ws://localhost:5000/yjs', 'test-room-123', doc1, { WebSocketPolyfill: require('ws') });
const text1 = doc1.getText('monaco');

ws1.on('status', event => {
  console.log('WS1 Status:', event.status);
});

setTimeout(() => {
    text1.insert(0, 'Hello from Client 1');
    console.log('Client 1 text:', text1.toString());
    
    const doc2 = new Y.Doc();
    const ws2 = new WebsocketProvider('ws://localhost:5000/yjs', 'test-room-123', doc2, { WebSocketPolyfill: require('ws') });
    const text2 = doc2.getText('monaco');
    
    ws2.on('status', event => {
      console.log('WS2 Status:', event.status);
    });

    setTimeout(() => {
        console.log('Client 2 text after connect:', text2.toString());
        
        text2.insert(text2.toString().length, ' + Client 2');
        console.log('Client 2 text updated:', text2.toString());
        
        setTimeout(() => {
            console.log('Client 1 text after Client 2 edit:', text1.toString());
            process.exit(0);
        }, 1000);
    }, 1000);
}, 1000);
