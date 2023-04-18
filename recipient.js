(function() {
    let lastPeerId = null;
    let peer = null;
    let peerId = null;
    let conn = null;
    const recipientIdEl = document.getElementById('receiver-id');
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('message');
    const btnSend = document.querySelector('.send');
    const sendInput = document.getElementById('sendInput');
    const btnClear= document.querySelector('.clearMsg');
    const hide = document.querySelector('.hide');
    const url = window.location.href;

    function init() {
        // ... new Peer([id], [options])
        peer = new Peer(null, {
            debug: 2 // Prints errors and warnings
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
            const qrcode = new QRCode(document.getElementById('qrcode'),`https://clipsync-123.web.app/sender.html?id=${peer.id}`);
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
            document.getElementById('qrcode').hidden = true;
            document.getElementById('messages').style.display='flex';
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
        conn.on('data', function(data) {
            console.log('Data received.');
            msg = DOMPurify.sanitize(data, { USE_PROFILES: { html: false } });
            addMessage(`<p class="peerMsg">>${msg}</p>`);
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
    btnClear.addEventListener('click', clearMessages);

    sendInput.addEventListener('keypress', function(event) {
        // If used pressed 'Enter'
        if(event.key === 'Enter') {
            btnSend.click();
        }
    });

    btnSend.addEventListener('click', function() {
        if(conn && conn.open) {
            const msg = DOMPurify.sanitize(sendInput.value, { USE_PROFILES: { html: false } });
            // Clear the input field
            sendInput.value = '';
            conn.send(msg);
            console.log(`Sent: ${msg}`);
            addMessage(`<p type="text" style="word-wrap: break-word; overflow-wrap: break-word;" class="selfMsg">${msg}< </p>`);
        } else {
            console.log('Connection is closed.');
        }
    });

    hide.addEventListener('click', () => {
        if(hide.src == url + 'open.png') hide.src = 'hidden.png';
        else hide.src = 'open.png'
    })

    init();

})();