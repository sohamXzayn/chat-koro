import { showReactionMenu } from './reactions.js';
import { ref, push, set, onChildAdded, onChildChanged, off, update, onValue } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
let currentChatRef = null;
let lastDateHeader = null;

/**
 * Returns HTML for Material Icons based on message status
 */
function getStatusIcon(status) {
    const style = "font-size:16px; transition: all 0.2s ease;";
    switch (status) {
        case 'seen':
            return `<span class="material-icons-round" style="${style} color:#FFFFFF;">done_all</span>`;
        case 'delivered':
            return `<span class="material-icons-round" style="${style} opacity:0.6;">done_all</span>`;
        default: // 'sent'
            return `<span class="material-icons-round" style="${style} opacity:0.6;">check</span>`;
    }
}

/**
 * 1. GLOBAL DELIVERY LISTENER
 * Call this once in index.html after login.
 * It marks messages as 'delivered' if the app is open, even if the chat isn't active.
 */
export function listenForDeliveries(db, currentUser) {
    const userChatsRef = ref(db, `userChats/${currentUser}`);
    
    onValue(userChatsRef, (snap) => {
        if (!snap.exists()) return;
        snap.forEach((child) => {
            const targetId = child.key;
            const chatId = [currentUser, targetId].sort().join("_");

            // 1. Add the Context Menu Event to the message div
div.oncontextmenu = (e) => showReactionMenu(e, db, chatId, msgId);

// 2. Display existing reactions
if (data.reactions) {
    const reactionCounts = {};
    // Count how many of each emoji exists
    Object.values(data.reactions).forEach(emoji => {
        reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });

    const reactionHtml = Object.entries(reactionCounts)
        .map(([emoji, count]) => `<span>${emoji}${count > 1 ? count : ''}</span>`)
        .join('');

    div.innerHTML += `<div class="msg-reactions">${reactionHtml}</div>`;
}
            
            // Watch for new messages in every conversation
            onChildAdded(ref(db, `chats/${chatId}`), (msgSnap) => {
                const msg = msgSnap.val();
                // If I am the receiver and it's only 'sent', mark it 'delivered'
                if (msg.sender !== currentUser && msg.status === 'sent') {
                    update(ref(db, `chats/${chatId}/${msgSnap.key}`), { status: 'delivered' });
                }
            });
        });
    });
}

/**
 * 2. OPEN SPECIFIC CHAT
 * Sets up UI and marks incoming messages as 'seen'
 */
export function openChat(db, currentUser, target) {
    if (!target) return;
    const chatId = [currentUser, target].sort().join("_");
    const msgsContainer = document.getElementById('messages');

    // ADD THIS LINE: Saves the current friend's ID on the container
    msgsContainer.dataset.activeTarget = target;
    
    msgsContainer.innerHTML = "";
    lastDateHeader = null;
    document.getElementById('msg-input').disabled = false;

    if (currentChatRef) off(currentChatRef);
    currentChatRef = ref(db, 'chats/' + chatId);

    // Listen for New Messages
    onChildAdded(currentChatRef, (snap) => {
        const data = snap.val();
        const msgId = snap.key;

        // If I am receiving this while the chat is open, mark it 'seen'
        if (data.sender !== currentUser && data.status !== 'seen') {
            update(ref(db, `chats/${chatId}/${msgId}`), { status: 'seen' });
        }

        renderMessage(msgsContainer, data, currentUser, msgId, db);
    });

    // Add/Update this inside openChat in messages.js
onChildChanged(currentChatRef, (snap) => {
    const msgId = snap.key;
    const newData = snap.val();
    
    // 1. Update Status Icons (Ticks)
    const iconElement = document.getElementById(`status-icon-${msgId}`);
    if (iconElement && newData.sender === currentUser) {
        iconElement.innerHTML = getStatusIcon(newData.status);
    }

    // 2. UPDATE REACTIONS FOR ALEX (Real-time)
    const msgDiv = document.getElementById(`msg-${msgId}`);
    if (msgDiv) {
        // Remove old reaction pill if it exists
        const oldPill = msgDiv.querySelector('.msg-reactions');
        if (oldPill) oldPill.remove();

        // If there are new reactions, render them
        if (newData.reactions) {
            const counts = {};
            Object.values(newData.reactions).forEach(emoji => counts[emoji] = (counts[emoji] || 0) + 1);
            const reactionHtml = Object.entries(counts)
                .map(([emo, count]) => `<span>${emo}${count > 1 ? count : ''}</span>`)
                .join('');
            
            // Append new pill to the message content
            const content = msgDiv.querySelector('.msg-content');
            content.insertAdjacentHTML('beforeend', `<div class="msg-reactions">${reactionHtml}</div>`);
        }
    }
});
}







