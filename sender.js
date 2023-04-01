(function() {
    let lastPeerId = null;
    let peer = null;
    let conn = null;
    const recipientInput = document.getElementById('receiver-id');
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('message');
    const btnSend = document.querySelector('.send');
    const sendInput = document.getElementById('sendInput');
    const btnClear= document.querySelector('.clearMsg');
    const btnConnect = document.querySelector('.connect');

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
            statusEl.textContent = 'Awaiting connection...'; 
        });

        peer.on('connection', function(newConn) {
            // Deny incoming connections
            newConn.on('open', function() {
                newConn.send('Sender does not accept incoming connections.');
                setTimeout(() => { newConn.close(); }, 500);
            });
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

    function join() {
        // Close old connection
        if(conn) {
            conn.close();
        }

        if(getUrlParam('id') !== null) recipientInput.value = getUrlParam('id');
        conn = peer.connect(recipientInput.value, {
            reliable: true
        });

        conn.on('open', function() {
            statusEl.textContent = `Connected to: ${conn.peer}`;
            console.log(`Connected to: ${conn.peer}`);

            // Check URL parameters for commands that should be sent right away
            const command = getUrlParam('command');
            if(command) {
                conn.send(command);
            }
        });

        conn.on('data', function(data) {
            addMessage(`<span class="peerMsg">Peer: </span>` + data);
        });

        conn.on('close', function() {
            statusEl.textContent = 'Connection closed.';
        });
    }
    btnConnect.addEventListener('click', join);

    /*
    Get first "GET style" parameter from href.
    This enables delivering an initial command upon page load.
    */
    function getUrlParam(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        const regexS = "[\\?&]" + name + "=([^&#]*)";
        const regex = new RegExp(regexS);
        const results = regex.exec(window.location.href);
        if (results === null) // == or === ?
            return null;
        else
            return results[1];
    }

    function getTime() {
        const now = new Date();
        const options = {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone};
        const timeString = now.toLocaleTimeString([], options);
    
        return timeString;
    }

    function addMessage(msg) {
        const timeString = getTime();

        // Sanitize the message to prevent XSS (Cross-site scripting)
        msg = DOMPurify.sanitize(msg, { USE_PROFILES: { html: false } });
        messageEl.innerHTML = `<br><span class="msg-time">${timeString}</span>  
        -  ` + msg + message.innerHTML;
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
    // Automatically connect after one second delay if 'id' URL parameter is present
    setTimeout(() => {
        join(); 
    }, 1000);
})();