// static/projects.js - Handles project card scroll animations (Multi-Execution Dynamic Version)

document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');

    const observer = new IntersectionObserver((entries) => { // Removed 'observer' parameter to prevent accidental unobserve calls
        entries.forEach(entry => {
            const card = entry.target;
            // Convert NodeList to Array to find the index for sequential delay
            const index = Array.from(projectCards).indexOf(card);
            const delay = index * 150; // Sequential delay of 150ms

            if (entry.isIntersecting) {
                // --- Entering Viewport (Show Animation) ---
                
                // Use setTimeout to create the sequential/staggered appearance
                setTimeout(() => {
                    card.classList.add('is-visible');
                    card.classList.remove('is-leaving');
                }, delay);
                
            } else {
                // --- Leaving Viewport (Reset State / Hide Animation) ---
                
                // Add a small delay for a cleaner exit animation (optional)
                setTimeout(() => {
                    card.classList.remove('is-visible');
                    card.classList.add('is-leaving');
                }, 50); 
                
            }
        });
    }, {
        // Root Margin: When the card is 10% away from the edge, trigger the event
        rootMargin: '0px 0px -10% 0px', 
        // Threshold: Must include 0 and 1 for entering/leaving detection
        // We use an array to detect transitions across the whole threshold.
        threshold: [0.0, 1.0] 
    });

    // Set initial state and start observing
    projectCards.forEach(card => {
        card.classList.add('fade-in'); 
        observer.observe(card);
    });
});