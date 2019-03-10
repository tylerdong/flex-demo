---
template: default.html
title: Butter, Simpler Grid System
excerpt: Flexbox gives us most of the features we want from a grid system out of the box, And sizing and alignment are just on or two properties away.
---

Most grid systems today use one of two layout methods: `float` or `inline-block . But neither of these methods were really intended to be used for layout and as result have pretty significant problems and limitations.

Using floats requires clearing the which has a whole host of layout issues, most most notoriously that clearing an element sometimes forces it below an unrelated part (take this [Bootstrap issue](https://github.com/twbs/bootstrap/issues/295#issuecomment-2282969) for example). In addition, clearing float usually requires using both before and after pseudo-elements, preventing you from using them for something else.

Inline block layouts must address the problem of [white-space between inline-block items](https://github.com/twbs/bootstrap/issues/295#issuecomment-2282969), and all of the [solutions](http://davidwalsh.name/remove-whitespace-inline-block) to that problem are [hacky](https://github.com/suitcss/components-grid/blob/master/lib/grid.css#L30) and [annoying](https://twitter.com/thierrykoblentz/status/305152267374428160).

Flexbox not eliminates these problems, it opens an entirely new world of possibilities.

## Features of Flexbox Grid System

Grid system usually come with a myriad of sizing options, but the vast majority of the time you just want tow or three elements side-by-side.Given this, why should we be required to put sizing classes on every single cells?

Listed blow are some of my criteria for an ideal grid system. Fortunately, with Flexbox we get most of there features for free.

- By default, each grid cell is the same width and height as every other cell in the row. Basically they all size to fit by default.
- For finer control, you can add sizing classes to individual cells. Without these classes, the cells simply divide up the available space as usual.
- For responsive grids, you can add media query-specific classes to the cells.
- Individual cells can be aligned vertically to the top, bottom, or middle.
- When you want all of the cells in a grid to have the same sizing, media, or alignment values, you should be able to just add a single class to the container to avoid unnecessary repetition.
- Grids can be nested as many levels deep as needed.

### Basic Grids

The grid cells below do not specify any widths, they just naturally space themselves equally and expand to fit the entire row. They're also equal height by default.

<div class="Grid Grid--gutters u-textCenter">
  <div class="Grid-cell">
    <div class="Demo">1/2</div>
  </div>
  <div class="Grid-cell">
    <div class="Demo">1/2</div>
  </div>
</div>