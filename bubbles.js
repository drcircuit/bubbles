/**
 * Created by Espen on 7/21/2016.
 */
(function () {
    var window = document.defaultView || document.parentWindow;
    var inMemCanvas, canvas;

    document.body.style.margin = 0;
    document.body.style.padding = 0;
    document.body.style.backgroundColor = '#001122';

    function createCanvas() {
        var c = document.createElement('canvas');
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        c.style.display = 'block';
        return c;
    }

    inMemCanvas = createCanvas();
    canvas = createCanvas();
    canvas.id = 'screen';
    document.body.appendChild(canvas);

    function resizeScreen() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        inMemCanvas.width = window.innerWidth;
        inMemCanvas.height = window.innerHeight;
    }

    window.addEventListener('orientationchange', resizeScreen);
    window.addEventListener('resize', resizeScreen);

    inMemCanvas.style.backgroundColor = '#001122';

    var ctx = inMemCanvas.getContext('2d');
    var viewCtx = canvas.getContext('2d');
    var pond = [];
    var counter = 0;
    var player = {
        name:'Player 1',
        score: 0,
        scoreMargin : 200
    };
    function randomPosition() {
        return {
            x: Math.floor((Math.random() * inMemCanvas.width) + 1),
            y: Math.floor((Math.random() * inMemCanvas.height) + 1)
        }
    }

    function scoreCollision(currentBubble, bubble) {
        if (currentBubble.style.type !== bubble.style.type) {
            if(currentBubble.style.radius < player.scoreMargin){
                player.score += 1;
            }
        }
    }

    function addBubble(bubble, type) {
        var next = pond.length;
        bubble.style.type = type ? type : 'cpu';
        var isHit = false;
        if(bubble.style.type !== 'cpu'){
            var indices = collidesWith(bubble);
            if(indices.length > 0){
                isHit = true;
            }
        }
        if(!isHit) {
            pond[next] = bubble;
        } else {
            indices.forEach(function (index) {
                scoreCollision(bubble, pond[index]);
                removeFromPond(index);
            });
        }
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
            },
            hitTest: function (bubble) {
                var s1 = bubble.x - x;
                var s2 = bubble.y - y;
                var h = Math.sqrt((s1 * s1) + (s2 * s2));
                var distance = properties.radius + bubble.style.radius;
                return h < distance / 2;
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
        var freq = .4 / Math.pow(distance, 2);
        return {
            r: function (r) {
                return r >> 2;
            },
            g: function (g) {
                return g;
            },
            b: function (b) {
                return Math.floor(Math.sin(freq * b) * 128 + 127);
            }
        }
    }
    function redshift(distance) {
        var freq = 1 / Math.pow(distance, 2);
        //var shift = Math.round(distance / canvas.height * 100);
        return {
            r: function (r) {
                return  Math.floor(Math.sin(freq * r) * 128 + 127);
            },
            g: function (g) {
                return g >> 2;
            },
            b: function (b) {
                return b >> 1;
            }
        }
    }

    function prepareContext(ctx) {
        ctx.save();
        ctx.clearRect(0, 0, inMemCanvas.width, inMemCanvas.height);
    }

    function collidesWith(currentBubble, index) {
        var result = [];
        pond.forEach(function (bubble, bubbleIndex) {
            if (bubbleIndex !== index && currentBubble.hitTest(bubble)) {
                result.push(bubbleIndex);
            }
        });
        return result;
    }

    function removeFromPond(collisionIndex, index) {
        if(collisionIndex > -1){
            pond.splice(collisionIndex, 1);
        }
        if(index !== undefined && index > -1){
            pond.splice(index,1);
        }
    }

    function animate() {
        prepareContext(ctx);
        pond.forEach(function (currentBubble, index) {
            ctx.beginPath();
            ctx.arc(currentBubble.x, currentBubble.y, currentBubble.style.radius, 0, Math.PI * 2);
            var color = getColor(currentBubble.style.color, null,  currentBubble.style.type === 'cpu' ? blueshift(currentBubble.style.radius * 2) : redshift(currentBubble.style.radius * 2));
            ctx.strokeStyle = color.rgba;
            //ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
            var grd = ctx.createRadialGradient(currentBubble.x, currentBubble.y, 10, currentBubble.x, currentBubble.y, currentBubble.style.radius);

            grd.addColorStop(0, getColor(currentBubble.style.color, 0.0, currentBubble.style.type === 'cpu' ? blueshift(currentBubble.style.radius * 2) : redshift(currentBubble.style.radius * 2)).rgba);
            grd.addColorStop(1, color.rgba);
            ctx.fillStyle = grd;
            ctx.fill();
            currentBubble.grow();
            currentBubble.fade();
            if (currentBubble.diameter() > inMemCanvas.height || currentBubble.style.color < 1) {
                pond.splice(index, 1);
                console.log('removed bubble ' + index);
            } else {
                var collisionIndices = collidesWith(currentBubble, index);
                if(collisionIndices.length > 0){
                    collisionIndices.forEach(function (colIndex) {
                        scoreCollision(currentBubble, pond[colIndex]);
                        removeFromPond(colIndex, index);
                    });
                }
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
        addBubble(makeBubble(event.pageX, event.pageY), 'player');
    }, false);
    canvas.addEventListener('touchmove', function (event) {
        for (var i = 0; i < event.event.length; i += 2) {
            var touch = event.touches[i];
            addBubble(makeBubble(touch.pageX, touch.pageY),'cpu');
        }
        event.preventDefault();
    });
    canvas.addEventListener('touchend', function (event) {
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            addBubble(makeBubble(touch.pageX, touch.pageY),'player');
        }
        event.preventDefault();
    });
    canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    animate();

})();