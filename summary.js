import { getSmartSummary } from './ai-logic.js';

const SummaryUI = {
    elements: {
        pill: document.getElementById('catch-me-up-btn'), 
        overlay: document.getElementById('summaryOverlay'),
        content: document.getElementById('summaryContent'),
        closeBtn: document.getElementById('closeSummaryBtn')
    },

    // Drag State
    isDragging: false,
    dragStarted: false,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },

    init() {
        if (!this.elements.pill) return;

        // Mouse & Touch events
        this.elements.pill.addEventListener('pointerdown', (e) => this.startDrag(e));
        document.addEventListener('pointermove', (e) => this.onDrag(e));
        document.addEventListener('pointerup', (e) => this.stopDrag(e));

        // Close logic
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', (e) => {
                if (e.target === this.elements.overlay) this.close();
            });
        }
        console.log("✅ UI Initialized - Click & Drag Active");
    },

    startDrag(e) {
        this.dragStarted = true;
        this.isDragging = false; 
        
        // Save starting point to calculate distance moved
        this.startPos.x = e.clientX;
        this.startPos.y = e.clientY;

        const rect = this.elements.pill.getBoundingClientRect();
        this.offset.x = e.clientX - rect.left;
        this.offset.y = e.clientY - rect.top;
        
        this.elements.pill.style.transition = 'none'; 
        this.elements.pill.setPointerCapture(e.pointerId);
    },

    onDrag(e) {
        if (!this.dragStarted) return;

        // Calculate how far we've moved from the start
        const moveX = Math.abs(e.clientX - this.startPos.x);
        const moveY = Math.abs(e.clientY - this.startPos.y);

        // Only start "dragging" if moved more than 5 pixels
        if (moveX > 5 || moveY > 5) {
            this.isDragging = true;
            const x = e.clientX - this.offset.x;
            const y = e.clientY - this.offset.y;

            this.elements.pill.style.left = `${x}px`;
            this.elements.pill.style.top = `${y}px`;
            this.elements.pill.style.right = 'auto'; 
            this.elements.pill.style.bottom = 'auto';
        }
    },

    stopDrag(e) {
        if (!this.dragStarted) return;
        this.dragStarted = false;
        
        this.elements.pill.style.transition = 'box-shadow 0.3s ease, transform 0.2s ease';

        // IF WE DID NOT DRAG, IT'S A CLICK
        if (!this.isDragging) {
            console.log("Acting as a Click!");
            this.handleCatchUp();
        }
    },

    async handleCatchUp() {
        // 1. Correctly grab the messages we just saw in your console
        const messages = window.allMessages; 
        
        console.log("🚀 Sending these messages to Gemma:", messages);

        if (!messages || messages.length === 0) {
            alert("No messages found to summarize!");
            return;
        }

        this.open();
        this.elements.content.innerHTML = `
            <li class="loading-state">
                <span class="spinner">🪄</span> Gemma 3 is processing...
            </li>`;

        try {
            // 2. Call the AI
            const rawSummary = await getSmartSummary(messages);
            
            console.log("✅ AI Response received:", rawSummary);

            // 3. Render it
            if (rawSummary) {
                this.render(rawSummary);
            } else {
                throw new Error("Empty response from AI");
            }
        } catch (error) {
            console.error("❌ Summary Error:", error);
            this.elements.content.innerHTML = `<li>❌ AI failed. Check your API Key or Network.</li>`;
        }
    },

    render(text) {
    // This splits by line, but keeps the text clean
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    this.elements.content.innerHTML = lines
        .map(line => {
            // If the line starts with a bullet (* or -), make it a list item
            const cleanLine = line.replace(/^[*#-\d.]+\s*/, '');
            return `<li><span class="magic-bullet">✦</span> ${cleanLine}</li>`;
        })
        .join('');
},

    open() { this.elements.overlay.style.display = 'flex'; },
    close() { this.elements.overlay.style.display = 'none'; }
};

document.addEventListener('DOMContentLoaded', () => SummaryUI.init());