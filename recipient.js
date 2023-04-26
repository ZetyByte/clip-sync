(function() {
    let lastPeerId = null;
    let peer = null;
    let peerId = null;
    let conn = null;
    const recipientIdEl = document.getElementById('receiver-id');
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('message');
    const btnSend = document.querySelector('.send');
    const linkEl = document.getElementById('link');
    const sendInput = document.getElementById('sendInput');
    const btnClear= document.querySelector('.clearMsg');
    const hide = document.querySelector('.hide');
    const url = window.location.href;

    var msgJson = JSON.parse('{"visibility": "visible", "message": ""}');

    function init() {
        peer = new Peer(null, {
            debug: 2 
        });

        peer.on('open', function(id) {
            // Workaround for peer.reconnect deleting previous id
            if(peer.id === null) {
                console.log('Received null ID from peer open');
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }

            console.log(`ID: ${peer.id}`);
            recipientIdEl.textContent = `${peer.id}`;
            const qrcode = new QRCode(document.getElementById('qrcode'),`${url}sender.html?id=${peer.id}`);
            statusEl.textContent = 'Awaiting connection...';
        });

        peer.on('connection', function(newConn) {
            // If there is already a connection, deny new ones
            if(conn && conn.open) {
                newConn.on('open', function() {
                    newConn.send('Already connected to another peer.');
                    setTimeout(() => { newConn.close(); }, 500);
                });

                return;
            }

            conn = newConn;
            console.log(`Connected to: ${conn.peer}`);
            statusEl.textContent = 'Connected';
            ready();
        });

        peer.on('disconnected', function() {
            statusEl.textContent = 'Connection lost.';
            console.log('Connection lost.');
            document.getElementById('qrcode').hidden = false


            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
        });

        peer.on('close', function() {
            conn = null;
            statusEl.textContent = 'Connection closed. Please Refresh.';
            console.log('Connection closed. Please Refresh.');
        });

        peer.on('error', function(err) {
            console.log(`Error: ${err}`);
            alert(`${err}`);
        })
    }

    function ready() {
        conn.on('data', function(data64) {
            let data = JSON.parse(decodeURIComponent(atob(data64)));
            msg = data["message"];
            if(data["visibility"] === "hidden"){
                console.log('Data received.');
                addMessage(`<p class="peerMsg">>#######(Secret message)</p>`);
            } else{
                console.log('Data received.', msg);
                addMessage(`<p style="word-wrap: break-word; overflow-wrap: break-word;" class="peerMsg">>${msg}</p>`);
            }
            // automatically copies to clipboard
            writeClipboard(data["message"]);
        });

        conn.on('close', function() {
            statusEl.innerHTML = 'Connection reset<br>Awaiting connection...';
            document.getElementById('qrcode').hidden = false
            conn = null;
        });
    }

    function addMessage(msg) {
        // msg = DOMPurify.sanitize(msg, { USE_PROFILES: { html: false } });
        messageEl.innerHTML =  msg+document.getElementById('message').innerHTML;
    }

    function clearMessages() {
        messageEl.innerHTML = '';
        addMessage('(Messages cleared)');
    }

    async function writeClipboard(data) {
        try {
          await navigator.clipboard.writeText(data);
          console.log('message in clipboard');
        } catch (err) {
          console.error('Failed to copy: ', err);
        }
    }

    function readAndSendClipboard(){
        navigator.clipboard.readText().then(function(clipboardText) {
            console.log(clipboardText);
            sendMessage(clipboardText);
          });
    }

    function sendMessage(data){
        if(conn && conn.open) {
            msg = DOMPurify.sanitize(data, { USE_PROFILES: { html: false } });
            msgJson["message"] = msg;
            // Clear the input field
            sendInput.value = '';
            conn.send(btoa(encodeURIComponent(JSON.stringify(msgJson))));
            console.log(`Sent: ${msgJson}`);
            if(msgJson["visibility"] === "hidden"){
                addMessage(`<p class="selfMsg">(Secret message)#######<</p>`);
            }else addMessage(`<p style="word-wrap: break-word; overflow-wrap: break-word;" class="selfMsg">${msg}< </p>`);
        } else {
            console.log('Connection is closed.');
        }
    }

    document.querySelector('.past-clipbrd').addEventListener('click', () => {
        readAndSendClipboard();
    });

    btnClear.addEventListener('click', clearMessages);

    sendInput.addEventListener('keypress', function(event) {
        // If used pressed 'Enter'
        if(event.key === 'Enter') {
            btnSend.click();
        }
    });

    // send message
    btnSend.addEventListener('click', () => {
        sendMessage(sendInput.value);
    });
    
    // hidden
    hide.addEventListener('click', () => {
        if(hide.src == url + 'open.png'){
            hide.src = 'hidden.png';
            msgJson["visibility"] = "hidden";
        }
        else{
            hide.src = 'open.png';
            msgJson["visibility"] = "visible";
        }
    })

    init();

})();