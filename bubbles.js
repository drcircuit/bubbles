/**
 * Created by Espen on 7/21/2016.
 */
var bubbles = function () {
    var window = document.defaultView || document.parentWindow;
    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.backgroundColor = '#001122';

    function setupCanvas() {
        var c = document.createElement('canvas');
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        c.style.display = 'block';
        return c;
    }

    var inMemCanvas = setupCanvas();
    var canvas = setupCanvas();

    document.body.appendChild(canvas);


    inMemCanvas.style.backgroundColor = '#001122';

    var ctx = inMemCanvas.getContext('2d');
    var viewCtx = canvas.getContext('2d');
    var pond = [];
    var counter = 0;

    function randomPosition() {
        return {
            x: Math.floor((Math.random() * inMemCanvas.width) + 1),
            y: Math.floor((Math.random() * inMemCanvas.height) + 1)
        }
    }

    function addBubble(bubble) {
        var next = pond.length;
        pond[next] = bubble;
    }

    function makeBubble(xInput, yInput) {
        var x, y;
        if (!yInput) {
            x = xInput.x;
            y = xInput.y;
        } else {
            x = xInput;
            y = yInput;
        }
        var properties = {
            radius: 1,
            color: 255
        };
        return {
            x: x,
            y: y,
            grow: function (size) {
                if (typeof size == "function") {
                    properties.radius = size(properties.radius);
                } else {
                    if (size > 0) {
                        properties.radius = properties.radius + size;
                    } else {
                        properties.radius = properties.radius + 1;
                    }
                }
            },
            fade: function (factor) {
                if (typeof factor == "function") {
                    properties.radius = factor(properties.radius);
                } else {
                    if (factor > 0) {
                        properties.color = properties.color - factor;
                    } else {
                        properties.color = properties.color - 1;
                    }
                }
            },
            style: properties,
            diameter: function () {
                return properties.radius * 2;
            }

        }
    }

    function getColor(color, opacity, rgbtransformer) {
        var r, g, b, a;
        r = color;
        g = color;
        b = color;
        a = (opacity !== undefined && opacity !== null) ? opacity : color / 255;
        if (rgbtransformer) {
            r = rgbtransformer.r(r);
            g = rgbtransformer.g(g);
            b = rgbtransformer.b(b);
        }
        return {
            r: r,
            g: g,
            b: b,
            a: a,
            rgba: 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
        };
    }

   function blueshift(distance) {
        var freq = .4/Math.pow(distance,2);
        return{
            r:function (r) {
                return r>>2;
            },
            g:function (g) {
                return g;
            },
            b:function (b) {
                return Math.floor(Math.sin(freq*b)*128+127);
            }
        }
    }

    function prepareContext(ctx) {
        ctx.save();
        ctx.clearRect(0, 0, inMemCanvas.width, inMemCanvas.height);
    }

    function animate() {
        prepareContext(ctx);
        pond.forEach(function (circle, index) {
            //ctx.translate(circle.x, circle.y);
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.style.radius, 0, Math.PI * 2);
            var color = getColor(circle.style.color, null, blueshift(circle.style.radius));
            ctx.strokeStyle = color.rgba;
            //ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
            var grd = ctx.createRadialGradient(circle.x, circle.y, 10, circle.x, circle.y, circle.style.radius);
            grd.addColorStop(0, getColor(circle.style.color, 0.0, blueshift(circle.style.radius*2)).rgba);
            grd.addColorStop(1, color.rgba);
            ctx.fillStyle = grd;
            ctx.fill();
            circle.grow();
            circle.fade();
            if (circle.diameter() > inMemCanvas.height || circle.style.color < 1) {
                pond.splice(index, 1);
                console.log('removed bubble ' + index);

            }
        });
        window.requestAnimationFrame(animate);
        ctx.restore();
        counter++;
        if (counter == 20) {
            addBubble(makeBubble(randomPosition()));
            counter = 0;
        }
        prepareContext(viewCtx);
        viewCtx.drawImage(inMemCanvas, 0, 0);
        viewCtx.restore();
    }

    addBubble(makeBubble(randomPosition()));

    canvas.addEventListener('click', function (event) {
        addBubble(makeBubble(event.pageX, event.pageY));
    }, false);
    canvas.addEventListener('touchmove', function (event) {
        for (var i = 0; i < event.touches.length; i += 2) {
            var touch = event.touches[i];
            addBubble(makeBubble(touch.pageX, touch.pageY));
        }
        event.preventDefault();
    });
    canvas.addEventListener('touchend', function (event) {
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            addBubble(makeBubble(touch.pageX, touch.pageY));
        }
        event.preventDefault();
    });
    canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    animate();

}();