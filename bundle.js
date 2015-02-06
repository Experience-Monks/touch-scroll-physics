(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var clamp = require('clamp')
var defined = require('defined')

module.exports = function integration(opt) {
    return new Integration(opt)
}

function Integration(opt) {
    opt = opt||{}

    this.value = 0
    this.momentum = 0
    
    this.totalCells = defined(opt.totalCells, 1)
    this.cellSize = defined(opt.cellSize, 1)
    this.cellSizeHalf = this.cellSize * 0.5
    this.fullSize = this.cellSize * this.totalCells
    this.viewSize = opt.viewSize || 0
    this.gutterSize = defined(opt.gutterSize, this.viewSize / 4)
    this.max = this.fullSize - this.viewSize
    this.maxGutter = this.max + this.gutterSize
    this.dipToClosestCell = opt.dipToClosestCell
    this.lastInput = 0
    this.interacting = false

    this.dipMaxSpeed = 10
    this.dipSnappiness = 0.1

    this.inputDelta = 0
    this.inputDeltaIndex = 0
    this.inputDeltaHistoryMax = 3
    this.inputDeltas = []
    for (var i = 0; i < this.inputDeltaHistoryMax; i++)
        this.inputDeltas.push(0)
}

Integration.prototype.update = function(dt) {
    var isBefore = this.value < 0
    var isAfter = this.value > this.max
    var isInside = !isBefore && !isAfter

    //ease input at edges
    if(isBefore) {
        this.momentum = 0
        if (this.inputDelta > 0) {
            this.inputDelta *= 1-(this.value / -this.gutterSize)
        }
    } else if(isAfter) {
        this.momentum = 0
        if (this.inputDelta < 0) {
            this.inputDelta *= (this.maxGutter - this.value) / this.gutterSize
        }
    }

    var dipping = !this.interacting
    
    this.value -= this.cellSizeHalf
    var dip = 0
    if (dipping) {
        if (isInside && this.dipToClosestCell) {
            dip = (((this.value % this.cellSize) + this.cellSize) % this.cellSize) - this.cellSizeHalf 
        } else if(isBefore) {
            dip = this.value + this.cellSizeHalf
        } else if(isAfter) {
            dip = this.value - this.max + this.cellSizeHalf
        }
        var dipStrength = (1-clamp(Math.abs(this.momentum) / this.dipMaxSpeed, 0, 1)) * this.dipSnappiness
        dip *= dipStrength
    }
    this.value -= this.inputDelta
    this.inputDelta = 0
    this.value -= this.momentum
    this.momentum *= 0.9
    this.value -= dip
    
    this.value += this.cellSizeHalf
    this.value = clamp(this.value, -this.gutterSize, this.maxGutter)
}

Integration.prototype.start = function(value) {
    this.interacting = true
    this.momentum = 0
    this.inputDelta = 0
    this.lastInput = value
}

Integration.prototype.move = function(value) {
    if (this.interacting) {
        this.inputDelta = value - this.lastInput
        this.inputDeltas[this.inputDeltaIndex] = this.inputDelta
        this.inputDeltaIndex = (this.inputDeltaIndex+1) % this.inputDeltaHistoryMax
        this.lastInput = value
    }
}

Integration.prototype.end = function(value) {
    if (this.interacting) {
        this.interacting = false
        this.momentum = this.inputDeltas.reduce(function(a, b) {
            return Math.abs(a) > Math.abs(b) ? a : b
        }, 0)
        this.delta = 0
        for (var i = 0; i < this.inputDeltaHistoryMax; i++)
            this.inputDeltas[i] = 0
    }
}
},{"clamp":5,"defined":6}],2:[function(require,module,exports){
module.exports = function createCanvas2D(opt) {
    if (typeof document === 'undefined')
        return null
    opt = opt||{}
    var canvas = opt.canvas || document.createElement('canvas')
    if (typeof opt.width === 'number')
        canvas.width = opt.width
    if (typeof opt.height === 'number')
        canvas.height = opt.height
    try {
        return canvas.getContext('2d', opt) || null
    } catch (e) {
        return null
    }
}
},{}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
module.exports = clamp

function clamp(value, min, max) {
  return min < max
    ? (value < min ? min : value > max ? max : value)
    : (value < max ? max : value > min ? min : value)
}

},{}],6:[function(require,module,exports){
module.exports = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) return arguments[i];
    }
};

},{}],7:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? fn() : fns.push(fn)
  }

});

},{}],8:[function(require,module,exports){
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var raf = require('raf')
var now = require('right-now')

module.exports = Engine
function Engine(fn) {
    if (!(this instanceof Engine)) 
        return new Engine(fn)
    this.running = false
    this.last = now()
    this._frame = 0
    this._tick = this.tick.bind(this)

    if (fn)
        this.on('tick', fn)
}

inherits(Engine, EventEmitter)

Engine.prototype.start = function() {
    if (this.running) 
        return
    this.running = true
    this.last = now()
    this._frame = raf(this._tick)
    return this
}

Engine.prototype.stop = function() {
    this.running = false
    if (this._frame !== 0)
        raf.cancel(this._frame)
    this._frame = 0
    return this
}

Engine.prototype.tick = function() {
    this._frame = raf(this._tick)
    var time = now()
    var dt = time - this.last
    this.emit('tick', dt)
    this.last = time
}
},{"events":3,"inherits":9,"raf":10,"right-now":12}],9:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],10:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , isNative = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  isNative = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!isNative) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":11}],11:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*
//@ sourceMappingURL=performance-now.map
*/

}).call(this,require('_process'))
},{"_process":4}],12:[function(require,module,exports){
(function (global){
module.exports =
  global.performance &&
  global.performance.now ? function now() {
    return performance.now()
  } : Date.now || function now() {
    return +new Date
  }

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],13:[function(require,module,exports){
var Emitter = require('events/')

var allEvents = [
    'touchstart', 'touchmove', 'touchend',
    'mousedown', 'mousemove', 'mouseup'
]

var ROOT = { left: 0, top: 0 }

module.exports = function handler(element, opt) {
    opt = opt||{}
    element = element || window
    
    var emitter = new Emitter()
    emitter.target = opt.target || element

    var touch = null, which = null
    var filtered = opt.filtered

    var events = allEvents

    //only a subset of events
    if (typeof opt.type === 'string') {
        events = allEvents.filter(function(type) {
            return type.indexOf(opt.type) === 0
        })
    }

    //grab the event functions
    var funcs = events.map(function(type) {
        var name = normalize(type)
        var fn = function(ev) {
            var client = ev
            if (/^touch/.test(type)) {
                if (filtered)
                    client = getFilteredTouch(ev, type)
                else
                    client = getTargetTouch(ev.changedTouches, emitter.target)
            }

            if (!client)
                return

            //get 2D position
            var pos = offset(client, emitter.target)
            
            //dispatch the normalized event to our emitter
            emitter.emit(name, ev, pos)
        }
        return { type: type, listener: fn }
    })
    
    emitter.enable = function enable() {
        funcs.forEach(listeners(element, true))
    }

    emitter.disable = function dispose() { 
        funcs.forEach(listeners(element, false))
    }

    //initially enabled
    emitter.enable() 
    return emitter

    function getFilteredTouch(ev, type) {
        var client

        //clear touch if it was lifted
        if (touch && /^touchend/.test(type)) {
            //allow end event to trigger on tracked touch
            client = getTouch(ev.changedTouches, touch.identifier|0)
            if (client)
                touch = null
        }
        //not yet tracking any touches, pick one from target
        else if (!touch && /^touchstart/.test(type)) {
            touch = client = getTargetTouch(ev.changedTouches, emitter.target)
        }
        //get the tracked touch
        else if (touch)
            client = getTouch(ev.changedTouches, touch.identifier|0)

        return client
    }
}

//get 2D client position of touch/mouse event
function offset(ev, target) {
    var cx = ev.clientX||0
    var cy = ev.clientY||0
    var rect = bounds(target)
    return [ cx - rect.left, cy - rect.top ]
}

//since we are adding events to a parent we can't rely on targetTouches
function getTargetTouch(touches, target) {
    return Array.prototype.slice.call(touches).filter(function(t) {
        return t.target === target
    })[0] || touches[0]
}

function getTouch(touches, id) {
    for (var i=0; i<touches.length; i++)
        if (touches[i].identifier === id)
            return touches[i]
    return null
}

function listeners(e, enabled) {
    return function(data) {
        if (enabled)
            e.addEventListener(data.type, data.listener)
        else
            e.removeEventListener(data.type, data.listener)
    }
}

//normalize touchstart/mousedown to "start" etc
function normalize(event) {
    return event.replace(/^(touch|mouse)/, '')
     .replace(/up$/, 'end')
     .replace(/down$/, 'start')
}

function bounds(element) {
    if (element===window
            ||element===document
            ||element===document.body)
        return ROOT
    else
        return element.getBoundingClientRect()
}
},{"events/":14}],14:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],15:[function(require,module,exports){
var touches = require('touches')

var colors = ['#7bb3d6', '#cfcfcf']
var width = 512,
    height = 300

//get a 2D canvas context
var ctx = require('2d-context')({
    width: width,
    height: height
})

//setup our scroll physics
var scroller = require('./')({
    totalCells: 25,
    viewSize: width,
    cellSize: width/4,
    gutterSize: width/4,
    dipToClosestCell: true
})

//start rendering every frame
require('raf-loop')(draw).start()

//setup DOM when ready
require('domready')(function() {
    document.body.appendChild(ctx.canvas)
    listen(ctx.canvas)
})

//draw our scene
function draw(dt) {
    //tick with milliseconds
    scroller.update(dt)

    //background
    ctx.fillStyle = '#3b3b3b'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(-scroller.value, 0)
    //draw each cell
    for (var i=0; i<scroller.totalCells; i++) {
        var cellWidth = scroller.cellSize,
            cellHeight = height

        ctx.fillStyle = colors[i%colors.length]
        ctx.fillRect(i*cellWidth, 0, cellWidth, cellHeight)
    }
    ctx.restore()

    //border
    ctx.lineWidth = 6
    ctx.strokeStyle = '#7bb3d6'
    ctx.strokeRect(0, 0, width, height)
}

function listen(element) {
    //listen for drag events on the window,
    //but use our canvas as the target
    var events = touches(window, { target: element, filtered: true })
    
    //call the start(), move() and end() functions of scroller physics
    ;['start', 'move', 'end'].forEach(function(name) {
        events.on(name, function(ev, pos) {
            //skip touch down if outside of element
            if (name === 'start' && !within(pos, element))
                return

            ev.preventDefault()

            //mouse X position
            var x = pos[0]
            scroller[name](x)
        })
    })
}

//mousedown should be ignored outside the element
function within(position, element) {
    var rect = element.getBoundingClientRect()
    return position[0] >= 0
        && position[1] >= 0
        && position[0] <  rect.width
        && position[1] <  rect.height
}
},{"./":1,"2d-context":2,"domready":7,"raf-loop":8,"touches":13}]},{},[15]);