/**
 * 3. SEND MESSAGE
 * Checks friend's online status to set initial 'sent' or 'delivered' state
 */
export async function send(db, currentUser, target, data) {
    if (!target) return;
    const chatId = [currentUser, target].sort().join("_");

    // Check if friend is online to decide initial status
    const friendStatusRef = ref(db, `status/${target}/online`);
    
    onValue(friendStatusRef, async (snap) => {
        const isOnline = snap.val() === true;
        const newMsgRef = push(ref(db, `chats/${chatId}`));
        
        const payload = {
            ...data,
            timestamp: Date.now(),
            sender: currentUser,
            status: isOnline ? 'delivered' : 'sent'
        };

        const updates = {};
        updates[`chats/${chatId}/${newMsgRef.key}`] = payload;
        updates[`userChats/${currentUser}/${target}`] = true;
        updates[`userChats/${target}/${currentUser}`] = true;
        
        // --- ADDED FOR SIDEBAR PREVIEW ---
        // This ensures the sidebar listener has data to display
        updates[`lastMessages/${chatId}`] = payload;

        try {
            await update(ref(db), updates);
        } catch (e) {
            console.error("Firebase Update Error:", e);
        }
    }, { onlyOnce: true });
}
/**
 * 4. UI RENDERING
 */
function renderMessage(container, data, currentUser, msgId, db) {
    if (document.getElementById(`msg-${msgId}`)) return; 

    // --- CRITICAL FIX: AI SUMMARY LOGIC ---
    // This ensures window.allMessages isn't empty when you click "Summarize"
    if (window.allMessages) {
        const senderLabel = (data.sender === currentUser) ? "You" : "Friend";
        const content = data.text || (data.voice ? "[Voice Note]" : "[Image]");
        window.allMessages.push(`${senderLabel}: ${content}`);

        // Keep it lean so the AI doesn't get confused by too much data
        if (window.allMessages.length > 50) window.allMessages.shift();
    }

    const isSent = data.sender === currentUser;
    const div = document.createElement('div');
    div.id = `msg-${msgId}`;
    div.className = `msg ${isSent ? 'sent' : 'received'}`;
    
    // --- REACTION LISTENERS ---
    const target = container.dataset.activeTarget;
    
    div.oncontextmenu = (e) => {
        const chatId = [currentUser, target].sort().join("_");
        showReactionMenu(e, db, chatId, msgId);
    };

    let touchTimer;
    div.ontouchstart = (e) => {
        const touchEvent = { 
            clientX: e.touches[0].clientX, 
            clientY: e.touches[0].clientY,
            preventDefault: () => e.preventDefault()
        }; 
        touchTimer = setTimeout(() => {
            const chatId = [currentUser, target].sort().join("_");
            if ("vibrate" in navigator) navigator.vibrate(50);
            showReactionMenu(touchEvent, db, chatId, msgId);
        }, 600); 
    };

    div.ontouchend = () => clearTimeout(touchTimer);
    div.ontouchmove = () => clearTimeout(touchTimer); 

    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isVoice = data.voice || data.type === "voice";

    // --- REACTION PILL UI ---
    let reactionHtml = "";
    if (data.reactions) {
        const counts = {};
        Object.values(data.reactions).forEach(emoji => counts[emoji] = (counts[emoji] || 0) + 1);
        reactionHtml = `<div class="msg-reactions">` + 
            Object.entries(counts).map(([emo, count]) => `<span>${emo}${count > 1 ? count : ''}</span>`).join('') + 
            `</div>`;
    }

    div.innerHTML = `
        <div class="msg-content">
            ${isVoice ? `
                <div class="custom-voice-note">
                    <button class="voice-play-btn" onclick="toggleVoice(this, '${data.voice}')">
                        <span class="material-icons-round">play_arrow</span>
                    </button>
                    <div class="voice-visualizer">
                        <div class="wave"></div><div class="wave"></div><div class="wave"></div><div class="wave"></div>
                    </div>
                    <span class="voice-duration">${data.duration || '0:00'}</span>
                </div>` : `<div>${data.text || ''}</div>`
            }
            ${data.image ? `<img src="${data.image}" class="chat-img">` : ''}
            ${reactionHtml} 
        </div>
        <div class="msg-footer">
            <span class="time">${time}</span>
            ${isSent ? getStatusIcon(data.status) : ''}
        </div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}