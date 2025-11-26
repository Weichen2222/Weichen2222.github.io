// background.js - Gravity Particles Simulation with Content Collision & Click Interaction

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('blockCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set up canvas dimensions to match the viewport
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();


    // ----------------------------------------------------------------------
    // --- Customization Constants (USER CONFIGURATION AREA) ---
    // ----------------------------------------------------------------------
    const NUM_PARTICLES = 500;          // Total number of particles (顆數)
    const PARTICLE_OPACITY = 0.25;      // Global transparency (0.0 to 1.0) (深淺)
    const PARTICLE_MIN_SIZE = 0.5;        // Minimum size of a particle
    const PARTICLE_MAX_SIZE = 4.5;        // Maximum size of a particle
    
    const GRAVITY = 0.15;                // Controls the strength of gravity (重力常數)
    const MAX_SCROLL_JUMP_FORCE = 80;   // Max upward velocity on scroll (最高彈跳常數)
    const BOUNCE_DAMPING = 0.6;         // Energy retained after bouncing (0.0 to 1.0) for floor/screen
    
    // Main theme colors (RGB format is needed for mixing with global opacity)
    const COLOR_PALETTE_RGB = [
        [43, 45, 66],   // #2b2d42
        [141, 153, 174], // #8d99ae
        [237, 242, 244], // #edf2f4
        [239, 35, 60],   // #ef233c
        [217, 4, 41]    // #d90429
    ];

    // 內容碰撞的反彈阻尼係數
    const CONTENT_BOUNCE_DAMPING = 0.9; 
    // **新增:** 強制水平推力強度
    const HORIZONTAL_PUSH_FORCE = 3; 
    const CLICK_PUSH_RADIUS = 80;       // Radius around cursor where particles are pushed
    const CLICK_PUSH_FORCE = 15;        // Strength of the push force on click
    // ----------------------------------------------------------------------


    // --- Physics Constants ---
    const FRICTION = 0.99; 
    
    // --- Content Area Definition (Targets: .img for Bounce) ---
    let bounceAreas = [];

    // Function to update the bounding rectangles of content areas
    function updateBounceAreas() {
        bounceAreas = [];
        // 只針對 class="img" 進行反彈偵測
        const elementsToBounce = document.querySelectorAll('.img'); 
        elementsToBounce.forEach(el => {
            const rect = el.getBoundingClientRect();
            // 座標需要考慮頁面滾動的位置 (轉換為 Document 座標)
            bounceAreas.push({
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height
            });
        });
    }

    // Update areas on load, resize, and scroll (防止區域漂移)
    window.addEventListener('load', updateBounceAreas);
    window.addEventListener('resize', updateBounceAreas);
    window.addEventListener('scroll', updateBounceAreas);


    /**
     * Represents a single movable particle in the simulation.
     */
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 5; 
            this.vy = 0; 
            this.size = Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE) + PARTICLE_MIN_SIZE; 
            this.colorRGB = COLOR_PALETTE_RGB[Math.floor(Math.random() * COLOR_PALETTE_RGB.length)];
            this.mass = this.size / 2; 
            this.isAlive = true; 
        }

        /**
         * Checks if the particle collides with any 'bounceArea' and handles the bounce/correction.
         */
        checkContentCollisionAndBounce() {
            // 粒子的當前座標相對於 Viewport
            const viewPortX = this.x;
            const viewPortY = this.y;

            for (const area of bounceAreas) {
                // 碰撞區域轉換為 Viewport 座標
                const areaVX = area.x - window.scrollX;
                const areaVY = area.y - window.scrollY;

                // 檢查碰撞是否發生
                if (
                    viewPortX + this.size > areaVX &&
                    viewPortX - this.size < areaVX + area.width &&
                    viewPortY + this.size > areaVY &&
                    viewPortY - this.size < areaVY + area.height
                ) {
                    // Collision detected. Determine previous position.
                    const prevX = viewPortX - this.vx;
                    const prevY = viewPortY - this.vy;
                    
                    let resolved = false;

                    // --- VERTICAL COLLISION (上下碰撞) ---
                    if (prevX + this.size > areaVX && prevX - this.size < areaVX + area.width) {
                        
                        // 1. 撞擊頂部 (從上往下撞擊，最常見的「停住」情況)
                        if (prevY + this.size <= areaVY) {
                            this.y = areaVY - this.size; // 修正位置
                            this.vy *= -CONTENT_BOUNCE_DAMPING; 
                            
                            // **關鍵修正:** 強制增加一個隨機水平推力
                            const pushDirection = Math.random() < 0.5 ? -1 : 1;
                            this.vx += pushDirection * HORIZONTAL_PUSH_FORCE;
                            
                            resolved = true;
                        }
                        // 2. 撞擊底部 (從下往上撞)
                        else if (prevY - this.size >= areaVY + area.height) {
                            this.y = areaVY + area.height + this.size; // 修正位置
                            this.vy *= -CONTENT_BOUNCE_DAMPING; 
                            resolved = true;
                        }
                    }

                    // --- HORIZONTAL COLLISION (左右碰撞) ---
                    if (prevY + this.size > areaVY && prevY - this.size < areaVY + area.height) {
                        
                        // 3. 撞擊左側 (從右往左撞)
                        if (prevX + this.size <= areaVX) {
                            this.x = areaVX - this.size; // 修正位置
                            this.vx *= -CONTENT_BOUNCE_DAMPING; 
                            resolved = true;
                        }
                        // 4. 撞擊右側 (從左往右撞)
                        else if (prevX - this.size >= areaVX + area.width) {
                            this.x = areaVX + area.width + this.size; // 修正位置
                            this.vx *= -CONTENT_BOUNCE_DAMPING; 
                            resolved = true;
                        }
                    }
                    
                    if (resolved) return; 
                }
            }
        }

        /**
         * Applies physics (gravity, friction) and updates position.
         */
        update() {
            // Apply gravity and friction
            this.vy += GRAVITY * this.mass;
            this.vx *= FRICTION;

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // 1. **Content Bounce and Position Correction** (處理圖片碰撞)
            this.checkContentCollisionAndBounce();
            
            // 2. Standard screen boundary checks (Viewport)

            // Screen boundary check (Horizontal bounce)
            if (this.x - this.size < 0 || this.x + this.size > canvas.width) {
                this.vx *= -1;
                this.x = Math.max(this.size, Math.min(this.x, canvas.width - this.size)); 
            }

            // Floor collision check (Vertical bounce)
            if (this.y + this.size > canvas.height) {
                this.y = canvas.height - this.size; 
                this.vy *= -BOUNCE_DAMPING; 
            }

            // Ceiling logic: If the particle flies out of the top, reset its position to top
            if (this.y - this.size < 0) {
                this.x = Math.random() * canvas.width; 
                this.y = this.size + 1;                
                this.vy = 0;                           
                this.vx = (Math.random() - 0.5) * 5;   
            }
        }

        /**
         * Draws the particle as a solid circle (dot).
         */
        draw() {
            const [r, g, b] = this.colorRGB;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${PARTICLE_OPACITY})`; 

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
            ctx.fill();
        }

        /**
         * Applies a large upward force (negative velocity).
         */
        jump(force) {
            this.vy -= force / this.mass;
        }

        /**
         * Applies an outward push force from a given point.
         */
        push(mouseX, mouseY, force) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < CLICK_PUSH_RADIUS) {
                const angle = Math.atan2(dy, dx);
                // Inverse relationship: closer particles get a stronger push
                const pushStrength = force * (1 - distance / CLICK_PUSH_RADIUS);
                this.vx += Math.cos(angle) * pushStrength;
                this.vy += Math.sin(angle) * pushStrength;
            }
        }
    }

    // --- Initialization & Setup ---
    let particles = [];

    // 由於粒子不會死亡，我們只需初始化即可
    for (let i = 0; i < NUM_PARTICLES; i++) {
        // 初始化時，隨機在整個畫布範圍內生成
        let newParticle;
        let attempts = 0;
        const MAX_ATTEMPTS = 50;
        let isInsideArea = true;

        do {
            newParticle = new Particle(Math.random() * canvas.width, Math.random() * canvas.height);
            // 檢查粒子是否在碰撞區域內，以便重新生成
            isInsideArea = false;
            const particleX = newParticle.x;
            const particleY = newParticle.y;
            for (const area of bounceAreas) {
                const areaVX = area.x - window.scrollX;
                const areaVY = area.y - window.scrollY;
                if (
                    particleX + newParticle.size > areaVX &&
                    particleX - newParticle.size < areaVX + area.width &&
                    particleY + newParticle.size > areaVY &&
                    particleY - newParticle.size < areaVY + area.height
                ) {
                    isInsideArea = true;
                    break;
                }
            }
            attempts++;
        } while (isInsideArea && attempts < MAX_ATTEMPTS);
        
        particles.push(newParticle);
    }
    
    // --- Main Animation Loop ---
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }

    // Start the physics simulation
    animate();


    // --- Scroll Interaction (The "Jump" Feature) ---
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Check if the user is scrolling UP (scroll value decreases)
        if (currentScrollY < lastScrollY) {
            
            particles.forEach(particle => {
                // 只讓在底部或正在向上運動的粒子跳躍
                if (particle.y + particle.size > canvas.height - 5 || particle.vy > 0) {
                    const force = Math.min(MAX_SCROLL_JUMP_FORCE, Math.abs(lastScrollY - currentScrollY) * 50); 
                    particle.jump(force);
                }
            });
        }
        
        lastScrollY = currentScrollY;
    });

    // --- Cursor Click Interaction (Particles scatter) ---
    document.addEventListener('click', e => {
        particles.forEach(particle => {
            particle.push(e.clientX, e.clientY, CLICK_PUSH_FORCE);
        });
    });
});