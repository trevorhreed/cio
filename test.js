const chalk = require('chalk')
const io = require('./index.js')

Promise.resolve().then(x => {
  io.warn('Hello World! This is a long piece it over and over and over again. The end.')
  io.error('Oops. This little thingy failed.')
}).then(x => {
  try {
    throw new Error('I Failed. But I succeeded.')
  } catch(err) {
      io.error(err)
  }
}).then(x => {
  io.check({
    title: 'Test Suite #1',
    checks: [{
        pass: true,
        label: 'Test number 1'
    },{
        pass: true,
        label: 'Test number two'
    },{
        pass: false,
        label: 'Test # three'
    },{
        pass: true,
        label: 'Test number four'
    }]
  })
}).then(x => {
  io.log('Foo')
  io.log('Lorem ipsum dolor sit.', 'Bar')
}).then(x => {
  io.debug({
    foo: 'apple',
    bar: true,
    baz: 123.45,
    obj: {
        prop: 'value',
        arr: [
            'abc',
            'def',
            'ghi'
        ]
    }
  })

  io.debug('label', {
      foo: 'apple',
      bar: true,
      baz: 123.45,
      obj: {
          prop: 'value',
          arr: [
              'abc',
              'def',
              'ghi'
          ]
      }
  })
}).then(x => {
  io.lines({
    title: 'The Fresh Prince of Bel Aire',
    lines: [
        `This is the story all about how`,
        `My life got twist'd, turned up-side-down`,
        `And I'd like to take a minute`,
        `Just sit right there`,
        `I'll tell you how I became the prince of a town called Bel Aire`
    ]
  })
}).then(x => {
  io.options({
    title: 'All The Options On The Table',
    options: [{
        aliases: ['-e', '--env'],
        description: 'Specify the environment in which to run.'
    },{
        aliases: ['-w', '--watch'],
        description: 'Specify whether or not to continue watching files and rebuild.'
    }]
  })
}).then(x => {
  const bars = io.bars({
    title: 'Process Description',
    bars: [
        { header: 'Downloading content', progress: 0 },
        { header: 'Transforming content', progress: 0 },
        { header: 'Uploading results', progress: 0 }
    ]
  })

  const items = [{
      key: 'Downloading content',
      step: .01,
      interval: 20
  },{
      key: 'Transforming content',
      step: .07,
      interval: 200
  },{
      key: 'Uploading results',
      step: .01,
      interval: 50
  }]

  return Promise.all(
    items.map(({
        key, step, interval
    } = {}) => {
      return new Promise((resolve, reject) => {
        let progress = 0
        const go = () => {
            setTimeout(x => {
                progress += step
                if (progress > 1) {
                  progress = 1
                  resolve()
                }
                bars[key](progress)
                if (progress < 1) go()
            }, interval)
        }
        go()
      })
    })
  )
}).then(x => {
  
}).then(x => {
  
}).then(x => {
  console.log(chalk.bold.rgb(255, 255, 255)('\n\tFin.\n'))
}).catch(reason => {
  console.error(reason)
})













