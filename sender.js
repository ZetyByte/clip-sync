(function() {
    let uid;
    let lastPeerId = null;
    let peer = null;
    let peerId = null;
    let conn = null;
    const recipientInput = document.getElementById('receiver-id');
    const statusEl = document.getElementById('status');
    const messageEl = document.getElementById('message');
    const btnSend = document.querySelector('.send');
    const sendInput = document.getElementById('sendInput');
    const btnClear= document.querySelector('.clearMsg');
    const btnConnect = document.querySelector('.connect');

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
            statusEl.textContent = 'Awaiting connection...'; // DIFF
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

        // console.log('url param id:' + getUrlParam('id'));
        // if(getUrlParam('id') !== null) recipientInput.value = getUrlParam('id');
        // conn = peer.connect(recipientInput.value, {
        //     reliable: true
        // });
        conn = peer.connect(uid, {
            reliable: true
        });

        conn.on('open', function() {
            // document.querySelectorAll('#hide').display=none;
            statusEl.textContent = `Connected to: ${conn.peer}`;
            console.log(`Connected to: ${conn.peer}`);

            // Check URL parameters for commands that should be sent right away
            const command = getUrlParam('command');
            if(command) {
                conn.send(command);
            }
        });

        conn.on('data', function(data) {
            console.log('Data received.');
            msg = DOMPurify.sanitize(data, { USE_PROFILES: { html: false } });
            addMessage(`<p class="peerMsg">>${msg}</p>`);
        });

        conn.on('close', function() {
            statusEl.textContent = 'Connection closed.';
        });
    }
    // if(getUrlParam('id') !== null){join();}

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

    init();
    if(getUrlParam('id') !== null){ 
        uid = getUrlParam('id');
        console.log('url param id:' + uid);
    };
    btnConnect.addEventListener('click', () => {
            uid = recipientInput.value;
            join();
    }); 
    setTimeout(()=>{
        join();
    }, 1000)
    
})();