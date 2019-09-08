let canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const input = document.getElementById('invisible');

let isDrawing = false;
let x = 0;
let y = 0;
let dataURL;

function drawLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    isDrawing = true;
});

canvas.addEventListener('mousemove', e => {
    if (isDrawing === true) {
        console.log('mousemove');
        const rect = canvas.getBoundingClientRect();
        drawLine(context, x, y, e.clientX - rect.left, e.clientY - rect.top);
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', e => {
    if (isDrawing === true) {
        const rect = canvas.getBoundingClientRect();
        drawLine(context, x, y, e.clientX - rect.left, e.clientY - rect.top);
        dataURL = btoa(canvas.toDataURL());
        input.value = dataURL;
        x = 0;
        y = 0;
        isDrawing = false;

    }
});