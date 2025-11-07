#!/usr/bin/env node

// Install:
//   npm init -y
//   npm install mathjax-full
//
// Usage:
//   node tex2svg.js < in.tex > out.svg
//   magick -background none out.svg out2.png

import {mathjax} from 'mathjax-full/js/mathjax.js'
import {TeX} from 'mathjax-full/js/input/tex.js'
import {SVG} from 'mathjax-full/js/output/svg.js'
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js'
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js'

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)

const texInput = new TeX()
const svgOutput = new SVG({fontCache: 'none'})
const html = mathjax.document('', {InputJax: texInput, OutputJax: svgOutput})

// Read all stdin
let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => input += chunk)
process.stdin.on('end', () => {
  const tex = input.trim()
  if (!tex) {
    console.error('No input detected')
    process.exit(1)
  }

  const node = html.convert(tex, {display: true})

  // Extract just the <svg>
  const svgElement = adaptor.firstChild(node)
  const svgOutputString = adaptor.outerHTML(svgElement)

  const svgWithColor = svgOutputString
      .replace(/currentColor/g, '#f2f2f2ff');
  process.stdout.write(svgWithColor + '\n')
})
