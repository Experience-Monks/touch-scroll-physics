# touch-scroll-physics

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

[(demo)](http://jam3.github.io/touch-scroll-physics) - [(source)](test.js)

Physics for a touch-based scroll panel. Assumes a single dimension but could easily be extended to two or more.

Works best with scroll panes that have a fixed bounding region and need to "bounce" on either end. Can also "dip" into the cell edges (for example: carousels, list views, grids).

Makes no assumptions about the method of input or render engine (Canvas/DOM/WebGL/etc) but works well alongside [touches](https://github.com/Jam3/touches). Simple example:

```js
var scroller = require('touch-scroll-physics')({
    cellSize: 100,   //size of the content
    viewSize: 400    //size of the viewport / clip region 
})

//tick the scroller 
function render(dt) {
    scroller.update(dt)
}

//and hook up mouse to scroller start(x) / move(x) / end(x) 
```

See [test.js](test.js) for a more complete example with cells.

## Demo

Run the demo [here](http://jam3.github.io/touch-scroll-physics) or build it yourself like so:

```sh
git clone https://github.com/Jam3/touch-scroll-physics.git
cd touch-scroll-physics
npm install
npm start
```

Then open `localhost:9966`. You can enter `npm run build` to build the distribution bundle.

## Usage

[![NPM](https://nodei.co/npm/touch-scroll-physics.png)](https://www.npmjs.com/package/touch-scroll-physics)

#### `scroller = ScrollPhysics([opt])`

Creates a new scroller with the given options. 

- `cellSize` the size of each cell (default zero)
- `viewSize` the size of your viewport (default zero)
- `totalCells` total number of cells (default 1)
- `gutterSize` the size of the gutter (default 1/4 of viewSize)
- `dipToClosestCell` whether to smoothly snap to the edge of each cell (default false)

In the case of arbitrary scrolling (no "pages") you will typically just use a `totalCells` of 1 with the content size for `cellSize`. 

#### `scroller.start(value)`

Called to initiate a scroll event with the given value (e.g. X mouse position).

#### `scroller.move(value)`

Called to signal a move event (e.g. mouse move X).

#### `scroller.end()`

Called to end the scroll state (e.g. mouse up).

#### `scroller.value`

The value of the scroller. Typically when rendering you would translate content by the negative of this.

#### `scroller.momentum`

The current momentum for the scroller. May be useful for triggering events on swipe.

## License

MIT, see [LICENSE.md](http://github.com/Jam3/touch-scroll-physics/blob/master/LICENSE.md) for details.
