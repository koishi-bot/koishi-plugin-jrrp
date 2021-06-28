const { createHash } = require('crypto')
const { t } = require('koishi-core')

class Config {
  constructor(config) {
    config = { ...config }

    this.useDatabase = config.useDatabase ?? true
    this.levels = config.levels ?? true
    this.levelDescriptions = (this.levels && config.levelDescriptions) ?? config.levelDescriptions
    this.result = config.result ?? undefined
  }
}

module.exports.name = 'jrrp'

module.exports.apply = (ctx, config) => {
  t.set('jrrp.description', '今日人品')
  config = new Config(config)

  let levels = [], desc = {}

  if (config.levels) {
    t.set('jrrp.result', '{0} 的今日人品是：{1}。{2}')

    if (config.levelDescriptions) {
      for (const level in config.levelDescriptions) {
        desc[level] = config.levelDescriptions[level]
        levels.push(parseInt(level))
      }
    } else {
      desc = {
        '100': '买彩票可能会中大奖哦！',
        '80': '出门可能捡到 1 块钱。',
        '60': '太阳当头照，花儿对你笑。',
        '40': '还行，还行。',
        '20': '多扶一扶老奶奶吧。',
        '0': '推荐闷头睡大觉。'
      }
      levels = Object.keys(desc).map(level => parseInt(level))
    }

    levels = levels.sort((a, b) => a - b)
  } else {
    t.set('jrrp.result', '{0} 的今日人品是：{1}')
  }

  if (config.result) {
    t.set('jrrp.result', config.result)
  }

  ctx.on('connect', () => {
    if (!ctx.database) config.useDatabase = false
  })

  ctx.command('jrrp', t('jrrp.description'))
    .userFields(['name'])
    .action(({ session }) => {
      let name
      if (config.useDatabase) name = session.user.name
      if (!name) name = session.sender.nickname
      if (!name) name = session.sender.username

      let luck = createHash('sha256')
      luck.update(name)
      luck.update((new Date().getTime() / (1000 * 60 * 60 * 24)).toFixed(0))
      luck.update('42')

      let luckValue = parseInt(luck.digest('hex'), 16) % 101

      if (config.levels) {
        let descKey = 0
        for (const level of levels) {
          if (luckValue >= level) descKey = level
          else break
        }
        let luckText = desc[descKey]

        return t('jrrp.result', name, luckValue, luckText)
      } else {
        return t('jrrp.result', name, luckValue)
      }
    })
}