'use strict';
const { Readable } = require('stream');
const { Writable } = require('stream');
const {Transform} = require('stream');
const fs = require("fs");

class Source extends Readable
{
  constructor(array_of_data, opt = {})
  {
    super(opt);
    this._array_of_data = array_of_data;
    this.start = 0;
    this.end = 0;
    this.on('data', (chunk)=>
    {
      var start = 0;
      var end = 0;
      console.log('\n---');
      console.log('Readable on data ');
      console.log(`chunk = ${chunk} chunk isBuffer ${Buffer.isBuffer(chunk)} and chunk.length is ${chunk.length}`);
      console.log('buffer.length ', this._readableState.buffer.length);
    })
      .on('error',(err)=>
      {
        console.log('\n------ Readable on error ', err);
      })
      .on('end',()=>
      {
        console.log('\n------ Readable on end ');
        // this.push('<table><tr><td>');
      })
      .on('close',()=>
      {
        console.log('\n------ Readable on close ');
      });
  }
  _read()
  {
    if (this.start==0) {this.start = 1; this.push("<table><tr><td>");}
    else {
      let len = this._array_of_data.length;
      if ((len == 0) && (this.end == 0)) {
        this.end = 1;
        this.push('</td></tr></table>');
      }
      if (len == 0) {
        this.push(null);
      }
      if ((len > 0) && (len < 16)) {
        let data = this._array_of_data.substr(0);
        this._array_of_data = "";
        this.push(data);
      }
      if (len > 15) {
        let data = this._array_of_data.substr(0, 16);
        this._array_of_data = this._array_of_data.substr(16);
        this.push(data);
      }
    }
  }
}

class Writer extends Writable
{
  constructor(opt = {})
  {
    super(opt);

    this.on('error', (err)=>
    {
      console.log('\n------ Writable on error', err);
    })
      .on('finish', ()=>
      {
        console.log('\n------ Writable on finish');
      })
      .on('pipe', ()=>
      {
        console.log('\n------ Writable on pipe');
      });

  }

  _write(chunk, encoding, done)
  {
    fs.appendFileSync("example11.html", chunk.toString());
    done();
  }
}

class Transformer extends Transform
{
  constructor(opt = {})
  {
    super(opt);
    this.flag = 1;
    this.on('close', ()=>
    {
      console.log('\n------ Transform on close');
    })
      .on('drain', ()=>
      {
        console.log('\n------ Transform on drain');
      })
      .on('error', (err)=>
      {
        console.log('\n------ Transform on error', err);
      })
      .on('finish', ()=>
      {
        console.log('\n------ Transform on finish');
      })
      .on('end', ()=>
      {
        console.log('\n------ Transform on end');
      })
      .on('pipe', ()=>
      {
        console.log('\n------ Transform on pipe');
      })
      .on('unpipe', ()=> {
        console.log('\n------ Transform on unpipe');
      });
  }

  _transform(chunk, encoding, done)
  {
    var data = chunk.toString();

    var rows = data.split(/\r?\n|\r/);
    data = "";
    var table = rows[0];
    for (var singleRow = 1; singleRow < rows.length; singleRow++) {
      table += '</td>';
      table += '</tr>';
      table += '<tr>';
      table += '<td>';
      table += rows[singleRow];
    }

    rows = [];
    rows = table.split(',');

    for (var rowCell = 0; rowCell < rows.length - 1; rowCell++) {
      var substr = rows[rowCell].split('"');
      if ((substr.length % 2 == 1) && this.flag == 1) {
        data += rows[rowCell];
        data += '</td>';
        data += '<td>';
      }
      if ((substr.length % 2 == 1) && this.flag == -1) {
        data += rows[rowCell];
      }
      if ((substr.length % 2 == 0)) {
        data += rows[rowCell];
        this.flag = this.flag * -1;
        data += '</td>';
        data += '<td>';
      }
    }

    var substr = rows[rows.length-1].split('"');
    if (substr.length % 2 == 1) {
      data += rows[rowCell];
    }
    if ((substr.length % 2 == 0)) {
      data += rows[rowCell];
      this.flag = this.flag * -1;
    }

    this.push(data);
    done();
  }

}
let array_of_data = fs.readFileSync("example11.csv", "utf8")
let r_opts = {};
const R = new Source(array_of_data, r_opts);

let t_opts = {};
const T = new Transformer(t_opts);

let w_opts = {};
const W = new Writer(w_opts);
R.pipe(T).pipe(W);
