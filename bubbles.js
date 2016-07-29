/**
 * Created by Espen on 7/21/2016.
 */
var colors = {
    getColor: function (color, opacity, rgbtransformer) {
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
    },
    blueshift: function (distance) {
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
    },
    redshift: function (distance) {
        var freq = 1 / Math.pow(distance, 2);
        //var shift = Math.round(distance / canvas.height * 100);
        return {
            r: function (r) {
                return Math.floor(Math.sin(freq * r) * 128 + 127);
            },
            g: function (g) {
                return g >> 2;
            },
            b: function (b) {
                return b >> 1;
            }
        }
    }
};

var guiProvider = function () {
    var fgColor = '#33ffff';
    var bgColor = '#001122';

    var canvas, renderCanvas;

    function prepareContext(ctx) {
        ctx.save();
        ctx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
    }

    function setupFillerGradient(ctx, bubble, colorizer, color) {
        var grd = ctx.createRadialGradient(bubble.x, bubble.y, 10, bubble.x, bubble.y, bubble.style.radius);
        grd.addColorStop(0, colors.getColor(bubble.style.color, 0.0, colorizer(bubble.style.radius * 2)).rgba);
        grd.addColorStop(1, color.rgba);
        ctx.fillStyle = grd;
    }
    function createCanvas() {
        var c = document.createElement('canvas');
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        c.style.display = 'block';
        return c;
    }

    return {
        clear: function (ctx) {
            prepareContext(ctx);
        },
        getViewCanvas: function () {
            return canvas;
        },
        getRenderCanvas: function () {
            return renderCanvas;
        },
        setupScreen: function () {
            document.body.style.margin = 0;
            document.body.style.padding = 0;
            document.body.style.backgroundColor = '#001122';
            document.body.style.mozUserSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
            document.body.style.userSelect = 'none';
            document.body.style.backgroundColor = bgColor;
            renderCanvas = createCanvas();
            canvas = createCanvas();
            canvas.id = 'screen';
            document.body.appendChild(canvas);
        }        ,
        createScoreReporter: function () {
            var s = document.createElement('div');
            s.id = 'score';
            s.innerHTML = 0;
            s.style.position = 'fixed';
            s.style.top = '2px';
            s.style.right = '2px';
            s.style.color = fgColor;
            s.style.fontSize = '22px';
            s.style.align = 'right';
            s.style.fontFamily = 'BubbleGum Sans';
            s.style.mozUserSelect = 'none';
            s.style.webkitUserSelect = 'none';
            s.style.msUserSelect = 'none';
            s.style.userSelect = 'none';
            document.body.appendChild(s);
            return {
                update: function (level, score, cfg) {
                    s.innerHTML = cfg.playerString + ' ' + cfg.levelString + level + ' ' + cfg.scoreString + score;
                }
            };
        },
        render: function (ctx, bubble) {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.style.radius, 0, Math.PI * 2);
            var colorizer = bubble.style.type === 'cpu' ? colors.blueshift : colors.redshift
            var color = colors.getColor(bubble.style.color, null, colorizer(bubble.style.radius * 2));
            ctx.strokeStyle = color.rgba;
            ctx.lineWidth = 2;
            ctx.stroke();
            setupFillerGradient(ctx, bubble, colorizer, color);
            ctx.fill();
        },
        resize: function (window) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            renderCanvas.width = window.innerWidth;
            renderCanvas.height = window.innerHeight;
        },
        drawScreen: function (viewCtx) {
            prepareContext(viewCtx);
            viewCtx.drawImage(renderCanvas, 0, 0);
            viewCtx.restore();
        }
    };
};
var config ={
    scoreString :'Poeng: ',
    levelString : 'Brett: ',
    playerString : 'Spiller 1  '
};

