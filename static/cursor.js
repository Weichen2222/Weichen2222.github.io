const cursor = document.getElementById('cursor');

document.addEventListener('mousemove', e => {
    const margin = 5; 
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // hide cursor near edges
    if (e.clientX < margin || e.clientX > viewportWidth - margin ||
        e.clientY < margin || e.clientY > viewportHeight - margin) {
        cursor.style.opacity = 0;
    } else {
        cursor.style.opacity = 1;
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }

    // Get the element under cursor
    const elem = document.elementFromPoint(e.clientX, e.clientY);

    // If hovering a nav item (header hover), use dark cursor
    if (elem && elem.closest('.topnav ul li a:hover')) {
        cursor.style.backgroundColor = "#2b2d42"; // dark on bright hover
    } else {
        // Otherwise, decide based on approximate background brightness
        // Example: header area dark -> light cursor, body white -> dark cursor
        if (elem && elem.closest('header')) {
            cursor.style.backgroundColor = "#edf2f4"; // light cursor on dark header
        } else {
            cursor.style.backgroundColor = "#2b2d42"; // dark cursor on white body
        }
    }

        // --- Detect clickable elements and change shape ---
    if (elem && (elem.tagName === 'A' || elem.tagName === 'BUTTON' || elem.classList.contains('clickable'))) {
        cursor.style.transform = 'translate(-50%, -50%) scale(1.6)';
        cursor.style.boxShadow = "0 0 10px rgba(237,242,300,0.5)";
    } else {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.boxShadow = "none";
    }

});



document.addEventListener('mouseleave', function(e) {
    cursor.style.opacity = 1;
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});


// Click pulse effect
document.addEventListener('mousedown', e => {
    const pulse = document.createElement('div');
    pulse.classList.add('cursor-pulse');
    pulse.style.left = e.clientX + 'px';
    pulse.style.top = e.clientY + 'px';
    pulse.style.backgroundColor = cursor.style.backgroundColor; // match cursor
    document.body.appendChild(pulse);

    // trigger animation
    requestAnimationFrame(() => {
        pulse.style.transform = 'translate(-50%, -50%) scale(3)';
        pulse.style.opacity = 0;
    });

    // remove after animation
    setTimeout(() => pulse.remove(), 300);
});