require('canvas-testbed')(render, start)

var bounds = {
    x: 50,
    y: 50,
    width: 450,
    height: 200
}

var cellSize = bounds.width/4
var totalCells = 30

var flick = require('./')({
    cellSize: cellSize,
    totalCells: totalCells,
    viewSize: bounds.width
})

var colors = ['gray','darkGray']

function render(ctx, width, height, dt) {
    ctx.clearRect(0,0,width,height)
    ctx.save()

    ctx.save()
    flick.update(dt)

    ctx.translate(bounds.x, bounds.y)
    ctx.beginPath()
    ctx.rect(0, 0, bounds.width, bounds.height)
    ctx.clip()
    ctx.translate(-flick.value, 0)
    for (var i=0; i<totalCells; i++) {
        ctx.fillStyle = colors[i%colors.length]
        ctx.fillRect(i*cellSize, 0, cellSize, bounds.height)
    }
    ctx.restore()

    ctx.strokeStyle = 'black'
    ctx.lineWidth = 4
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.restore()
}

function start(context, width, height) {
    var canvas = context.canvas
    var dragger = require('touches')(window, {
        target: canvas
    })
    ;['start', 'move', 'end'].forEach(function(name) {
        dragger.on(name, function(ev, pos) {
            //ignore start event if out of bounds
            if (name === 'start' && !inBounds(pos, bounds))
                return
            var x = pos[0]
            flick[name](x)
        })
    })
}

function inBounds(pos, bounds) {
    if (!bounds)
        return true
    return pos[0] >= bounds.x
        && pos[1] >= bounds.y
        && pos[0] < (bounds.x+bounds.width)
        && pos[1] < (bounds.y+bounds.height)
}
