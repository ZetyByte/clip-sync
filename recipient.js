(function() {
    let lastPeerId = null;
    let peer = null;
    let conn = null;
    const recipientIdEl = document.getElementById('receiver-id');
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('message');
    const btnSend = document.querySelector('.send');
    const sendInput = document.getElementById('sendInput');
    const btnClear= document.querySelector('.clearMsg');

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
            recipientIdEl.textContent = `ID: ${peer.id}`;

            const domain = 'https://alik-r.github.io/clip-sync';
            new QRCode(document.getElementById('qrcode'),`${domain}/sender.html?id=${peer.id}`);
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
            addMessage(`<span class="peerMsg">Peer: </span>` + data);
        });

        conn.on('close', function() {
            statusEl.innerHTML = 'Connection reset<br>Awaiting connection...';
            conn = null;
        });
    }

    function getTime() {
        const now = new Date();
        const options = {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone};
        const timeString = now.toLocaleTimeString([], options);
    
        return timeString;
    }

    function addMessage(msg) {
        const timeString = getTime();

        msg = DOMPurify.sanitize(msg, { USE_PROFILES: { html: false } });
        messageEl.innerHTML = `<br><span class="msg-time">${timeString}</span>  -  ` + msg + message.innerHTML;
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
            const msg = sendInput.value;
            // Clear the input field
            sendInput.value = '';
            conn.send(msg);
            console.log(`Sent: ${msg}`);
            addMessage(`<span class="selfMsg">Me: </span>${msg}`);
        } else {
            console.log('Connection is closed.');
        }
    });

    init();

})();