import { io } from 'socket.io-client';

class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.brushSize = 5;
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.connectToServer();
        this.socket = io('http://localhost:3000');
        this.socket.on('draw', this.handleServerDraw.bind(this));
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
            this.socket?.emit('clear');
        });

        document.querySelector('.disconnect').addEventListener('click', () => {
            this.disconnect();
        });
    }

    connectToServer() {
        // In a real implementation, connect to your WebSocket server
        setTimeout(() => {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected!';
        }, 2000);
    }

    startDrawing(e) {
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
        if (!this.isDrawing) return;

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

        // Emit drawing data to server
        this.socket?.emit('draw', {
            x1: this.lastX,
            y1: this.lastY,
            x2: x,
            y2: y,
            color: this.currentColor,
            size: this.brushSize,
            tool: this.currentTool
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
        this.socket?.disconnect();
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }

    rgbToHex(rgb) {
        // Convert RGB string to hex
        const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (!match) return rgb;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});

