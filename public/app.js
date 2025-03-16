import { io } from 'socket.io-client';

class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.isMatched = false;
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.connectToServer();
    }

    initializeCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelector('.tool-button.active').classList.remove('active');
                button.classList.add('active');
                this.currentTool = button.dataset.tool;
            });
        });

        // Color selection
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });

        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                this.currentColor = getComputedStyle(preset).backgroundColor;
                colorPicker.value = this.rgbToHex(this.currentColor);
            });
        });

        // Brush size
        const brushSlider = document.querySelector('.brush-slider');
        brushSlider.addEventListener('input', (e) => {
            this.brushSize = e.target.value;
        });

        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        // Action buttons
        document.querySelector('.clear-canvas').addEventListener('click', () => {
            this.clearCanvas();
        });

        document.querySelector('.disconnect').addEventListener('click', () => {
            this.disconnect();
        });

        document.querySelector('.search-match').addEventListener('click', () => {
            if (!this.isMatched) {
                this.searchMatch();
            }
            else
            {
                statusText.textContent = 'Leave this session before searching for a new session';
            }
        });
    }

    connectToServer() {
        this.socket = io('http://localhost:3000');
        
        this.socket.on('searching', () => {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            statusDot.classList.remove('connected');
            statusText.textContent = 'Searching for partner...';
        });

        this.socket.on('matchFound', ({ roomId }) => {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected with partner!';
            this.isMatched = true;
            this.clearCanvas();
        });

        this.socket.on('partnerDisconnected', () => {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            statusDot.classList.remove('connected');
            statusText.textContent = 'Your partner Disconneted. Click Search to find a new partner.';
            this.isMatched = false;
        });

        this.socket.on('partnerLeftSession', () => {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            statusDot.classList.remove('connected');
            statusText.textContent = 'Your partner left the session. Click Search to find a new partner.';
            this.isMatched = false;
        });

        this.socket.on("disconnect", this.disconnect.bind(this));

        this.socket.on('draw', this.handleServerDraw.bind(this));
    }

    searchMatch() {
        this.socket.emit('searchMatch');
    }

    startDrawing(e) {
        if (!this.isMatched) return;
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }

    handleServerDraw(data) {
        this.ctx.beginPath();
        this.ctx.moveTo(data.x1, data.y1);
        this.ctx.lineTo(data.x2, data.y2);
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = data.size;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    draw(e) {
        if (!this.isDrawing || !this.isMatched) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        this.socket.emit('draw', {
            x1: this.lastX,
            y1: this.lastY,
            x2: x,
            y2: y,
            color: this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor,
            size: this.brushSize
        });

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isMatched = false;
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }
    }

    leaveSession()
    {    
        if (this.socket) {
            //this.socket.disconnect();
            this.isMatched = false;
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            statusDot.classList.remove('connected');
            statusText.textContent = 'You left the session.';
        }  
    }

    rgbToHex(rgb) {
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new DrawingApp();
    app.searchMatch(); // Start searching for a match immediately
});
