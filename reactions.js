// reactions.js
import { ref, update } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

const EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];
let activeMenu = null; // THIS WAS MISSING

export function showReactionMenu(event, db, chatId, msgId) {
    if (event.preventDefault) event.preventDefault();
    
    // Remove existing menu if one is already open
    if (activeMenu) {
        activeMenu.remove();
        activeMenu = null;
    }

    const menu = document.createElement('div');
    menu.className = 'reaction-menu';
    
    // Handle coordinates for both Mouse and Touch
    const x = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const y = event.clientY || (event.touches && event.touches[0].clientY) || 0;

    menu.style.position = 'fixed';
    menu.style.top = `${y - 50}px`;
    menu.style.left = `${x - 20}px`;
    menu.style.zIndex = "10000";

    EMOJIS.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'reaction-emoji';
        span.innerText = emoji;
        span.onclick = async (e) => {
            e.stopPropagation();
            const currentUser = localStorage.getItem('messengerUser');
            const updates = {};
            updates[`chats/${chatId}/${msgId}/reactions/${currentUser}`] = emoji;
            
            try {
                await update(ref(db), updates);
            } catch (err) {
                console.error("Reaction failed:", err);
            }
            
            menu.remove();
            activeMenu = null;
        };
        menu.appendChild(span);
    });

    document.body.appendChild(menu);
    activeMenu = menu;

    // Close menu if user clicks anywhere else
    const closeMenu = () => {
        if (activeMenu) {
            activeMenu.remove();
            activeMenu = null;
        }
        document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
}