var startGame = function (name) {
    return {
        player: {
            name : name,
            score: 0
        },
        level: 1,
        scoreMargin: 200,
        spawnEvery: 50,
        pond: []
    };
};
(function () {
    var window = document.defaultView || document.parentWindow;
    var scoreReporter;

    var gui = guiProvider();
    gui.setupScreen();

    function resizeScreen() {
        gui.resize(window);
    }

    scoreReporter  = gui.createScoreReporter();
    scoreReporter.update(1,0, config);



    window.addEventListener('orientationchange', resizeScreen);
    window.addEventListener('resize', resizeScreen);


    var ctx = gui.getRenderCanvas().getContext('2d');
    var viewCtx = gui.getViewCanvas().getContext('2d');
    var game = startGame('Player 1');
    var counter = 0;

    function randomPosition() {
        var c = gui.getRenderCanvas();
        return {
            x: Math.floor((Math.random() * c.width) + 1),
            y: Math.floor((Math.random() * c.height) + 1)
        }
    }

    function levelUp(score) {
        if (score % 2 === 0) {
            game.level += 1;
            if (game.spawnEvery - game.level > 5) {
                game.spawnEvery -= game.level;
            } else {
                if (game.spawnEvery - 1 > 2) {
                    game.spawnEvery -= 1;
                }
            }
        }
    }

    function scoreCollision(currentBubble, bubble) {
        if (!currentBubble.style || !bubble.style) {
            return;
        }
        if (currentBubble.style.type !== bubble.style.type) {
            if (bubble.style.radius < game.scoreMargin) {
                game.player.score += 1;
                scoreReporter.update(game.player.score, game.level, config);
                levelUp(game.player.score);
            }
        }
    }

    function addBubble(bubble, type) {
        var next = game.pond.length;
        bubble.style.type = type ? type : 'cpu';
        var isHit = false;
        if (bubble.style.type !== 'cpu') {
            var indices = collidesWith(bubble);
            if (indices.length > 0) {
                isHit = true;
            }
        }
        if (!isHit) {
            game.pond[next] = bubble;
        } else {
            indices.forEach(function (index) {
                if (index < game.pond.length && game.pond[index]) {
                    scoreCollision(bubble, game.pond[index]);
                    removeFromPond(index);
                }
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


    function collidesWith(currentBubble, index) {
        var result = [];
        game.pond.forEach(function (bubble, bubbleIndex) {
            if (bubbleIndex !== index && currentBubble.hitTest(bubble)) {
                result.push(bubbleIndex);
            }
        });
        return result;
    }

    function removeFromPond(collisionIndex, index) {
        if (collisionIndex > -1) {
            game.pond.splice(collisionIndex, 1);
        }
        if (index !== undefined && index > -1) {
            game.pond.splice(index, 1);
        }
    }

    function inPond(index, colIndex) {
        return index < game.pond.length && game.pond[index] && colIndex < game.pond.length && game.pond[colIndex];
    }

    function handleCollisions(currentBubble, index) {
        var collisionIndices = collidesWith(currentBubble, index);
        if (collisionIndices.length > 0) {
            collisionIndices.forEach(function (colIndex) {
                if (inPond(index, colIndex)) {
                    scoreCollision(game.pond[colIndex], currentBubble);
                    removeFromPond(colIndex, index);
                }
            });
        }
    }

    function spawn() {
        if (counter > game.spawnEvery) {
            addBubble(makeBubble(randomPosition()));
            counter = 0;
        }
    }

    function shouldPop(currentBubble) {
        return currentBubble.diameter() > gui.getRenderCanvas().height || currentBubble.style.color < 1;
    }

    function animate() {
        gui.clear(ctx);
        game.pond.forEach(function (currentBubble, index) {
            gui.render(ctx, currentBubble);
            currentBubble.grow();
            currentBubble.fade();
            if (shouldPop(currentBubble)) {
                removeFromPond(index);
            } else {
                handleCollisions(currentBubble, index);
            }
        });
        ctx.restore();
        counter++;
        spawn();
        gui.drawScreen(viewCtx);
        window.requestAnimationFrame(animate);
    }

    addBubble(makeBubble(randomPosition()));

    gui.getViewCanvas().addEventListener('click', function (event) {
        addBubble(makeBubble(event.pageX, event.pageY), 'player');
    }, false);
    gui.getViewCanvas().addEventListener('touchmove', function (event) {
        if (!event.event || !event.event.length) {
            event.preventDefault();
            return;
        }
        for (var i = 0; i < event.event.length; i += 2) {
            var touch = event.touches[i];
            addBubble(makeBubble(touch.pageX, touch.pageY), 'cpu');
        }
        event.preventDefault();
    });
    gui.getViewCanvas().addEventListener('touchend', function (event) {
        if (!event.changedTouches || !event.changedTouches.length) {
            event.preventDefault();
            return;
        }
        for (var i = 0; i < event.changedTouches.length; i++) {
            var touch = event.changedTouches[i];
            addBubble(makeBubble(touch.pageX, touch.pageY), 'player');
        }
        event.preventDefault();
    });
    gui.getViewCanvas().addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    animate();

})();