// search.js
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

export function initSearch(db, inputId, listContainerId, currentUserId, handleOpenChat) {
    const searchInput = document.getElementById(inputId);
    const list = document.getElementById(listContainerId);

    if (!searchInput || !list) return;

    searchInput.addEventListener('input', async (e) => {
        const rawTerm = e.target.value.toLowerCase().trim();
        const term = rawTerm.startsWith('@') ? rawTerm.substring(1) : rawTerm;
        
        if (term === "") {
            refreshOriginalList(list);
            return;
        }

        toggleExtraUI(list, false);

        // Hide regular chats
        const currentItems = list.getElementsByClassName('contact-item');
        Array.from(currentItems).forEach(item => {
            if (!item.classList.contains('search-result')) {
                item.style.display = 'none';
            }
        });
        
        // Remove old search results
        const oldResults = list.getElementsByClassName('search-result');
        Array.from(oldResults).forEach(r => r.remove());

        if (term.length >= 1) { 
            const profilesRef = ref(db, 'profiles');
            const snapshot = await get(profilesRef);
            
            if (snapshot.exists()) {
                const allProfiles = snapshot.val();
                
                for (const uid in allProfiles) {
                    if (uid === currentUserId) continue; 
                    
                    const p = allProfiles[uid];
                    const fullName = (p.fullName || "").toLowerCase();
                    const username = uid.toLowerCase();

                    if (fullName.includes(term) || username.includes(term)) {
                        // Pass the functions directly to the renderer
                        renderSearchResult(list, uid, p, handleOpenChat, searchInput, refreshOriginalList);
                    }
                }
            }
        }
    });
}

function renderSearchResult(container, uid, p, handleOpenChat, inputField, refreshFn) {
    const div = document.createElement('div');
    div.className = 'contact-item search-result';
    div.style.cssText = "padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-bottom: 1px solid var(--border);";

    // THE FIX: Direct Event Listener
    div.addEventListener('click', () => {
        console.log("Opening chat with:", uid);
        inputField.value = ""; 
        refreshFn(container); 
        handleOpenChat(uid); // This executes the function from index.html
    });
    
    div.innerHTML = `
        <img src="${p.photoURL || 'https://via.placeholder.com/48'}" class="contact-img" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">
        <div style="flex:1">
            <div style="font-weight:600; font-size: 15px; color: var(--text);">${p.fullName || 'New User'}</div>
            <div style="font-size:12px; color: var(--accent); font-weight: 500;">@${uid}</div>
        </div>
        <span class="material-icons-round" style="color: var(--accent); font-size: 20px; opacity: 0.7;">send</span>
    `;
    container.appendChild(div);
}

function toggleExtraUI(container, show) {
    const extras = container.querySelectorAll('.list-banner-ad, footer, div[style*="text-align: center"]');
    extras.forEach(el => el.style.display = show ? 'block' : 'none');
}

function refreshOriginalList(container) {
    toggleExtraUI(container, true);
    const results = container.getElementsByClassName('search-result');
    Array.from(results).forEach(r => r.remove());
    
    const contacts = container.getElementsByClassName('contact-item');
    Array.from(contacts).forEach(c => c.style.display = 'flex');
}